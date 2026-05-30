import { LEAD_TURNSTILE_ACTION } from '~/shared/lead-constants'

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (import.meta.server) {
    return Promise.resolve()
  }

  if (window.turnstile) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (window.turnstile) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

async function waitForTurnstile(timeoutMs = 10_000): Promise<NonNullable<Window['turnstile']>> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (window.turnstile) {
      return window.turnstile
    }
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error('Turnstile unavailable')
}

export function useTurnstile(containerRef: Ref<HTMLElement | null>) {
  const config = useRuntimeConfig()
  const siteKey = computed(() => String(config.public.turnstileSiteKey || ''))
  const enabled = computed(() => Boolean(siteKey.value))
  const token = ref('')
  const widgetId = ref<string | null>(null)
  const loadError = ref(false)

  function clearToken() {
    token.value = ''
  }

  function reset() {
    clearToken()
    if (widgetId.value && window.turnstile) {
      window.turnstile.reset(widgetId.value)
    }
  }

  async function renderWidget() {
    if (!enabled.value || !containerRef.value) {
      return
    }

    loadError.value = false
    clearToken()

    if (widgetId.value && window.turnstile) {
      window.turnstile.remove(widgetId.value)
      widgetId.value = null
    }

    try {
      await loadTurnstileScript()
      const turnstile = await waitForTurnstile()
      widgetId.value = turnstile.render(containerRef.value, {
        sitekey: siteKey.value,
        action: LEAD_TURNSTILE_ACTION,
        theme: 'auto',
        callback: (nextToken: string) => {
          token.value = nextToken
        },
        'error-callback': () => {
          clearToken()
          loadError.value = true
        },
        'expired-callback': () => {
          clearToken()
        },
      })
    }
    catch {
      loadError.value = true
      clearToken()
    }
  }

  onMounted(() => {
    if (enabled.value) {
      void renderWidget()
    }
  })

  onBeforeUnmount(() => {
    if (widgetId.value && window.turnstile) {
      window.turnstile.remove(widgetId.value)
      widgetId.value = null
    }
  })

  return {
    enabled,
    token,
    loadError,
    reset,
    renderWidget,
  }
}
