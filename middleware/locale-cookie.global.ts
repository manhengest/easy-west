/**
 * When the user previously chose a locale (ew_locale cookie), keep them on that
 * locale even if they open a link to the other prefix (e.g. shared unprefixed URL).
 */
const staticPages = ['', 'privacy', 'cookies', 'terms', 'accessibility'] as const

type LocaleCode = 'ua' | 'ru'

function isStaticAppPath(path: string): boolean {
  return staticPages.some(page => path === (page ? `/${page}` : '/'))
}

function pathLocale(path: string): LocaleCode | null {
  if (/^\/ru(\/|$)/.test(path)) {
    return 'ru'
  }
  if (/^\/ua(\/|$)/.test(path)) {
    return null
  }
  if (isStaticAppPath(path)) {
    return 'ua'
  }
  return null
}

function switchPathToLocale(path: string, locale: LocaleCode): string {
  const base = path.replace(/^\/ru(?=\/|$)/, '') || '/'

  if (locale === 'ru') {
    return base === '/' ? '/ru' : `/ru${base}`
  }

  return base
}

export default defineNuxtRouteMiddleware((to) => {
  const localeCookie = useCookie<string | null>('ew_locale')

  const saved = localeCookie.value
  if (!saved || (saved !== 'ua' && saved !== 'ru')) {
    return
  }

  const current = pathLocale(to.path)
  if (!current || current === saved) {
    return
  }

  const path = switchPathToLocale(to.path, saved)
  if (path === to.path) {
    return
  }

  return navigateTo({ path, query: to.query, hash: to.hash })
})
