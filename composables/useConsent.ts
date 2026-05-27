const ANALYTICS_CONSENT_COOKIE = 'ew_analytics_consent'

export type AnalyticsConsent = 'granted' | 'denied'

export function useConsent() {
  const { grantAllConsent, denyAllConsent } = useGtm()
  const consentCookie = useCookie<AnalyticsConsent | null>(ANALYTICS_CONSENT_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const needsBanner = computed(() => consentCookie.value === null || consentCookie.value === undefined)

  function acceptAll() {
    consentCookie.value = 'granted'
    grantAllConsent()
  }

  function rejectAll() {
    consentCookie.value = 'denied'
    denyAllConsent()
  }

  onMounted(() => {
    if (consentCookie.value === 'granted') {
      grantAllConsent()
    }
    else if (consentCookie.value === 'denied') {
      denyAllConsent()
    }
  })

  return {
    needsBanner,
    consent: consentCookie,
    acceptAll,
    rejectAll,
  }
}
