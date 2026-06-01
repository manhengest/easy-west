const GRANTED_CONSENT = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
} as const

const DEFAULT_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const

function ensureDataLayer() {
  if (!import.meta.client) {
    return
  }
  const w = window as Window & { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  return w.dataLayer
}

function pushConsentUpdate(granted: boolean) {
  const dataLayer = ensureDataLayer()
  const payload = granted ? GRANTED_CONSENT : DEFAULT_CONSENT
  dataLayer?.push(['consent', 'update', { ...payload }])
}

export function useGtm() {
  const config = useRuntimeConfig()
  const gtmId = config.public.gtmId
  const nuxtApp = useNuxtApp()

  function pushEvent(event: string, payload: Record<string, unknown> = {}) {
    const dataLayer = ensureDataLayer()
    dataLayer?.push({ event, ...payload })
  }

  function grantAllConsent() {
    nuxtApp.$gtmConsentTrigger?.accept()
    pushConsentUpdate(true)
  }

  function denyAllConsent() {
    pushConsentUpdate(false)
  }

  return {
    enabled: Boolean(gtmId),
    pushEvent,
    grantAllConsent,
    denyAllConsent,
  }
}
