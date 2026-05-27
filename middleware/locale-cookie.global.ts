/**
 * When the user previously chose a locale (ew_locale cookie), keep them on that
 * locale even if they open a link to the other prefix (e.g. shared /ua URL).
 */
export default defineNuxtRouteMiddleware((to) => {
  const localeCookie = useCookie<string | null>('ew_locale')

  const saved = localeCookie.value
  if (!saved || (saved !== 'ua' && saved !== 'ru')) {
    return
  }

  const pathLocale = to.path.match(/^\/(ua|ru)(?=\/|$)/)?.[1]
  if (!pathLocale || pathLocale === saved) {
    return
  }

  const path = to.path.replace(/^\/(ua|ru)(?=\/|$)/, `/${saved}`)
  if (path === to.path) {
    return
  }

  return navigateTo({ path, query: to.query, hash: to.hash })
})
