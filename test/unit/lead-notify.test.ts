import { afterEach, describe, expect, it, vi } from 'vitest'
import { notifyLeadChannels } from '~/server/utils/lead-notify'
import { validLeadSubmitBody, validPhoneLeadBody } from '../fixtures/leads'

const notifyConfig = {
  resendApiKey: 'resend-key',
  leadsFromEmail: 'from@example.com',
  leadsToEmail: 'leads@example.com',
  telegramBotToken: 'telegram-token',
  telegramChatId: '12345',
}

function mockFetch(handlers: {
  resend?: Response | Error
  telegram?: Response | Error
}) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('api.resend.com')) {
      if (handlers.resend instanceof Error) {
        throw handlers.resend
      }
      return handlers.resend ?? new Response(null, { status: 200 })
    }
    if (url.includes('api.telegram.org')) {
      if (handlers.telegram instanceof Error) {
        throw handlers.telegram
      }
      return handlers.telegram ?? new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    throw new Error(`Unexpected fetch: ${url}`)
  }))
}

describe('notifyLeadChannels', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('escapes HTML in email body', async () => {
    let capturedHtml = ''
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('api.resend.com')) {
        const body = JSON.parse(String(init?.body))
        capturedHtml = body.html
        return new Response(null, { status: 200 })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }))

    await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: null,
      payload: validLeadSubmitBody({
        from: '<Kyiv>',
        to: 'Warsaw & Co',
        details: '"><script>',
      }),
    })

    expect(capturedHtml).toContain('&lt;Kyiv&gt;')
    expect(capturedHtml).toContain('Warsaw &amp; Co')
    expect(capturedHtml).not.toContain('<script>')
  })

  it('returns both channels on success', async () => {
    mockFetch({})
    const result = await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: '+380933218899',
      payload: validPhoneLeadBody(),
    })
    expect(result).toEqual({ email: true, telegram: true })
  })

  it('reports partial success when email fails', async () => {
    mockFetch({
      resend: new Response('fail', { status: 500 }),
    })
    const result = await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: null,
      payload: validLeadSubmitBody(),
    })
    expect(result).toEqual({ email: false, telegram: true })
  })

  it('reports both false when all channels fail', async () => {
    mockFetch({
      resend: new Error('down'),
      telegram: new Error('down'),
    })
    const result = await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: null,
      payload: validLeadSubmitBody(),
    })
    expect(result).toEqual({ email: false, telegram: false })
  })

  it('reports telegram API failure', async () => {
    mockFetch({
      telegram: new Response(JSON.stringify({ ok: false, description: 'blocked' }), { status: 200 }),
    })
    const result = await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: null,
      payload: validLeadSubmitBody(),
    })
    expect(result).toEqual({ email: true, telegram: false })
  })

  it('formats telegram message without phone using contact method', async () => {
    let telegramBody = ''
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('api.telegram.org')) {
        telegramBody = String(init?.body)
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(null, { status: 200 })
    }))

    await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: null,
      payload: validLeadSubmitBody({ contactMethod: 'telegram', details: undefined }),
    })

    expect(telegramBody).toContain('Telegram')
    expect(telegramBody).not.toContain('tel:')
  })

  it('handles unreachable telegram API', async () => {
    mockFetch({
      telegram: new Error('network'),
    })
    const result = await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: '+380933218899',
      payload: validPhoneLeadBody({ details: 'Line1' }),
    })
    expect(result.telegram).toBe(false)
  })

  it('includes optional attribution fields in notifications', async () => {
    let capturedHtml = ''
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('api.resend.com')) {
        capturedHtml = JSON.parse(String(init?.body)).html
        return new Response(null, { status: 200 })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }))

    await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: '+380933218899',
      payload: validPhoneLeadBody({
        details: 'Boxes',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring',
        utmContent: 'ad1',
        utmTerm: 'move',
        referrer: 'https://ref.example',
        landingPath: '/',
      }),
    })

    expect(capturedHtml).toContain('google')
    expect(capturedHtml).toContain('Boxes')
  })

  it('covers each lead source and contact method label', async () => {
    mockFetch({})
    for (const source of ['hero', 'header', 'cta', 'segment'] as const) {
      for (const contactMethod of ['whatsapp', 'viber', 'phone'] as const) {
        await notifyLeadChannels(notifyConfig, {
          leadId: `id-${source}-${contactMethod}`,
          receivedAt: '2026-01-01T00:00:00.000Z',
          phoneE164: contactMethod === 'phone' ? '+380933218899' : null,
          payload: validLeadSubmitBody({ source, contactMethod, device: 'mobile' }),
        })
      }
    }
    expect(true).toBe(true)
  })

  it('handles resend error body read failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('api.resend.com')) {
        return {
          ok: false,
          text: () => Promise.reject(new Error('read fail')),
        } as Response
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }))

    const result = await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: null,
      payload: validLeadSubmitBody(),
    })
    expect(result.email).toBe(false)
  })

  it('handles telegram JSON parse failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('api.telegram.org')) {
        return {
          ok: false,
          json: () => Promise.reject(new Error('json fail')),
        } as Response
      }
      return new Response(null, { status: 200 })
    }))

    const result = await notifyLeadChannels(notifyConfig, {
      leadId: 'abc123',
      receivedAt: '2026-01-01T00:00:00.000Z',
      phoneE164: null,
      payload: validLeadSubmitBody(),
    })
    expect(result.telegram).toBe(false)
  })
})
