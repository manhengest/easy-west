const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

let scrollLockCount = 0
let inertLockCount = 0
let savedBodyPaddingRight = ''
let savedHeaderPaddingRight = ''

function getScrollbarWidth() {
  return globalThis.innerWidth - document.documentElement.clientWidth
}

function isDesktopViewport() {
  return globalThis.matchMedia(DESKTOP_MEDIA_QUERY).matches
}

function acquireBodyScrollLock() {
  scrollLockCount++
  if (scrollLockCount > 1) {
    return
  }

  const scrollbarWidth = isDesktopViewport() ? getScrollbarWidth() : 0

  savedBodyPaddingRight = document.body.style.paddingRight
  document.body.style.overflow = 'hidden'

  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`

    const header = document.querySelector<HTMLElement>('.site-header')
    if (header) {
      savedHeaderPaddingRight = header.style.paddingRight
      header.style.paddingRight = `${scrollbarWidth}px`
    }
  }
}

function releaseBodyScrollLock() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount > 0) {
    return
  }

  document.body.style.overflow = ''
  document.body.style.paddingRight = savedBodyPaddingRight
  savedBodyPaddingRight = ''

  const header = document.querySelector<HTMLElement>('.site-header')
  if (header) {
    header.style.paddingRight = savedHeaderPaddingRight
    savedHeaderPaddingRight = ''
  }
}

function acquireSiteInert(siteRoot: HTMLElement) {
  inertLockCount++
  if (inertLockCount > 1) {
    return
  }

  if ('inert' in HTMLElement.prototype) {
    siteRoot.inert = true
  }
  else {
    siteRoot.setAttribute('aria-hidden', 'true')
    siteRoot.style.pointerEvents = 'none'
  }
}

function releaseSiteInert(siteRoot: HTMLElement) {
  inertLockCount = Math.max(0, inertLockCount - 1)
  if (inertLockCount > 0) {
    return
  }

  if ('inert' in HTMLElement.prototype) {
    siteRoot.inert = false
  }
  else {
    siteRoot.removeAttribute('aria-hidden')
    siteRoot.style.pointerEvents = ''
  }
}

export function useOverlayInert(active: Ref<boolean>) {
  let siteRoot: HTMLElement | null = null
  let lockedByThis = false

  function lock() {
    if (!import.meta.client) {
      return
    }

    siteRoot ??= document.querySelector('.site')
    if (!siteRoot) {
      return
    }

    acquireBodyScrollLock()
    acquireSiteInert(siteRoot)
    lockedByThis = true
  }

  function unlock() {
    if (!import.meta.client || !lockedByThis) {
      return
    }

    siteRoot ??= document.querySelector('.site')
    releaseBodyScrollLock()

    if (siteRoot) {
      releaseSiteInert(siteRoot)
    }

    lockedByThis = false
  }

  watch(active, (open) => {
    if (open) {
      lock()
    }
    else {
      unlock()
    }
  })

  onBeforeUnmount(unlock)
}
