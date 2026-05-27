import type { H3Event } from 'h3'
import { getHeader, getRequestIP } from 'h3'

/**
 * Client IP for rate limiting / audit hashing.
 * On VPS: nginx must set `X-Real-IP` (or `X-Forwarded-For` with trusted proxy).
 * Do not trust spoofable headers when NUXT_TRUSTED_PROXY is false.
 */
export function getClientIp(event: H3Event): string {
  const config = useRuntimeConfig(event)
  const trusted = config.trustedProxy === true

  if (trusted) {
    const realIp = getHeader(event, 'x-real-ip')
    if (realIp) {
      return realIp.split(',')[0]!.trim()
    }
    const forwarded = getHeader(event, 'x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0]!.trim()
    }
  }

  return getRequestIP(event, { xForwardedFor: trusted }) ?? '0.0.0.0'
}
