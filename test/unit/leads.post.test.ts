import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validLeadSubmitBody, validPhoneLeadBody } from '../fixtures/leads'

const verifyTurnstileToken = vi.fn()
const notifyLeadChannels = vi.fn()
const createPipelineCard = vi.fn()
const readBody = vi.fn()
const useRuntimeConfig = vi.fn()
const getRequestIP = vi.fn()
const getHeader = vi.fn()
const fetchMock = vi.fn()

vi.mock('~/server/utils/turnstile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/server/utils/turnstile')>()
  return {
    ...actual,
    verifyTurnstileToken: (...args: unknown[]) => verifyTurnstileToken(...args),
  }
})

vi.mock('~/server/utils/lead-notify', () => ({
  notifyLeadChannels: (...args: unknown[]) => notifyLeadChannels(...args),
}))

vi.mock('~/server/utils/keycrm', () => ({
  buildPipelineCard: (ctx: unknown) => ({ built: ctx }),
  createPipelineCard: (...args: unknown[]) => createPipelineCard(...args),
}))

vi.stubGlobal('readBody', readBody)
vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)
vi.stubGlobal('getRequestIP', getRequestIP)
vi.stubGlobal('getHeader', getHeader)
vi.stubGlobal('fetch', fetchMock)
vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string, data?: unknown }) => {
  const error = Object.assign(new Error(opts.statusMessage), opts)
  return error
})

const { default: handler } = await import('~/server/api/leads.post')

const STAPE_URL = 'https://example.stape.io'

function defaultRuntimeConfig(overrides: Record<string, unknown> = {}) {
  return {
    deployEnv: 'development',
    turnstileSecret: 'secret',
    resendApiKey: 'key',
    leadsFromEmail: 'from@example.com',
    leadsToEmail: 'to@example.com',
    telegramBotToken: 'token',
    telegramChatId: '123',
    stapeTaggingUrl: '',
    public: { siteUrl: 'https://easy-west.com' },
    ...overrides,
  }
}

function stapeBody(): Record<string, string> {
  const init = fetchMock.mock.calls[0]?.[1] as { body?: string } | undefined
  return JSON.parse(init?.body ?? '{}') as Record<string, string>
}

async function callHandler(body: unknown, configOverrides: Record<string, unknown> = {}) {
  readBody.mockResolvedValue(body)
  useRuntimeConfig.mockReturnValue(defaultRuntimeConfig(configOverrides))
  getRequestIP.mockReturnValue('127.0.0.1')
  return handler({} as never)
}

const pendingLeads = new Map<string, { kind?: string, channel?: string, from?: string }>()

describe('POST /api/leads handler', () => {
  beforeEach(() => {
    pendingLeads.clear()
    vi.stubGlobal('useStorage', () => ({
      getItem: async (key: string) => pendingLeads.get(key) ?? null,
      setItem: async (key: string, value: { kind?: string, channel?: string, from?: string }) => {
        pendingLeads.set(key, value)
      },
      getKeys: async () => [...pendingLeads.keys()],
      removeItem: async (key: string) => {
        pendingLeads.delete(key)
      },
    }))
    verifyTurnstileToken.mockReset()
    notifyLeadChannels.mockReset()
    createPipelineCard.mockReset()
    fetchMock.mockReset()
    getHeader.mockReset()
    notifyLeadChannels.mockResolvedValue({ email: true, telegram: true })
    createPipelineCard.mockResolvedValue({ ok: true })
    verifyTurnstileToken.mockResolvedValue({ ok: true })
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    getHeader.mockReturnValue('TestAgent')
  })

  it('returns 400 for invalid payload', async () => {
    await expect(callHandler({ invalid: true })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 for invalid phone', async () => {
    await expect(callHandler(validPhoneLeadBody({ phone: 'bad' }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('accepts stub token off production', async () => {
    const body = validLeadSubmitBody({ turnstileToken: 'stub-test-token' })
    const res = await callHandler(body)
    expect(res).toMatchObject({ ok: true, locale: 'ua', source: 'hero' })
    expect(verifyTurnstileToken).not.toHaveBeenCalled()
    expect(notifyLeadChannels).not.toHaveBeenCalled()
  })

  it('returns 403 when Turnstile verification fails', async () => {
    verifyTurnstileToken.mockResolvedValue({ ok: false, reason: 'turnstile_failed' })

    await expect(callHandler(validLeadSubmitBody({ turnstileToken: 'real-token' }))).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('returns 502 when all notify channels fail', async () => {
    notifyLeadChannels.mockResolvedValue({ email: false, telegram: false })

    await expect(callHandler(validLeadSubmitBody({ turnstileToken: 'real-token' }))).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('returns happy path response', async () => {
    const body = validLeadSubmitBody({ turnstileToken: 'real-token' })
    const res = await callHandler(body) as { ok: true, leadId: string }

    expect(res.ok).toBe(true)
    expect(res.leadId).toMatch(/^[a-f0-9]{10}$/)
    expect(notifyLeadChannels).toHaveBeenCalled()
  })

  it('replays idempotent requests', async () => {
    const body = validLeadSubmitBody({ turnstileToken: 'real-token' })
    const first = await callHandler(body)
    const second = await callHandler(body)

    expect(second).toEqual(first)
    expect(notifyLeadChannels).toHaveBeenCalledTimes(1)
  })

  it('forbids stub tokens in production deploy env', async () => {
    await expect(callHandler(
      validLeadSubmitBody({ turnstileToken: 'stub-prod-blocked' }),
      { deployEnv: 'production' },
    )).rejects.toMatchObject({ statusCode: 403 })
  })

  it('verifies real tokens against Turnstile', async () => {
    await callHandler(validLeadSubmitBody({ turnstileToken: 'real-token' }))
    expect(verifyTurnstileToken).toHaveBeenCalled()
  })

  it('succeeds when only one notify channel works', async () => {
    notifyLeadChannels.mockResolvedValue({ email: true, telegram: false })
    const res = await callHandler(validLeadSubmitBody({ turnstileToken: 'real-token' }))
    expect(res).toMatchObject({ ok: true })
  })

  it('creates a KeyCRM card after a successful phone notify', async () => {
    const body = validPhoneLeadBody({ turnstileToken: 'real-token' })
    await callHandler(body, { keycrmApiKey: 'crm-key' })

    expect(createPipelineCard).toHaveBeenCalledTimes(1)
    expect(createPipelineCard.mock.calls[0]?.[0]).toBe('crm-key')
  })

  it('returns 200 when KeyCRM fails', async () => {
    createPipelineCard.mockResolvedValue({ ok: false, status: 500 })
    const res = await callHandler(
      validPhoneLeadBody({ turnstileToken: 'real-token' }),
      { keycrmApiKey: 'crm-key' },
    )

    expect(res).toMatchObject({ ok: true })
  })

  it('returns 200 when KeyCRM throws', async () => {
    createPipelineCard.mockRejectedValue(new Error('network'))
    const res = await callHandler(
      validPhoneLeadBody({ turnstileToken: 'real-token' }),
      { keycrmApiKey: 'crm-key' },
    )

    expect(res).toMatchObject({ ok: true })
  })

  it('does not create a card when both notify channels fail', async () => {
    notifyLeadChannels.mockResolvedValue({ email: false, telegram: false })

    await expect(callHandler(
      validLeadSubmitBody({ turnstileToken: 'real-token' }),
      { keycrmApiKey: 'crm-key' },
    )).rejects.toMatchObject({ statusCode: 502 })
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('skips KeyCRM when the API key is empty', async () => {
    await callHandler(validPhoneLeadBody({ turnstileToken: 'real-token' }), { keycrmApiKey: '' })
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('skips KeyCRM for a non-production stub token', async () => {
    await callHandler(
      validLeadSubmitBody({ turnstileToken: 'stub-test-token' }),
      { keycrmApiKey: 'crm-key' },
    )
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('saves a messenger form and does not create a card', async () => {
    const body = validLeadSubmitBody({ turnstileToken: 'real-token' })
    const res = await callHandler(body, { keycrmApiKey: 'crm-key' }) as { leadId: string }

    expect(createPipelineCard).not.toHaveBeenCalled()
    expect(pendingLeads.get(res.leadId)).toMatchObject({
      kind: 'form',
      channel: 'telegram',
      from: 'Kyiv',
    })
  })

  it('does not create a second card when the submit is replayed', async () => {
    const body = validPhoneLeadBody({ turnstileToken: 'real-token' })
    await callHandler(body, { keycrmApiKey: 'crm-key' })
    await callHandler(body, { keycrmApiKey: 'crm-key' })
    expect(createPipelineCard).toHaveBeenCalledTimes(1)
  })

  it('returns the thank-you while KeyCRM is still creating the card', async () => {
    let release: (value: { ok: true }) => void = () => {}
    createPipelineCard.mockImplementation(() => new Promise((resolve) => {
      release = resolve
    }))
    const body = validPhoneLeadBody({ turnstileToken: 'real-token' })

    const res = await Promise.race([
      callHandler(body, { keycrmApiKey: 'crm-key' }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('still waiting on KeyCRM')), 50)
      }),
    ])

    expect(res).toMatchObject({ ok: true })
    expect(notifyLeadChannels).toHaveBeenCalledTimes(1)
    expect(createPipelineCard).toHaveBeenCalledTimes(1)

    await callHandler(body, { keycrmApiKey: 'crm-key' })
    expect(notifyLeadChannels).toHaveBeenCalledTimes(1)
    expect(createPipelineCard).toHaveBeenCalledTimes(1)

    release({ ok: true })
  })

  it('posts one form lead to Stape with the event id', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const body = validLeadSubmitBody({
      turnstileToken: 'real-token',
      gclid: 'g-1',
      fbclid: 'f-1',
      gaClientId: 'GA1.1.1.1',
      fbp: 'fb.1.1.1',
      landingPath: '/?gclid=g-1',
    })
    const res = await callHandler(body, { stapeTaggingUrl: `${STAPE_URL}/` }) as { leadId: string }

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${STAPE_URL}/lead`)
    expect(stapeBody()).toEqual({
      event_name: 'generate_lead',
      event_id: res.leadId,
      client_id: 'GA1.1.1.1',
      gclid: 'g-1',
      fbclid: 'f-1',
      fbc: 'fb.1.1700000000000.f-1',
      ga_client_id: 'GA1.1.1.1',
      fbp: 'fb.1.1.1',
      client_ip_address: '127.0.0.1',
      ip_override: '127.0.0.1',
      client_user_agent: 'TestAgent',
      user_agent: 'TestAgent',
      landing_path: '/?gclid=g-1',
    })
    expect(stapeBody().phone).toBeUndefined()
    vi.mocked(Date.now).mockRestore()
  })

  it('sends the entered phone when the contact method is phone', async () => {
    const body = validPhoneLeadBody({ turnstileToken: 'real-token' })
    const res = await callHandler(
      body,
      { stapeTaggingUrl: STAPE_URL },
    ) as { leadId: string, phoneE164: string }

    expect(res.phoneE164).toBe(body.phone)
    expect(stapeBody()).toMatchObject({
      event_id: res.leadId,
      phone: body.phone,
    })
  })

  it('returns 200 when Stape fails', async () => {
    fetchMock.mockRejectedValue(new Error('stape down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await callHandler(
      validLeadSubmitBody({ turnstileToken: 'real-token' }),
      { stapeTaggingUrl: STAPE_URL },
    )
    await Promise.allSettled(fetchMock.mock.results.map(result => result.value))

    expect(res).toMatchObject({ ok: true })
    errorSpy.mockRestore()
  })

  it('returns 200 when Stape rejects the lead', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502 })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await callHandler(
      validLeadSubmitBody({ turnstileToken: 'real-token' }),
      { stapeTaggingUrl: STAPE_URL },
    )
    await Promise.allSettled(fetchMock.mock.results.map(result => result.value))

    expect(res).toMatchObject({ ok: true })
    errorSpy.mockRestore()
  })

  it('does not post the same lead to Stape twice', async () => {
    const body = validLeadSubmitBody({ turnstileToken: 'real-token' })
    await callHandler(body, { stapeTaggingUrl: STAPE_URL })
    await callHandler(body, { stapeTaggingUrl: STAPE_URL })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('skips Stape when the tagging URL is empty', async () => {
    await callHandler(validLeadSubmitBody({ turnstileToken: 'real-token' }), { stapeTaggingUrl: '  ' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips Stape for a non-production stub token', async () => {
    await callHandler(
      validLeadSubmitBody({ turnstileToken: 'stub-test-token' }),
      { stapeTaggingUrl: STAPE_URL },
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not post to Stape when both notify channels fail', async () => {
    notifyLeadChannels.mockResolvedValue({ email: false, telegram: false })

    await expect(callHandler(
      validLeadSubmitBody({ turnstileToken: 'real-token' }),
      { stapeTaggingUrl: STAPE_URL },
    )).rejects.toMatchObject({ statusCode: 502 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
