const DEFAULT_SITE_HEADER_SCROLL_OFFSET_PX = 81

export function getSiteHeaderScrollOffsetPx(): number {
  if (import.meta.server) {
    return DEFAULT_SITE_HEADER_SCROLL_OFFSET_PX
  }

  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--site-header-scroll-offset)'
  document.body.appendChild(probe)
  const offset = probe.offsetHeight
  probe.remove()

  return offset || DEFAULT_SITE_HEADER_SCROLL_OFFSET_PX
}
