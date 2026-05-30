/**
 * Allow unprefixed UA static pages and /ru/*; 404 everything else (incl. legacy /ua/*).
 */
const staticPages = ['', 'privacy', 'cookies', 'terms', 'accessibility'] as const

function isUaStaticPath(path: string): boolean {
  return staticPages.some(page => path === (page ? `/${page}` : '/'))
}

export default defineNuxtRouteMiddleware((to) => {
  const isApi = to.path.startsWith('/api') || to.path.startsWith('/__')
  const isNuxtAsset = to.path.startsWith('/_nuxt')
  const isStaticFile = /\.[a-z0-9]+$/i.test(to.path)
  const isSitemap = to.path === '/sitemap.xml' || to.path.startsWith('/sitemap')

  if (isApi || isNuxtAsset || isStaticFile || isSitemap) {
    return
  }

  const isRuPath = /^\/ru(\/|$)/.test(to.path)
  if (isUaStaticPath(to.path) || isRuPath) {
    return
  }

  return abortNavigation(
    createError({ statusCode: 404, statusMessage: 'Page Not Found' }),
  )
})
