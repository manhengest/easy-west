const ATTRIBUTION_COOKIE = 'ew_attribution'
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

export interface LeadAttribution {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referrer?: string
  landingPath?: string
}

function parseAttribution(raw: string | null | undefined): LeadAttribution | null {
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as LeadAttribution
  }
  catch {
    return null
  }
}

export function useLeadAttribution() {
  const route = useRoute()
  const cookie = useCookie<string | null>(ATTRIBUTION_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })

  function captureFromQuery() {
    if (cookie.value) {
      return
    }

    const q = route.query
    const next: LeadAttribution = {
      utmSource: typeof q.utm_source === 'string' ? q.utm_source : undefined,
      utmMedium: typeof q.utm_medium === 'string' ? q.utm_medium : undefined,
      utmCampaign: typeof q.utm_campaign === 'string' ? q.utm_campaign : undefined,
      utmContent: typeof q.utm_content === 'string' ? q.utm_content : undefined,
      utmTerm: typeof q.utm_term === 'string' ? q.utm_term : undefined,
      referrer: import.meta.client ? document.referrer || undefined : undefined,
      landingPath: route.fullPath,
    }

    cookie.value = JSON.stringify(next)
  }

  onMounted(captureFromQuery)

  const attribution = computed(() => parseAttribution(cookie.value))

  const hiddenFields = computed(() => ({
    utmSource: attribution.value?.utmSource ?? '',
    utmMedium: attribution.value?.utmMedium ?? '',
    utmCampaign: attribution.value?.utmCampaign ?? '',
    utmContent: attribution.value?.utmContent ?? '',
    utmTerm: attribution.value?.utmTerm ?? '',
    referrer: attribution.value?.referrer ?? '',
    landingPath: attribution.value?.landingPath ?? '',
  }))

  return { attribution, hiddenFields, captureFromQuery }
}
