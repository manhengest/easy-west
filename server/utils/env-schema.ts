import { z } from 'zod'

const deployEnvSchema = z.enum(['development', 'staging', 'production'])

export const serverEnvSchema = z.object({
  NUXT_RESEND_API_KEY: z.string().min(1),
  NUXT_LEADS_FROM_EMAIL: z.string().email(),
  NUXT_LEADS_TO_EMAIL: z.string().email(),
  NUXT_TELEGRAM_BOT_TOKEN: z.string().min(1),
  NUXT_TELEGRAM_CHAT_ID: z.string().min(1),
  NUXT_TURNSTILE_SECRET: z.string().min(1),
  NUXT_KEYCRM_API_KEY: z.string().optional(),
  NUXT_KEYCRM_WEBHOOK_SECRET: z.string().optional(),
  NUXT_KEYCRM_ADS_QUALIFIED_FIELD: z.string().optional(),
  NUXT_KEYCRM_ADS_BOOKED_FIELD: z.string().optional(),
  NUXT_GA4_MEASUREMENT_ID: z.string().optional(),
  NUXT_GA4_API_SECRET: z.string().optional(),
  NUXT_META_PIXEL_ID: z.string().optional(),
  NUXT_META_CAPI_TOKEN: z.string().optional(),
  NUXT_GOOGLE_ADS_CUSTOMER_ID: z.string().optional(),
  NUXT_GOOGLE_ADS_LOGIN_CUSTOMER_ID: z.string().optional(),
  NUXT_GOOGLE_ADS_CLIENT_ID: z.string().optional(),
  NUXT_GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),
  NUXT_GOOGLE_ADS_REFRESH_TOKEN: z.string().optional(),
  NUXT_GOOGLE_ADS_QUALIFIED_ACTION_ID: z.string().optional(),
  NUXT_GOOGLE_ADS_BOOKED_ACTION_ID: z.string().optional(),
  NUXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NUXT_PUBLIC_SITE_URL: z.string().url(),
  NUXT_PUBLIC_GTM_ID: z.string().optional(),
  NUXT_PROD_LEADS_TO_EMAIL: z.string().email().optional(),
  NUXT_DEPLOY_ENV: deployEnvSchema.default('development'),
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
