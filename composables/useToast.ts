export type ToastAction = {
  label: string
  href?: string
  onClick?: () => void
}

type ToastState = {
  message: string
  actions: ToastAction[]
  visible: boolean
}

const DEFAULT_DURATION_MS = 8000

export function useToast() {
  const toast = useState<ToastState | null>('ui-toast', () => null)
  let dismissTimer: ReturnType<typeof setTimeout> | null = null

  function clearDismissTimer() {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
  }

  function dismiss() {
    clearDismissTimer()
    if (!toast.value) {
      return
    }
    toast.value = { ...toast.value, visible: false }
    setTimeout(() => {
      if (toast.value && !toast.value.visible) {
        toast.value = null
      }
    }, 300)
  }

  function show(options: {
    message: string
    actions?: ToastAction[]
    durationMs?: number
  }) {
    clearDismissTimer()
    toast.value = {
      message: options.message,
      actions: options.actions ?? [],
      visible: true,
    }
    dismissTimer = setTimeout(dismiss, options.durationMs ?? DEFAULT_DURATION_MS)
  }

  return {
    toast,
    show,
    dismiss,
  }
}
