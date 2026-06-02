const ANALYTICS_CONSENT_COOKIE = 'ew_analytics_consent'

export type AnalyticsConsent = 'granted' | 'denied'

function hasConsentChoice(value: AnalyticsConsent | null | undefined): value is AnalyticsConsent {
  return value === 'granted' || value === 'denied'
}

export function useConsent() {
  const { grantAllConsent, denyAllConsent } = useGtm()
  const consentCookie = useCookie<AnalyticsConsent | null>(ANALYTICS_CONSENT_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  // Avoid banner flash: prerendered HTML has no cookies; read choice only after client mount.
  const consentReady = ref(false)

  const needsBanner = computed(() => consentReady.value && !hasConsentChoice(consentCookie.value))

  function acceptAll() {
    consentCookie.value = 'granted'
    grantAllConsent()
  }

  function rejectAll() {
    consentCookie.value = 'denied'
    denyAllConsent()
  }

  onMounted(() => {
    consentReady.value = true

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
