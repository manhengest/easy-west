import { LEAD_TURNSTILE_ACTION } from '~/shared/lead-constants'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const DEFAULT_MAX_AGE_SECONDS = 300

interface TurnstileVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  action?: string
  'error-codes'?: string[]
}

export interface VerifyTurnstileOptions {
  secret: string
  token: string
  remoteIp?: string
  expectedHostname: string
  expectedAction?: string
  maxAgeSeconds?: number
}

export function isStubTurnstileToken(token: string): boolean {
  return token.startsWith('stub-')
}

export async function verifyTurnstileToken(
  options: VerifyTurnstileOptions,
): Promise<{ ok: true } | { ok: false, reason: string }> {
  const body = new URLSearchParams({
    secret: options.secret,
    response: options.token,
  })
  if (options.remoteIp) {
    body.set('remoteip', options.remoteIp)
  }

  let response: Response
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  }
  catch {
    return { ok: false, reason: 'turnstile_unreachable' }
  }

  if (!response.ok) {
    return { ok: false, reason: 'turnstile_http_error' }
  }

  const data = await response.json() as TurnstileVerifyResponse
  if (!data.success) {
    return { ok: false, reason: data['error-codes']?.join(',') || 'turnstile_failed' }
  }

  if (data.hostname && data.hostname !== options.expectedHostname) {
    return { ok: false, reason: 'turnstile_hostname_mismatch' }
  }

  const expectedAction = options.expectedAction ?? LEAD_TURNSTILE_ACTION
  if (data.action && data.action !== expectedAction) {
    return { ok: false, reason: 'turnstile_action_mismatch' }
  }

  if (data.challenge_ts) {
    const maxAge = (options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS) * 1000
    const challengeAt = Date.parse(data.challenge_ts)
    if (Number.isNaN(challengeAt) || Date.now() - challengeAt > maxAge) {
      return { ok: false, reason: 'turnstile_token_expired' }
    }
  }

  return { ok: true }
}

