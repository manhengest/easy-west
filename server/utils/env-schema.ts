import { z } from 'zod'

const deployEnvSchema = z.enum(['development', 'staging', 'production'])

export const serverEnvSchema = z.object({
  NUXT_RESEND_API_KEY: z.string().min(1),
  NUXT_LEADS_FROM_EMAIL: z.string().email(),
  NUXT_LEADS_TO_EMAIL: z.string().email(),
  NUXT_TELEGRAM_BOT_TOKEN: z.string().min(1),
  NUXT_TELEGRAM_CHAT_ID: z.string().min(1),
  NUXT_UPSTASH_REDIS_REST_URL: z.string().url(),
  NUXT_UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NUXT_KV_REST_API_URL: z.string().url(),
  NUXT_KV_REST_API_TOKEN: z.string().min(1),
  NUXT_CONSENT_DB_URL: z.string().url(),
  NUXT_PHONE_HASH_SALT: z.string().min(32),
  NUXT_LEAD_IP_SALT: z.string().min(32),
  NUXT_TURNSTILE_SECRET: z.string().min(1),
  NUXT_QSTASH_TOKEN: z.string().min(1),
  NUXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NUXT_PUBLIC_SITE_URL: z.string().url(),
  NUXT_SENTRY_DSN: z.string().url(),
  NUXT_PUBLIC_GTM_ID: z.string().optional(),
  NUXT_PROD_LEADS_TO_EMAIL: z.string().email().optional(),
  NUXT_DEPLOY_ENV: deployEnvSchema.default('development'),
  NUXT_TRUSTED_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform(v => v === 'true'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

function isProductionDeploy(env: ServerEnv): boolean {
  return env.NUXT_DEPLOY_ENV === 'production'
}

function assertStagingLeadsEmail(env: ServerEnv): void {
  const prodRecipient = env.NUXT_PROD_LEADS_TO_EMAIL
  if (!prodRecipient) {
    return
  }
  if (!isProductionDeploy(env) && env.NUXT_LEADS_TO_EMAIL === prodRecipient) {
    throw new Error(
      'NUXT_LEADS_TO_EMAIL must not match NUXT_PROD_LEADS_TO_EMAIL outside production (NUXT_DEPLOY_ENV=production).',
    )
  }
}

export function parseServerEnv(raw: NodeJS.ProcessEnv): ServerEnv {
  const parsed = serverEnvSchema.parse(raw)
  assertStagingLeadsEmail(parsed)
  return parsed
}
