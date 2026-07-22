export type CustomSchemeHandoffResult = 'handed_off' | 'stayed'

export type ViberHandoffStatus = 'checking' | 'ok' | 'miss'

/**
 * After opening a custom-scheme URL (viber://, tel:, …), wait briefly to see
 * whether the page loses focus or goes hidden — a signal the OS handed off to
 * an installed app. If nothing happens within `timeoutMs`, assume the app is
 * missing and return `stayed`.
 */
export function watchCustomSchemeHandoff(
  options?: { timeoutMs?: number },
): Promise<CustomSchemeHandoffResult> {
  const timeoutMs = options?.timeoutMs ?? 1500

  if (globalThis.window === undefined) {
    return Promise.resolve('handed_off')
  }

  return new Promise((resolve) => {
    let settled = false

    const settle = (result: CustomSchemeHandoffResult) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      resolve(result)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        settle('handed_off')
      }
    }

    const onPageHide = () => {
      settle('handed_off')
    }

    const onBlur = () => {
      settle('handed_off')
    }

    const timer = globalThis.window.setTimeout(() => {
      settle('stayed')
    }, timeoutMs)

    const cleanup = () => {
      globalThis.window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      globalThis.window.removeEventListener('pagehide', onPageHide)
      globalThis.window.removeEventListener('blur', onBlur)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    globalThis.window.addEventListener('pagehide', onPageHide)
    globalThis.window.addEventListener('blur', onBlur)
  })
}
