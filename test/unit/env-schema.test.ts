import { describe, expect, it } from 'vitest'
import { parseServerEnv, serverEnvSchema } from '~/server/utils/env-schema'
import { validServerEnv } from '../fixtures/env'

describe('serverEnvSchema', () => {
  it('parses valid env', () => {
    const parsed = serverEnvSchema.parse(validServerEnv)
    expect(parsed.NUXT_DEPLOY_ENV).toBe('development')
  })

  it('defaults deploy env to development', () => {
    const { NUXT_DEPLOY_ENV: _, ...rest } = validServerEnv
    const parsed = serverEnvSchema.parse(rest)
    expect(parsed.NUXT_DEPLOY_ENV).toBe('development')
  })

  it('rejects missing required keys', () => {
    expect(() => serverEnvSchema.parse({})).toThrow()
  })
})

describe('parseServerEnv', () => {
  it('returns parsed env for valid input', () => {
    const env = parseServerEnv(validServerEnv as unknown as NodeJS.ProcessEnv)
    expect(env.NUXT_LEADS_TO_EMAIL).toBe('leads@example.com')
  })

  it('throws when staging uses prod recipient email', () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        NUXT_DEPLOY_ENV: 'staging',
        NUXT_LEADS_TO_EMAIL: validServerEnv.NUXT_PROD_LEADS_TO_EMAIL!,
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/must not match/)
  })

  it('allows staging recipient when prod email is unset', () => {
    const { NUXT_PROD_LEADS_TO_EMAIL: _, ...withoutProd } = validServerEnv
    const env = parseServerEnv(withoutProd as unknown as NodeJS.ProcessEnv)
    expect(env.NUXT_LEADS_TO_EMAIL).toBe('leads@example.com')
  })
})
