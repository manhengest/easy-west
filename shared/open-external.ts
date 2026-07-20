/**
 * Open an external URL. HTTPS links use a new tab; custom app schemes
 * (viber://, tel:, …) must not — window.open('_blank') leaves a blank tab
 * and often never hands off to the installed app.
 *
 * After an async gap (e.g. await $fetch), browsers drop the user-gesture
 * token and block window.open. Prefer openBlankExternalTab() synchronously
 * on click, then pass that Window here once the href is ready.
 */

const CUSTOM_SCHEME = /^(viber|tel|sms|mailto):/i

export function openBlankExternalTab(): Window | null {
  if (globalThis.window === undefined) {
    return null
  }

  // Do not pass noopener — we need the Window handle to navigate after await.
  const tab = globalThis.window.open('about:blank', '_blank')
  if (tab) {
    tab.opener = null
  }
  return tab
}

export function closeExternalTab(tab: Window | null | undefined): void {
  if (tab && !tab.closed) {
    tab.close()
  }
}

export function openExternalHref(href: string, existingTab?: Window | null): void {
  if (globalThis.window === undefined) {
    return
  }

  if (CUSTOM_SCHEME.test(href)) {
    closeExternalTab(existingTab)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.rel = 'noopener noreferrer'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    return
  }

  if (existingTab && !existingTab.closed) {
    existingTab.location.href = href
    return
  }

  globalThis.window.open(href, '_blank', 'noopener,noreferrer')
}
