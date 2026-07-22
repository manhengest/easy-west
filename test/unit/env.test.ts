import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getServerEnv } from '~/server/utils/env'
import { validServerEnv } from '../fixtures/env'

describe('getServerEnv', () => {
  beforeEach(() => {
    vi.stubEnv('NUXT_RESEND_API_KEY', validServerEnv.NUXT_RESEND_API_KEY)
    vi.stubEnv('NUXT_LEADS_FROM_EMAIL', validServerEnv.NUXT_LEADS_FROM_EMAIL)
    vi.stubEnv('NUXT_LEADS_TO_EMAIL', validServerEnv.NUXT_LEADS_TO_EMAIL)
    vi.stubEnv('NUXT_TELEGRAM_BOT_TOKEN', validServerEnv.NUXT_TELEGRAM_BOT_TOKEN)
    vi.stubEnv('NUXT_TELEGRAM_CHAT_ID', validServerEnv.NUXT_TELEGRAM_CHAT_ID)
    vi.stubEnv('NUXT_TURNSTILE_SECRET', validServerEnv.NUXT_TURNSTILE_SECRET)
    vi.stubEnv('NUXT_PUBLIC_TURNSTILE_SITE_KEY', validServerEnv.NUXT_PUBLIC_TURNSTILE_SITE_KEY)
    vi.stubEnv('NUXT_PUBLIC_SITE_URL', validServerEnv.NUXT_PUBLIC_SITE_URL)
    vi.stubEnv('NUXT_DEPLOY_ENV', validServerEnv.NUXT_DEPLOY_ENV)
  })

  it('parses and caches server env', async () => {
    vi.resetModules()
    const { getServerEnv: loadEnv } = await import('~/server/utils/env')
    const first = loadEnv()
    const second = loadEnv()
    expect(first.NUXT_LEADS_TO_EMAIL).toBe('leads@example.com')
    expect(second).toBe(first)
  })
})

describe('env proxy', () => {
  it('exposes env keys via proxy', async () => {
    vi.resetModules()
    const { env } = await import('~/server/utils/env')
    expect(env.NUXT_DEPLOY_ENV).toBeDefined()
  })
})
