import { createHash } from 'node:crypto'

const GA4_COLLECT_URL = 'https://www.google-analytics.com/mp/collect'
const META_GRAPH_VERSION = 'v23.0'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ADS_INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest'
const META_EVENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type AdsEventName = 'qualified_lead' | 'booked_move'

export interface AdsEventInput {
  cardId: number
  eventName: AdsEventName
  occurredAt: Date
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
  gaClientId?: string
  fbp?: string
  phone?: string
  value?: number
  currency?: string
}

export interface AdsCredentials {
  ga4MeasurementId?: string
  ga4ApiSecret?: string
  metaPixelId?: string
  metaCapiToken?: string
  googleAdsCustomerId?: string
  googleAdsLoginCustomerId?: string
  googleAdsClientId?: string
  googleAdsClientSecret?: string
  googleAdsRefreshToken?: string
  googleAdsQualifiedActionId?: string
  googleAdsBookedActionId?: string
}

export type AdsDelivery =
  | { ok: true, shouldMark: boolean }
  | { ok: false }

export async function deliverAdsEvent(
  event: AdsEventInput,
  credentials: AdsCredentials,
): Promise<AdsDelivery> {
  const destinations = dueDestinations(event, credentials)
  if (destinations.configured.length === 0) {
    console.error('[ads] no destination configured', { cardId: event.cardId, eventName: event.eventName })
    return { ok: true, shouldMark: false }
  }

  for (const destination of destinations.due) {
    const sent = await destination.send()
    if (!sent) {
      return { ok: false }
    }
  }

  return { ok: true, shouldMark: true }
}

function dueDestinations(event: AdsEventInput, credentials: AdsCredentials) {
  const configured: string[] = []
  const due: { name: string, send: () => Promise<boolean> }[] = []

  const measurementId = credentials.ga4MeasurementId
  const apiSecret = credentials.ga4ApiSecret
  if (measurementId && apiSecret) {
    configured.push('ga4')
    due.push({
      name: 'ga4',
      send: () => sendGa4(event, measurementId, apiSecret),
    })
  }

  const pixelId = credentials.metaPixelId
  const capiToken = credentials.metaCapiToken
  if (pixelId && capiToken) {
    configured.push('meta')
    if (!metaWillAccept(event.occurredAt)) {
      console.info('[ads] Meta skipped an event older than 7 days', { cardId: event.cardId })
    }
    else if (!metaUserData(event)) {
      console.info('[ads] Meta skipped an event with no match key', { cardId: event.cardId })
    }
    else {
      due.push({
        name: 'meta',
        send: () => sendMeta(event, pixelId, capiToken),
      })
    }
  }

  const actionId = event.eventName === 'qualified_lead'
    ? digits(credentials.googleAdsQualifiedActionId)
    : digits(credentials.googleAdsBookedActionId)
  const customerId = digits(credentials.googleAdsCustomerId)
  const adsReady = Boolean(
    customerId
    && actionId
    && credentials.googleAdsClientId
    && credentials.googleAdsClientSecret
    && credentials.googleAdsRefreshToken,
  )
  if (adsReady && customerId && actionId) {
    configured.push('google-ads')
    const click = googleClick(event)
    if (!click) {
      console.info('[ads] Google Ads skipped an event with no click id', { cardId: event.cardId })
    }
    else {
      due.push({
        name: 'google-ads',
        send: () => sendGoogleAds(event, credentials, customerId, actionId, click),
      })
    }
  }

  return { configured, due }
}

function metaWillAccept(occurredAt: Date, now = new Date()): boolean {
  return occurredAt.getTime() >= now.getTime() - META_EVENT_MAX_AGE_MS
}

async function sendGa4(event: AdsEventInput, measurementId: string, apiSecret: string): Promise<boolean> {
  const params: Record<string, unknown> = { engagement_time_msec: 1 }
  if (event.value !== undefined) {
    params.value = event.value
    params.currency = event.currency ?? 'UAH'
  }
  const url = new URL(GA4_COLLECT_URL)
  url.searchParams.set('measurement_id', measurementId)
  url.searchParams.set('api_secret', apiSecret)
  return postJson('ga4', event.cardId, url.toString(), {
    client_id: ga4ClientId(event.cardId, event.gaClientId),
    timestamp_micros: event.occurredAt.getTime() * 1000,
    events: [{ name: event.eventName, params }],
  })
}

function ga4ClientId(cardId: number, stored: string | undefined): string {
  if (stored && stored.includes('.')) {
    return stored
  }
  return `${cardId}.${cardId}`
}

async function sendMeta(event: AdsEventInput, pixelId: string, token: string): Promise<boolean> {
  const userData = metaUserData(event)
  if (!userData) {
    return true
  }
  const data: Record<string, unknown> = {
    event_name: event.eventName,
    event_time: Math.floor(event.occurredAt.getTime() / 1000),
    event_id: `${event.cardId}:${event.eventName}`,
    action_source: 'system_generated',
    user_data: userData,
  }
  if (event.value !== undefined) {
    data.custom_data = { value: event.value, currency: event.currency ?? 'UAH' }
  }
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`)
  url.searchParams.set('access_token', token)
  const responseOk = await postJson('meta', event.cardId, url.toString(), { data: [data] }, async (response) => {
    try {
      const body = await response.json() as { events_received?: unknown, error?: unknown }
      if (body?.error || body?.events_received === 0) {
        return false
      }
    }
    catch {
      return true
    }
    return true
  })
  return responseOk
}

function metaUserData(event: AdsEventInput): Record<string, unknown> | null {
  const userData: Record<string, unknown> = {}
  if (event.fbp) {
    userData.fbp = event.fbp
  }
  if (event.fbclid) {
    userData.fbc = `fb.1.${event.occurredAt.getTime()}.${event.fbclid}`
  }
  const phone = metaPhone(event.phone)
  if (phone) {
    userData.ph = [phone]
  }
  return Object.keys(userData).length > 0 ? userData : null
}

function metaPhone(phone: string | undefined): string | undefined {
  const digitsOnly = phone?.replace(/\D/g, '')
  if (!digitsOnly) {
    return undefined
  }
  return createHash('sha256').update(digitsOnly).digest('hex')
}

function googleClick(event: AdsEventInput): Record<string, string> | null {
  if (event.gclid) {
    return { gclid: event.gclid }
  }
  if (event.gbraid) {
    return { gbraid: event.gbraid }
  }
  if (event.wbraid) {
    return { wbraid: event.wbraid }
  }
  return null
}

async function sendGoogleAds(
  event: AdsEventInput,
  credentials: AdsCredentials,
  customerId: string,
  actionId: string,
  click: Record<string, string>,
): Promise<boolean> {
  const accessToken = await googleAccessToken(credentials)
  if (!accessToken) {
    console.error('[ads] Google Ads token refresh failed', { cardId: event.cardId })
    return false
  }
  const loginId = digits(credentials.googleAdsLoginCustomerId) ?? customerId
  const adsEvent: Record<string, unknown> = {
    eventTimestamp: event.occurredAt.toISOString(),
    eventSource: 'WEB',
    transactionId: `${event.cardId}:${event.eventName}`,
    adIdentifiers: click,
  }
  if (event.value !== undefined) {
    adsEvent.conversionValue = event.value
    adsEvent.currency = event.currency ?? 'UAH'
  }
  return postJson('google-ads', event.cardId, GOOGLE_ADS_INGEST_URL, {
    destinations: [{
      operatingAccount: { accountType: 'GOOGLE_ADS', accountId: customerId },
      loginAccount: { accountType: 'GOOGLE_ADS', accountId: loginId },
      productDestinationId: actionId,
    }],
    encoding: 'HEX',
    events: [adsEvent],
  }, undefined, { Authorization: `Bearer ${accessToken}` })
}

async function googleAccessToken(credentials: AdsCredentials): Promise<string | null> {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.googleAdsRefreshToken ?? '',
        client_id: credentials.googleAdsClientId ?? '',
        client_secret: credentials.googleAdsClientSecret ?? '',
      }),
    })
    if (!response.ok) {
      return null
    }
    const body = await response.json() as { access_token?: unknown }
    return typeof body.access_token === 'string' && body.access_token ? body.access_token : null
  }
  catch {
    console.error('[ads] Google Ads token refresh failed')
    return null
  }
}

async function postJson(
  destination: string,
  cardId: number,
  url: string,
  body: unknown,
  accept?: (response: Response) => Promise<boolean>,
  headers?: Record<string, string>,
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      console.error('[ads] destination rejected the event', { destination, cardId, status: response.status })
      return false
    }
    if (accept && !await accept(response)) {
      console.error('[ads] destination rejected the event', { destination, cardId, status: response.status })
      return false
    }
    return true
  }
  catch {
    console.error('[ads] destination request failed', { destination, cardId })
    return false
  }
}

function digits(value: string | undefined): string | undefined {
  const next = value?.replace(/\D/g, '')
  return next || undefined
}
