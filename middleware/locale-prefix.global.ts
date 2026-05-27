/**
 * Non-prefixed app paths (outside /ua/* and /ru/*) → 404.
 * Root `/` is handled by @nuxtjs/i18n detectBrowserLanguage (redirectOn: root).
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/') {
    return
  }

  const isApi = to.path.startsWith('/api') || to.path.startsWith('/__')
  const isNuxtAsset = to.path.startsWith('/_nuxt')
  const isStaticFile = /\.[a-z0-9]+$/i.test(to.path)
  const isSitemap = to.path === '/sitemap.xml' || to.path.startsWith('/sitemap')
  const isLocalePrefixed = /^\/(ua|ru)(\/|$)/.test(to.path)

  if (isApi || isNuxtAsset || isStaticFile || isSitemap) {
    return
  }

  if (!isLocalePrefixed) {
    return abortNavigation(
      createError({ statusCode: 404, statusMessage: 'Page Not Found' }),
    )
  }
})
