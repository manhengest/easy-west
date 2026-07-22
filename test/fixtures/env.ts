import type { ServerEnv } from '~/server/utils/env-schema'

export const validServerEnv: ServerEnv = {
  NUXT_RESEND_API_KEY: 'test-resend-key',
  NUXT_LEADS_FROM_EMAIL: 'from@example.com',
  NUXT_LEADS_TO_EMAIL: 'leads@example.com',
  NUXT_TELEGRAM_BOT_TOKEN: 'test-telegram-token',
  NUXT_TELEGRAM_CHAT_ID: '123456789',
  NUXT_TURNSTILE_SECRET: 'test-turnstile-secret',
  NUXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-site-key',
  NUXT_PUBLIC_SITE_URL: 'https://easy-west.com',
  NUXT_PUBLIC_GTM_ID: 'GTM-TEST',
  NUXT_PROD_LEADS_TO_EMAIL: 'prod@example.com',
  NUXT_DEPLOY_ENV: 'development',
}
