import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

const coverageInclude = [
  'shared/**/*.{ts,vue}',
  'server/**/*.{ts,vue}',
  'composables/**/*.{ts,vue}',
  'middleware/**/*.{ts,vue}',
  'plugins/**/*.{ts,vue}',
  'components/LeadFormHost.vue',
  'components/LeadThankYou.vue',
  'components/CookieBanner.vue',
  'components/ui/UiInput.vue',
  'components/ui/UiSelect.vue',
  'components/ui/UiTextarea.vue',
  'components/ui/UiButton.vue',
  'components/ui/UiMessengerLink.vue',
  'components/ui/UiTurnstile.vue',
  'components/ui/UiToastHost.vue',
]

export default defineConfig({
  resolve: {
    alias: {
      '~': rootDir,
      '@': rootDir,
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: coverageInclude,
      exclude: [
        '**/node_modules/**',
        '**/*.d.ts',
        'server/utils/lead-schema.ts',
        'server/plugins/00-env.ts',
        'composables/useFocusTrap.ts',
        'composables/useOverlayInert.ts',
        'composables/useOverlayHistory.ts',
        'composables/useMotionPresets.ts',
        'composables/usePageSeo.ts',
        'plugins/gtm.client.ts',
        'components/ui/UiTurnstile.vue',
        'components/LeadFormHost.vue',
        'components/ui/UiToastHost.vue',
        'composables/useTurnstile.ts',
        'composables/useGtm.ts',
        'composables/useLeadMessenger.ts',
        'composables/useMessengerLink.ts',
        'shared/messenger-deeplink.ts',
        'shared/custom-scheme-handoff.ts',
        'shared/site-layout.ts',
        'components/LeadForm.vue',
        'composables/useLeadForm.ts',
        'components/layout/LocaleSwitcher.vue',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
        'shared/lead-schema.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
          perFile: true,
        },
        'shared/phone.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
          perFile: true,
        },
        'server/api/leads.post.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
          perFile: true,
        },
        'server/utils/turnstile.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
          perFile: true,
        },
        'server/utils/lead-notify.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
          perFile: true,
        },
        'server/utils/env-schema.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
          perFile: true,
        },
      },
    },
    projects: [
      {
        resolve: {
          alias: {
            '~': rootDir,
            '@': rootDir,
          },
        },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
              dotenv: {
                fileName: '.env.test',
              },
            },
          },
        },
      }),
    ],
  },
})
