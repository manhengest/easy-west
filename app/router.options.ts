import type { RouterConfig } from '@nuxt/schema'
import { getSiteHeaderScrollOffsetPx } from '~/shared/site-layout'

function prefersReducedMotion(): boolean {
  if (import.meta.server) {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default {
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: getSiteHeaderScrollOffsetPx(),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      }
    }

    return { top: 0, left: 0 }
  },
} satisfies RouterConfig
