import { defineConfig, devices } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadE2eEnv(): Record<string, string> {
  const path = resolve(process.cwd(), '.env.e2e')
  if (!existsSync(path)) {
    return {}
  }

  const env: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      continue
    }
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  return env
}

const e2eEnv = loadE2eEnv()
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const skipWebServer = process.env.E2E_SKIP_WEBSERVER === '1'

export default defineConfig({
  testDir: 'test/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  outputDir: 'test-results',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: 'pnpm dev --port 3000',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            SKIP_ENV_VALIDATION: 'true',
            NUXT_PUBLIC_SITE_URL: baseURL,
            NUXT_PUBLIC_TURNSTILE_SITE_KEY: '',
            NUXT_PUBLIC_GTM_ID: '',
            NUXT_DEPLOY_ENV: 'development',
            ...e2eEnv,
          },
        },
      }),
})
