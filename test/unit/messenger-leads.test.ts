import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PendingLead } from '~/shared/pending-lead'

const updatePipelineCardLastTouch = vi.fn()
const readBody = vi.fn()
const useRuntimeConfig = vi.fn()

vi.mock('~/server/utils/keycrm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/server/utils/keycrm')>()
  return {
    ...actual,
    updatePipelineCardLastTouch: (...args: unknown[]) => updatePipelineCardLastTouch(...args),
  }
})

vi.stubGlobal('readBody', readBody)
vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)
vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string, data?: unknown }) => {
  const error = Object.assign(new Error(opts.statusMessage), opts)
  return error
})

const pending = new Map<string, PendingLead>()

function bucket() {
  return {
    getItem: async (key: string) => pending.get(key) ?? null,
    setItem: async (key: string, value: PendingLead) => {
      pending.set(key, value)
    },
    getKeys: async () => [...pending.keys()],
    removeItem: async (key: string) => {
      pending.delete(key)
    },
  }
}

vi.stubGlobal('useStorage', () => bucket())

const { default: postLead } = await import('~/server/api/messenger-leads.post')

function clickBody(overrides: Record<string, unknown> = {}) {
  return {
    leadId: 'abc1234567',
    channel: 'whatsapp',
    source: 'footer',
    locale: 'ua',
    device: 'desktop',
    utmSource: 'google',
    utmMedium: 'cpc',
    gclid: 'last-click',
    referrer: 'https://google.com',
    landingPath: '/?gclid=last-click',
    firstUtmSource: 'facebook',
    gaClientId: '111.222',
    fbp: 'fb.1.10.999',
    ...overrides,
  }
}

async function post(body: unknown, apiKey: string | undefined = 'secret') {
  readBody.mockResolvedValue(body)
  useRuntimeConfig.mockReturnValue({ keycrmApiKey: apiKey })
  return postLead({} as never)
}

describe('POST /api/messenger-leads', () => {
  beforeEach(() => {
    pending.clear()
    updatePipelineCardLastTouch.mockReset()
    updatePipelineCardLastTouch.mockResolvedValue({ ok: true, id: 15 })
    vi.stubGlobal('useStorage', () => bucket())
  })

  it('returns 400 for a phone click', async () => {
    await expect(post(clickBody({ channel: 'phone', leadId: 'bbbbbbbbbb' }))).rejects.toMatchObject({
      statusCode: 400,
    })
    expect(pending.size).toBe(0)
  })

  it('stores the click and does not create a card', async () => {
    const body = clickBody({ leadId: 'cccccccccc' })
    await expect(post(body)).resolves.toEqual({ ok: true, leadId: 'cccccccccc' })
    await expect(post(body)).resolves.toEqual({ ok: true, leadId: 'cccccccccc' })

    expect(updatePipelineCardLastTouch).not.toHaveBeenCalled()
    expect(pending.get('cccccccccc')).toMatchObject({
      kind: 'click',
      channel: 'whatsapp',
      leadId: 'cccccccccc',
      gclid: 'last-click',
      firstUtmSource: 'facebook',
      gaClientId: '111.222',
    })
    expect(pending.get('cccccccccc')?.from).toBeUndefined()
  })

  it('moves the window on a repeat click and keeps an untagged visit off the card', async () => {
    await post(clickBody({ leadId: 'eeeeeeeeee' }))
    const firstTouch = pending.get('eeeeeeeeee')?.lastTouchAt
    await new Promise(resolve => setTimeout(resolve, 5))

    await post(clickBody({
      leadId: 'eeeeeeeeee',
      utmSource: 'direct',
      utmMedium: 'direct',
      gclid: undefined,
    }))

    expect(pending.get('eeeeeeeeee')?.gclid).toBe('last-click')
    expect(pending.get('eeeeeeeeee')?.lastTouchAt).not.toBe(firstTouch)
    expect(updatePipelineCardLastTouch).not.toHaveBeenCalled()
  })

  it('returns 502 when the pending store write fails', async () => {
    vi.stubGlobal('useStorage', () => ({
      getItem: async () => null,
      setItem: async () => {
        throw new Error('disk full')
      },
      getKeys: async () => [],
      removeItem: async () => undefined,
    }))

    await expect(post(clickBody({ leadId: 'ffffffff01' }))).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Pending lead was not saved',
    })
  })

  it('puts a new tagged last touch onto the matched chat card', async () => {
    pending.set('abc1234567', {
      leadId: 'abc1234567',
      kind: 'click',
      channel: 'whatsapp',
      lastTouchAt: '2026-11-25T06:00:00.000Z',
      source: 'footer',
      locale: 'ua',
      device: 'desktop',
      utmSource: 'google',
      utmMedium: 'cpc',
      gclid: 'last-click',
      matchedCardId: 15,
    })

    await expect(post(clickBody({
      utmSource: 'facebook',
      utmMedium: 'cpc',
      gclid: undefined,
      fbclid: 'click-b',
    }))).resolves.toEqual({ ok: true, leadId: 'abc1234567' })

    expect(updatePipelineCardLastTouch).toHaveBeenCalledWith('secret', 15, expect.objectContaining({
      fbclid: 'click-b',
      utmSource: 'facebook',
      matchedCardId: 15,
    }))
    expect(pending.get('abc1234567')?.gclid).toBeUndefined()
    expect(pending.get('abc1234567')?.fbclid).toBe('click-b')
  })
})
