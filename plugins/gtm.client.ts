/**
 * GTM + Consent Mode init — script composables must run in a plugin/setup context,
 * not inside conditional branches in useGtm().
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

  const trigger = useScriptTriggerConsent()
  useScriptGoogleTagManager({
    id: gtmId,
    scriptOptions: { trigger },
  })

  useState('ew-gtm-trigger', () => trigger)
  initialized.value = true
})
