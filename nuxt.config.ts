import tailwindcssPostcss from '@tailwindcss/postcss'
import { parseServerEnv } from './server/utils/env-schema'

if (process.env.NODE_ENV !== 'test' && process.env.SKIP_ENV_VALIDATION !== 'true') {
  parseServerEnv(process.env)
}

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL!

const staticPages = ['', 'privacy', 'cookies', 'terms', 'accessibility'] as const
const prerenderRoutes = [
  ...staticPages.map(page => (page ? `/${page}` : '/')),
  ...staticPages.map(page => (page ? `/ru/${page}` : '/ru')),
]

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@vueuse/motion/nuxt',
  ],

  // sections/HeroSection.vue → <HeroSection>, layout/SiteHeader.vue → <SiteHeader>
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  css: ['~/assets/css/tailwind.css'],

  site: {
    url: siteUrl,
    name: 'EASY WEST',
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'ua',
    baseUrl: siteUrl,
    bundle: {
      optimizeTranslationDirective: false,
    },
    locales: [
      { code: 'ua', language: 'uk-UA', iso: 'uk-UA', name: 'UA', file: 'ua.json' },
      { code: 'ru', language: 'ru-RU', iso: 'ru-RU', name: 'RU', file: 'ru.json' },
    ],
    langDir: 'locales',
    detectBrowserLanguage: {
      // ew_locale is set only on explicit LocaleSwitcher click (not on auto-detect)
      useCookie: false,
      cookieKey: 'ew_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },

  sitemap: {
    exclude: ['/api/**'],
  },

  icon: {
    serverBundle: {
      collections: ['lucide', 'simple-icons'],
    },
  },

  fonts: {
    providers: {
      google: false,
      bunny: false,
      fontshare: false,
    },
    defaults: {
      weights: [400, 600],
      subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
      preload: true,
    },
    families: [
      { name: 'Inter', provider: 'local' },
    ],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'uk' },
      link: [
        { rel: 'apple-touch-icon', sizes: '57x57', href: '/apple-icon-57x57.png' },
        { rel: 'apple-touch-icon', sizes: '60x60', href: '/apple-icon-60x60.png' },
        { rel: 'apple-touch-icon', sizes: '72x72', href: '/apple-icon-72x72.png' },
        { rel: 'apple-touch-icon', sizes: '76x76', href: '/apple-icon-76x76.png' },
        { rel: 'apple-touch-icon', sizes: '114x114', href: '/apple-icon-114x114.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/apple-icon-120x120.png' },
        { rel: 'apple-touch-icon', sizes: '144x144', href: '/apple-icon-144x144.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-icon-180x180.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/android-icon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
      meta: [
        { name: 'msapplication-TileColor', content: '#ffffff' },
        { name: 'msapplication-TileImage', content: '/ms-icon-144x144.png' },
        { name: 'theme-color', content: '#ffffff' },
      ],
    },
  },

  scripts: {},

  runtimeConfig: {
    resendApiKey: '',
    leadsFromEmail: '',
    leadsToEmail: '',
    telegramBotToken: '',
    telegramChatId: '',
    turnstileSecret: '',
    prodLeadsToEmail: '',
    deployEnv: process.env.NUXT_DEPLOY_ENV ?? 'development',
    public: {
      siteUrl: '',
      turnstileSiteKey: '',
      gtmId: '',
      contactPhone: '',
      contactWhatsapp: '',
      contactTelegram: '',
      contactViber: '',
      contactEmail: process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'info@easywest.eu',
    },
  },

  nitro: {
    preset: 'node-server',
    prerender: {
      routes: prerenderRoutes,
      crawlLinks: false,
    },
  },

  routeRules: {
    '/api/**': { prerender: false },
    '/': { prerender: true },
    '/privacy': { prerender: true },
    '/cookies': { prerender: true },
    '/terms': { prerender: true },
    '/accessibility': { prerender: true },
    '/ru/**': { prerender: true },
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      },
    },
  },

  vite: {
    css: {
      postcss: {
        plugins: [tailwindcssPostcss()],
      },
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/tokens" as *;\n@use "~/assets/scss/mixins" as *;\n',
        },
      },
    },
  },
})
