import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validLeadSubmitBody, validPhoneLeadBody } from '../fixtures/leads'

const verifyTurnstileToken = vi.fn()
const notifyLeadChannels = vi.fn()
const createPipelineCard = vi.fn()
const readBody = vi.fn()
const useRuntimeConfig = vi.fn()
const getRequestIP = vi.fn()

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
vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string, data?: unknown }) => {
  const error = Object.assign(new Error(opts.statusMessage), opts)
  return error
})

const { default: handler } = await import('~/server/api/leads.post')

function defaultRuntimeConfig(overrides: Record<string, unknown> = {}) {
  return {
    deployEnv: 'development',
    turnstileSecret: 'secret',
    resendApiKey: 'key',
    leadsFromEmail: 'from@example.com',
    leadsToEmail: 'to@example.com',
    telegramBotToken: 'token',
    telegramChatId: '123',
    public: { siteUrl: 'https://easy-west.com' },
    ...overrides,
  }
}

async function callHandler(body: unknown, configOverrides: Record<string, unknown> = {}) {
  readBody.mockResolvedValue(body)
  useRuntimeConfig.mockReturnValue(defaultRuntimeConfig(configOverrides))
  getRequestIP.mockReturnValue('127.0.0.1')
  return handler({} as never)
}

describe('POST /api/leads handler', () => {
  beforeEach(() => {
    verifyTurnstileToken.mockReset()
    notifyLeadChannels.mockReset()
    createPipelineCard.mockReset()
    notifyLeadChannels.mockResolvedValue({ email: true, telegram: true })
    createPipelineCard.mockResolvedValue({ ok: true })
    verifyTurnstileToken.mockResolvedValue({ ok: true })
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

  it('creates a KeyCRM card after a successful notify', async () => {
    const body = validLeadSubmitBody({ turnstileToken: 'real-token' })
    await callHandler(body, { keycrmApiKey: 'crm-key' })

    expect(createPipelineCard).toHaveBeenCalledTimes(1)
    expect(createPipelineCard.mock.calls[0]?.[0]).toBe('crm-key')
  })

  it('returns 200 when KeyCRM fails', async () => {
    createPipelineCard.mockResolvedValue({ ok: false, status: 500 })
    const res = await callHandler(
      validLeadSubmitBody({ turnstileToken: 'real-token' }),
      { keycrmApiKey: 'crm-key' },
    )

    expect(res).toMatchObject({ ok: true })
  })

  it('returns 200 when KeyCRM throws', async () => {
    createPipelineCard.mockRejectedValue(new Error('network'))
    const res = await callHandler(
      validLeadSubmitBody({ turnstileToken: 'real-token' }),
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
    await callHandler(validLeadSubmitBody({ turnstileToken: 'real-token' }), { keycrmApiKey: '' })
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('skips KeyCRM for a non-production stub token', async () => {
    await callHandler(
      validLeadSubmitBody({ turnstileToken: 'stub-test-token' }),
      { keycrmApiKey: 'crm-key' },
    )
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('does not create a second card when the submit is replayed', async () => {
    const body = validLeadSubmitBody({ turnstileToken: 'real-token' })
    await callHandler(body, { keycrmApiKey: 'crm-key' })
    await callHandler(body, { keycrmApiKey: 'crm-key' })
    expect(createPipelineCard).toHaveBeenCalledTimes(1)
  })

  it('returns the thank-you while KeyCRM is still creating the card', async () => {
    let release: (value: { ok: true }) => void = () => {}
    createPipelineCard.mockImplementation(() => new Promise((resolve) => {
      release = resolve
    }))
    const body = validLeadSubmitBody({ turnstileToken: 'real-token' })

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
})
