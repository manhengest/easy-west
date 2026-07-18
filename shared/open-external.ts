/**
 * Open an external URL. HTTPS links use a new tab; custom app schemes
 * (viber://, tel:, …) must not — window.open('_blank') leaves a blank tab
 * and often never hands off to the installed app.
 */
export function openExternalHref(href: string): void {
  if (typeof globalThis.window === 'undefined') {
    return
  }

  if (/^(viber|tel|sms|mailto):/i.test(href)) {
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.rel = 'noopener noreferrer'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    return
  }

  globalThis.window.open(href, '_blank', 'noopener,noreferrer')
}
