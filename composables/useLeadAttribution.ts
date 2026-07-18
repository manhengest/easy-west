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

function queryParam(value: LocationQuery[string]): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw === '') {
    return undefined
  }
  return raw
}

function hasUtmParams(query: LocationQuery): boolean {
  return UTM_KEYS.some(key => queryParam(query[key]) !== undefined)
}

function readUtmFromQuery(query: LocationQuery): Partial<Pick<LeadAttribution, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'>> {
  const next: Partial<Pick<LeadAttribution, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'>> = {}
  const source = queryParam(query.utm_source)
  const medium = queryParam(query.utm_medium)
  const campaign = queryParam(query.utm_campaign)
  const content = queryParam(query.utm_content)
  const term = queryParam(query.utm_term)

  if (source) {
    next.utmSource = source
  }
  if (medium) {
    next.utmMedium = medium
  }
  if (campaign) {
    next.utmCampaign = campaign
  }
  if (content) {
    next.utmContent = content
  }
  if (term) {
    next.utmTerm = term
  }
  return next
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function attributionFromRecord(data: Record<string, unknown>): LeadAttribution | null {
  const next: LeadAttribution = {}
  const utmSource = nonEmptyString(data.utmSource)
  const utmMedium = nonEmptyString(data.utmMedium)
  const utmCampaign = nonEmptyString(data.utmCampaign)
  const utmContent = nonEmptyString(data.utmContent)
  const utmTerm = nonEmptyString(data.utmTerm)
  const referrer = nonEmptyString(data.referrer)
  const landingPath = nonEmptyString(data.landingPath)

  if (utmSource) next.utmSource = utmSource
  if (utmMedium) next.utmMedium = utmMedium
  if (utmCampaign) next.utmCampaign = utmCampaign
  if (utmContent) next.utmContent = utmContent
  if (utmTerm) next.utmTerm = utmTerm
  if (referrer) next.referrer = referrer
  if (landingPath) next.landingPath = landingPath

  return Object.keys(next).length > 0 ? next : null
}

function normalizeAttribution(raw: unknown): LeadAttribution | null {
  if (!raw) {
    return null
  }
  if (typeof raw === 'string') {
    try {
      return normalizeAttribution(JSON.parse(raw))
    }
    catch {
      return null
    }
  }
  if (typeof raw !== 'object') {
    return null
  }
  return attributionFromRecord(raw as Record<string, unknown>)
}

export function useLeadAttribution() {
  const route = useRoute()
  const cookie = useCookie<LeadAttribution | string | null>(ATTRIBUTION_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })

  function captureFromQuery() {
    if (!import.meta.client) {
      return
    }

    const existing = normalizeAttribution(cookie.value)
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

    cookie.value = next
  }

  const attribution = computed(() => {
    const stored = normalizeAttribution(cookie.value)
    if (!import.meta.client) {
      return stored
    }

    // Prefer live URL UTMs when present so first paint / late cookie sync still works.
    const liveUtm = readUtmFromQuery(route.query)
    if (!hasUtmParams(route.query)) {
      return stored
    }

    return {
      ...stored,
      ...liveUtm,
      referrer: stored?.referrer || document.referrer || undefined,
      landingPath: stored?.landingPath || route.fullPath,
    }
  })

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
