export function useOverlayInert(active: Ref<boolean>) {
  let siteRoot: HTMLElement | null = null

  watch(active, (open) => {
    if (!import.meta.client) {
      return
    }
    siteRoot ??= document.querySelector('.site')
    if (!siteRoot) {
      return
    }

    if (open) {
      document.body.style.overflow = 'hidden'
      if ('inert' in HTMLElement.prototype) {
        siteRoot.inert = true
      }
      else {
        siteRoot.setAttribute('aria-hidden', 'true')
        siteRoot.style.pointerEvents = 'none'
      }
    }
    else {
      document.body.style.overflow = ''
      if ('inert' in HTMLElement.prototype) {
        siteRoot.inert = false
      }
      else {
        siteRoot.removeAttribute('aria-hidden')
        siteRoot.style.pointerEvents = ''
      }
    }
  })

  onBeforeUnmount(() => {
    if (siteRoot) {
      siteRoot.inert = false
      siteRoot.removeAttribute('aria-hidden')
      siteRoot.style.pointerEvents = ''
    }
    document.body.style.overflow = ''
  })
}
