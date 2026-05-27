import type { RouterConfig } from '@nuxt/schema'

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
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      }
    }

    return { top: 0, left: 0 }
  },
} satisfies RouterConfig
