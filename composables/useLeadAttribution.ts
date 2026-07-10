import type { LocationQuery } from 'vue-router'

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

function hasUtmParams(query: LocationQuery): boolean {
  return UTM_KEYS.some(key => typeof query[key] === 'string' && query[key] !== '')
}

function readUtmFromQuery(query: LocationQuery): Partial<Pick<LeadAttribution, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'>> {
  const next: Partial<Pick<LeadAttribution, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'>> = {}
  if (typeof query.utm_source === 'string' && query.utm_source !== '') {
    next.utmSource = query.utm_source
  }
  if (typeof query.utm_medium === 'string' && query.utm_medium !== '') {
    next.utmMedium = query.utm_medium
  }
  if (typeof query.utm_campaign === 'string' && query.utm_campaign !== '') {
    next.utmCampaign = query.utm_campaign
  }
  if (typeof query.utm_content === 'string' && query.utm_content !== '') {
    next.utmContent = query.utm_content
  }
  if (typeof query.utm_term === 'string' && query.utm_term !== '') {
    next.utmTerm = query.utm_term
  }
  return next
}

export function useLeadAttribution() {
  const route = useRoute()
  const cookie = useCookie<string | null>(ATTRIBUTION_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })

  function captureFromQuery() {
    if (!import.meta.client) {
      return
    }

    const existing = parseAttribution(cookie.value)
    const incomingUtm = readUtmFromQuery(route.query)
    const incomingHasUtm = hasUtmParams(route.query)

    if (!incomingHasUtm && existing) {
      return
    }

    const next: LeadAttribution = incomingHasUtm
      ? {
          ...existing,
          ...incomingUtm,
          referrer: document.referrer || existing?.referrer,
          landingPath: route.fullPath,
        }
      : {
          referrer: document.referrer || undefined,
          landingPath: route.fullPath,
        }

    cookie.value = JSON.stringify(next)
  }

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

  const gtmAttribution = computed(() => ({
    utm_source: hiddenFields.value.utmSource || undefined,
    utm_medium: hiddenFields.value.utmMedium || undefined,
    utm_campaign: hiddenFields.value.utmCampaign || undefined,
    utm_content: hiddenFields.value.utmContent || undefined,
    utm_term: hiddenFields.value.utmTerm || undefined,
    referrer: hiddenFields.value.referrer || undefined,
    landing_path: hiddenFields.value.landingPath || undefined,
  }))

  return { attribution, hiddenFields, gtmAttribution, captureFromQuery }
}
