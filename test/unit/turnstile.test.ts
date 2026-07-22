import { afterEach, describe, expect, it, vi } from 'vitest'
import { isStubTurnstileToken, verifyTurnstileToken } from '~/server/utils/turnstile'

describe('isStubTurnstileToken', () => {
  it('detects stub tokens', () => {
    expect(isStubTurnstileToken('stub-test')).toBe(true)
    expect(isStubTurnstileToken('real-token')).toBe(false)
  })
})

describe('verifyTurnstileToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns ok for successful verification', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        hostname: 'easy-west.com',
        action: 'lead_submit',
        challenge_ts: new Date().toISOString(),
      }),
    }))

    const result = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      expectedHostname: 'easy-west.com',
    })

    expect(result).toEqual({ ok: true })
  })

  it('fails on hostname mismatch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        hostname: 'evil.example',
        action: 'lead_submit',
      }),
    }))

    const result = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      expectedHostname: 'easy-west.com',
    })

    expect(result).toEqual({ ok: false, reason: 'turnstile_hostname_mismatch' })
  })

  it('fails on action mismatch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: 'wrong_action',
      }),
    }))

    const result = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      expectedHostname: 'easy-west.com',
      expectedAction: 'lead_submit',
    })

    expect(result).toEqual({ ok: false, reason: 'turnstile_action_mismatch' })
  })

  it('fails when token is expired', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        challenge_ts: new Date(Date.now() - 10 * 60_000).toISOString(),
      }),
    }))

    const result = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      expectedHostname: 'easy-west.com',
      maxAgeSeconds: 60,
    })

    expect(result).toEqual({ ok: false, reason: 'turnstile_token_expired' })
  })

  it('fails when Cloudflare is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

    const result = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      expectedHostname: 'easy-west.com',
    })

    expect(result).toEqual({ ok: false, reason: 'turnstile_unreachable' })
  })

  it('fails on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const result = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      expectedHostname: 'easy-west.com',
    })

    expect(result).toEqual({ ok: false, reason: 'turnstile_http_error' })
  })

  it('fails when success is false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    }))

    const result = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      expectedHostname: 'easy-west.com',
    })

    expect(result).toEqual({ ok: false, reason: 'invalid-input-response' })
  })

  it('includes remote IP when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      remoteIp: '203.0.113.1',
      expectedHostname: 'easy-west.com',
    })

    const body = String(fetchMock.mock.calls[0]?.[1]?.body)
    expect(body).toContain('remoteip=203.0.113.1')
  })
})
