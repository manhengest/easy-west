import { useEventListener } from '@vueuse/core'

export function useOverlayHistory(
  active: Ref<boolean>,
  overlayId: Ref<string> | string,
  onClose: () => void,
) {
  const id = computed(() => unref(overlayId))
  function pushOverlayState() {
    if (!import.meta.client) {
      return
    }
    history.pushState({ overlay: id.value }, '')
  }

  function onPopState(event: PopStateEvent) {
    const state = event.state as { overlay?: string } | null
    if (active.value && (!state || state.overlay !== id.value)) {
      onClose()
    }
  }

  watch(active, (open, wasOpen) => {
    if (!import.meta.client) {
      return
    }
    if (open && !wasOpen) {
      pushOverlayState()
    }
  })

  useEventListener(window, 'popstate', onPopState)
}
