import { usePreferredReducedMotion } from '@vueuse/core'

export function useMotionPresets() {
  const motionPreference = usePreferredReducedMotion()
  const prefersReducedMotion = computed(() => motionPreference.value === 'reduce')

  function fadeUp(delay = 0) {
    if (prefersReducedMotion.value) {
      return {}
    }
    return {
      initial: { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 600, delay, ease: [0.22, 1, 0.36, 1] },
      },
    }
  }

  function scrollVisible(delay = 0) {
    if (prefersReducedMotion.value) {
      return { visible: true }
    }
    return {
      initial: { opacity: 0, y: 24 },
      visibleOnce: {
        opacity: 1,
        y: 0,
        transition: { duration: 600, delay, ease: [0.22, 1, 0.36, 1] },
      },
    }
  }

  return { prefersReducedMotion, fadeUp, scrollVisible }
}
