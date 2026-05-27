import { useEventListener } from '@vueuse/core'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  containerRef: Ref<HTMLElement | null | undefined | globalThis.HTMLElement | null>,
  active: Ref<boolean>,
) {
  let observer: MutationObserver | undefined
  const previouslyFocused = ref<HTMLElement | null>(null)

  function focusables(): HTMLElement[] {
    const root = containerRef.value
    if (!root) {
      return []
    }
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      el => !el.hasAttribute('disabled') && el.tabIndex !== -1,
    )
  }

  function onKeydown(event: KeyboardEvent) {
    if (!active.value || event.key !== 'Tab') {
      return
    }
    const items = focusables()
    if (!items.length) {
      return
    }
    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(active, (isActive) => {
    if (!import.meta.client) {
      return
    }
    if (isActive) {
      previouslyFocused.value = document.activeElement as HTMLElement | null
      nextTick(() => {
        const items = focusables()
        items[0]?.focus()
      })
      observer?.disconnect()
      observer = new MutationObserver(() => {
        if (!focusables().includes(document.activeElement as HTMLElement)) {
          focusables()[0]?.focus()
        }
      })
      if (containerRef.value) {
        observer.observe(containerRef.value, { childList: true, subtree: true })
      }
    }
    else {
      observer?.disconnect()
      observer = undefined
      previouslyFocused.value?.focus?.()
      previouslyFocused.value = null
    }
  })

  useEventListener(typeof window !== 'undefined' ? window : null, 'keydown', onKeydown)

  onBeforeUnmount(() => {
    observer?.disconnect()
  })
}
