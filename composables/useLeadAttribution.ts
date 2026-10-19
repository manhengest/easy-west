import type { LocationQuery } from 'vue-router'
import {
  applyAttribution,
  normalizeAttribution,
  type AttributionIncoming,
  type LeadAttribution,
} from '~/shared/lead-attribution'

export type { AttributionTouch, LeadAttribution } from '~/shared/lead-attribution'

const ATTRIBUTION_COOKIE = 'ew_attribution'

function queryParam(value: LocationQuery[string]): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw === '') {
    return undefined
  }
  return raw
}

function incomingFromRoute(query: LocationQuery, referrer: string, landingPath: string, touchedAt: string): AttributionIncoming {
  const incoming: AttributionIncoming = { touchedAt }
  const utmSource = queryParam(query.utm_source)
  const utmMedium = queryParam(query.utm_medium)
  const utmCampaign = queryParam(query.utm_campaign)
  const utmContent = queryParam(query.utm_content)
  const utmTerm = queryParam(query.utm_term)
  const gclid = queryParam(query.gclid)
  const gbraid = queryParam(query.gbraid)
  const wbraid = queryParam(query.wbraid)
  const fbclid = queryParam(query.fbclid)

  if (utmSource) incoming.utmSource = utmSource
  if (utmMedium) incoming.utmMedium = utmMedium
  if (utmCampaign) incoming.utmCampaign = utmCampaign
  if (utmContent) incoming.utmContent = utmContent
  if (utmTerm) incoming.utmTerm = utmTerm
  if (gclid) incoming.gclid = gclid
  if (gbraid) incoming.gbraid = gbraid
  if (wbraid) incoming.wbraid = wbraid
  if (fbclid) incoming.fbclid = fbclid
  if (referrer) incoming.referrer = referrer
  if (landingPath) incoming.landingPath = landingPath

  return incoming
}

function touchValue(touch: LeadAttribution['last'] | undefined, key: keyof LeadAttribution['last']): string {
  return touch?.[key] ?? ''
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

    const stored = normalizeAttribution(cookie.value)
    const incoming = incomingFromRoute(
      route.query,
      document.referrer,
      route.fullPath,
      new Date().toISOString(),
    )
    cookie.value = applyAttribution(stored, incoming)
  }

  const attribution = computed(() => normalizeAttribution(cookie.value))

  const hiddenFields = computed(() => {
    const first = attribution.value?.first
    const last = attribution.value?.last

    return {
      utmSource: touchValue(last, 'utmSource'),
      utmMedium: touchValue(last, 'utmMedium'),
      utmCampaign: touchValue(last, 'utmCampaign'),
      utmContent: touchValue(last, 'utmContent'),
      utmTerm: touchValue(last, 'utmTerm'),
      gclid: touchValue(last, 'gclid'),
      gbraid: touchValue(last, 'gbraid'),
      wbraid: touchValue(last, 'wbraid'),
      fbclid: touchValue(last, 'fbclid'),
      referrer: touchValue(last, 'referrer'),
      landingPath: touchValue(last, 'landingPath'),
      firstUtmSource: touchValue(first, 'utmSource'),
      firstUtmMedium: touchValue(first, 'utmMedium'),
      firstUtmCampaign: touchValue(first, 'utmCampaign'),
      firstUtmContent: touchValue(first, 'utmContent'),
      firstUtmTerm: touchValue(first, 'utmTerm'),
      firstGclid: touchValue(first, 'gclid'),
      firstGbraid: touchValue(first, 'gbraid'),
      firstWbraid: touchValue(first, 'wbraid'),
      firstFbclid: touchValue(first, 'fbclid'),
      firstTouchedAt: touchValue(first, 'touchedAt'),
      firstLandingPath: touchValue(first, 'landingPath'),
    }
  })

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
