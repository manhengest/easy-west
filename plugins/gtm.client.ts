/**
 * GTM + Consent Mode v2 — load the container immediately with denied defaults.
 * Cookie banner only updates consent; it no longer gates the GTM script.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gtmId = config.public.gtmId
  if (!gtmId) {
    return
  }

  const initialized = useState('ew-gtm-init', () => false)
  if (initialized.value) {
    return
  }

  const w = window as Window & { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push([
    'consent',
    'default',
    {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    },
  ])

  useScriptGoogleTagManager({ id: gtmId })

  initialized.value = true
})
