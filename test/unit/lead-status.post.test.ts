import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KEYCRM_API_ORIGIN, KEYCRM_API_URL, KEYCRM_FIELDS, KEYCRM_WEBHOOK_SECRET_HEADER } from '~/server/utils/keycrm-map'

const SECRET = 'hook-secret'
const readBody = vi.fn()
const useRuntimeConfig = vi.fn()
const getHeader = vi.fn()

vi.stubGlobal('readBody', readBody)
vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)
vi.stubGlobal('getHeader', getHeader)
vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string }) => {
  return Object.assign(new Error(opts.statusMessage), opts)
})

const { default: handler } = await import('~/server/api/keycrm/lead-status.post')

function readyConfig(overrides: Record<string, unknown> = {}) {
  return {
    keycrmApiKey: 'crm-key',
    keycrmWebhookSecret: SECRET,
    keycrmAdsQualifiedField: 'LD_1023',
    keycrmAdsBookedField: 'LD_1024',
    ga4MeasurementId: 'G-TEST',
    ga4ApiSecret: 'ga-secret',
    metaPixelId: '123456',
    metaCapiToken: 'meta-token',
    googleAdsCustomerId: '123-456-7890',
    googleAdsClientId: 'client-id',
    googleAdsClientSecret: 'client-secret',
    googleAdsRefreshToken: 'refresh-token',
    googleAdsQualifiedActionId: '111',
    googleAdsBookedActionId: '222',
    ...overrides,
  }
}

function formCard(overrides: Record<string, unknown> = {}) {
  return {
    id: 148,
    pipeline_id: 1,
    status: { id: 5, title: 'Кваліфіковано' },
    currency_code: 'UAH',
    products_total: 15000,
    contact: { phone: '+380933218899' },
    custom_fields: [
      { uuid: KEYCRM_FIELDS.gclid, value: 'g-click' },
      { uuid: KEYCRM_FIELDS.fbclid, value: 'fb-click' },
      { uuid: KEYCRM_FIELDS.gaClientId, value: '111.222' },
      { uuid: KEYCRM_FIELDS.fbp, value: 'fb.1.10.999' },
    ],
    ...overrides,
  }
}

function notice(at: string, context: Record<string, unknown> = {}) {
  return {
    event: 'lead.change_lead_status',
    context: {
      id: 148,
      pipeline_id: 1,
      status_changed_at: at,
      ...context,
    },
  }
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

let cardBody: unknown = formCard()
let cardStatus = 200
let ga4Status = 204
let metaBody: unknown = { events_received: 1 }
let metaStatus = 200
let tokenStatus = 200
let adsStatus = 200
let markStatus = 200

function installFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const href = String(url)
    const method = init?.method ?? 'GET'
    if (href.includes('/statuses')) {
      return jsonResponse({ data: [{ id: 7, title: 'Кваліфіковано' }] })
    }
    if (href.startsWith(KEYCRM_API_URL) && method === 'GET') {
      return jsonResponse(cardBody, cardStatus)
    }
    if (href.startsWith(KEYCRM_API_URL) && method === 'PUT') {
      return jsonResponse({}, markStatus)
    }
    if (href.includes('google-analytics.com')) {
      return jsonResponse(null, ga4Status)
    }
    if (href.includes('graph.facebook.com')) {
      return jsonResponse(metaBody, metaStatus)
    }
    if (href.includes('oauth2.googleapis.com')) {
      return jsonResponse({ access_token: 'ya29.token' }, tokenStatus)
    }
    if (href.includes('datamanager.googleapis.com')) {
      return jsonResponse({ requestId: 'req-1' }, adsStatus)
    }
    throw new Error(`unexpected fetch ${method} ${href}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function call(
  body: unknown,
  headers: Record<string, string> = { [KEYCRM_WEBHOOK_SECRET_HEADER]: SECRET },
  config: Record<string, unknown> = readyConfig(),
) {
  readBody.mockResolvedValue(body)
  useRuntimeConfig.mockReturnValue(config)
  getHeader.mockImplementation((_event: unknown, name: string) => headers[name])
  return handler({} as never)
}

function callsTo(fetchMock: ReturnType<typeof installFetch>, part: string) {
  return fetchMock.mock.calls.filter(entry => String(entry[0]).includes(part))
}

function jsonBody(entry: unknown[]) {
  return JSON.parse(String((entry[1] as RequestInit).body))
}

describe('POST /api/keycrm/lead-status', () => {
  let fetchMock: ReturnType<typeof installFetch>
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    cardBody = formCard()
    cardStatus = 200
    ga4Status = 204
    metaBody = { events_received: 1 }
    metaStatus = 200
    tokenStatus = 200
    adsStatus = 200
    markStatus = 200
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    fetchMock = installFetch()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('rejects a missing webhook secret', async () => {
    await expect(call(notice(new Date().toISOString()), {})).rejects.toMatchObject({ statusCode: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a wrong webhook secret', async () => {
    await expect(call(
      notice(new Date().toISOString()),
      { [KEYCRM_WEBHOOK_SECRET_HEADER]: 'other' },
    )).rejects.toMatchObject({ statusCode: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignores an event that is not a lead status change', async () => {
    const result = await call({ event: 'order.change_order_status', context: { id: 148 } })
    expect(result).toEqual({ ok: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignores a card from another pipeline', async () => {
    const result = await call(notice(new Date().toISOString(), { pipeline_id: 2 }))
    expect(result).toEqual({ ok: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retries when the KeyCRM API key is missing', async () => {
    await expect(call(
      notice(new Date().toISOString()),
      { [KEYCRM_WEBHOOK_SECRET_HEADER]: SECRET },
      readyConfig({ keycrmApiKey: '' }),
    )).rejects.toMatchObject({ statusCode: 502 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not teach ads from a chat card', async () => {
    cardBody = formCard({
      title: 'Чат з Easy West',
      products_total: 0,
      contact: {},
      custom_fields: [],
    })

    const result = await call(notice(new Date().toISOString()))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
    expect(callsTo(fetchMock, 'graph.facebook.com')).toHaveLength(0)
    expect(callsTo(fetchMock, 'datamanager.googleapis.com')).toHaveLength(0)
  })

  it('does not treat a first-touch click id as the ads click', async () => {
    cardBody = formCard({
      custom_fields: [{ uuid: KEYCRM_FIELDS.firstGclid, value: 'first-only' }],
    })

    const result = await call(notice(new Date().toISOString()))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
  })

  it('does not send a calculation-request status', async () => {
    cardBody = formCard({ status: { id: 3, title: 'Запит на розрахунок' } })

    const result = await call(notice(new Date().toISOString()))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
  })

  it('sends qualified_lead once and marks the card', async () => {
    const changedAt = new Date(Date.now() - 60_000).toISOString()

    const result = await call(notice(changedAt))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, '/statuses')).toHaveLength(0)
    const ga4 = jsonBody(callsTo(fetchMock, 'google-analytics.com')[0]!)
    expect(ga4.client_id).toBe('111.222')
    expect(ga4.timestamp_micros).toBe(Date.parse(changedAt) * 1000)
    expect(ga4.events).toEqual([{
      name: 'qualified_lead',
      params: { engagement_time_msec: 1, value: 15000, currency: 'UAH' },
    }])

    const meta = jsonBody(callsTo(fetchMock, 'graph.facebook.com')[0]!)
    expect(meta.data[0]).toMatchObject({
      event_name: 'qualified_lead',
      event_time: Math.floor(Date.parse(changedAt) / 1000),
      event_id: '148:qualified_lead',
      action_source: 'system_generated',
      user_data: {
        fbp: 'fb.1.10.999',
        fbc: `fb.1.${Date.parse(changedAt)}.fb-click`,
        ph: ['6033e0a3ad9276c674d4de5298ab7682d36e238268e8d2f889280eb7de5e04cf'],
      },
      custom_data: { value: 15000, currency: 'UAH' },
    })

    const oauth = callsTo(fetchMock, 'oauth2.googleapis.com')[0]!
    expect(String((oauth[1] as RequestInit).body)).toContain('grant_type=refresh_token')
    expect(String((oauth[1] as RequestInit).body)).toContain('refresh_token=refresh-token')

    const ads = jsonBody(callsTo(fetchMock, 'datamanager.googleapis.com')[0]!)
    expect(ads.destinations[0].operatingAccount.accountId).toBe('1234567890')
    expect(ads.destinations[0].productDestinationId).toBe('111')
    expect(ads.events[0]).toMatchObject({
      eventSource: 'WEB',
      transactionId: '148:qualified_lead',
      adIdentifiers: { gclid: 'g-click' },
      conversionValue: 15000,
      currency: 'UAH',
    })
    expect(JSON.stringify(ads)).not.toContain('generate_lead')

    const mark = jsonBody(callsTo(fetchMock, KEYCRM_API_URL).find(entry => (entry[1] as RequestInit).method === 'PUT')!)
    expect(mark).toEqual({
      custom_fields: [{ uuid: 'LD_1023', value: new Date(changedAt).toISOString() }],
    })
  })

  it('does not send qualified_lead again after the card is marked', async () => {
    cardBody = formCard({
      custom_fields: [
        { uuid: KEYCRM_FIELDS.gclid, value: 'g-click' },
        { uuid: 'LD_1023', value: '2026-11-01T00:00:00.000Z' },
      ],
    })

    const result = await call(notice(new Date().toISOString()))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
  })

  it('sends only booked_move when the card skips qualification', async () => {
    cardBody = formCard({ status: { id: 8, title: 'Заброньовано' } })
    const changedAt = new Date(Date.now() - 60_000).toISOString()

    const result = await call(notice(changedAt, { id: '148' }))

    expect(result).toEqual({ ok: true })
    const sent = [
      ...callsTo(fetchMock, 'google-analytics.com'),
      ...callsTo(fetchMock, 'graph.facebook.com'),
      ...callsTo(fetchMock, 'datamanager.googleapis.com'),
    ].map(entry => JSON.stringify(jsonBody(entry)))
    expect(sent.join('\n')).toContain('booked_move')
    expect(sent.join('\n')).not.toContain('qualified_lead')
    const ads = jsonBody(callsTo(fetchMock, 'datamanager.googleapis.com')[0]!)
    expect(ads.destinations[0].productDestinationId).toBe('222')
    const mark = jsonBody(callsTo(fetchMock, KEYCRM_API_URL).find(entry => (entry[1] as RequestInit).method === 'PUT')!)
    expect(mark.custom_fields[0].uuid).toBe('LD_1024')
  })

  it('uses gbraid when the card has no gclid', async () => {
    cardBody = formCard({
      custom_fields: [
        { uuid: KEYCRM_FIELDS.gbraid, value: 'gb-click' },
        { uuid: KEYCRM_FIELDS.wbraid, value: 'wb-click' },
        { uuid: KEYCRM_FIELDS.fbclid, value: 'fb-click' },
      ],
    })

    await call(notice(new Date(Date.now() - 60_000).toISOString()))

    const ads = jsonBody(callsTo(fetchMock, 'datamanager.googleapis.com')[0]!)
    expect(ads.events[0].adIdentifiers).toEqual({ gbraid: 'gb-click' })
  })

  it('keeps a late qualification in GA4 and Google Ads when Meta will drop it', async () => {
    const changedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()

    const result = await call(notice(changedAt))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'graph.facebook.com')).toHaveLength(0)
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(1)
    expect(callsTo(fetchMock, 'datamanager.googleapis.com')).toHaveLength(1)
    expect(callsTo(fetchMock, KEYCRM_API_URL).some(entry => (entry[1] as RequestInit).method === 'PUT')).toBe(true)
  })

  it('still marks the card when Google Ads credentials are absent', async () => {
    const result = await call(notice(new Date(Date.now() - 60_000).toISOString()), undefined, readyConfig({
      googleAdsCustomerId: '',
      googleAdsClientId: '',
      googleAdsClientSecret: '',
      googleAdsRefreshToken: '',
      googleAdsQualifiedActionId: '',
      googleAdsBookedActionId: '',
    }))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'oauth2.googleapis.com')).toHaveLength(0)
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(1)
    expect(callsTo(fetchMock, 'graph.facebook.com')).toHaveLength(1)
    expect(callsTo(fetchMock, KEYCRM_API_URL).some(entry => (entry[1] as RequestInit).method === 'PUT')).toBe(true)
  })

  it('does not mark the card when a destination rejects the event', async () => {
    ga4Status = 500

    await expect(call(notice(new Date().toISOString()))).rejects.toMatchObject({ statusCode: 502 })
    expect(callsTo(fetchMock, KEYCRM_API_URL).some(entry => (entry[1] as RequestInit).method === 'PUT')).toBe(false)
  })

  it('retries when the card cannot be read', async () => {
    cardStatus = 500
    await expect(call(notice(new Date().toISOString()))).rejects.toMatchObject({ statusCode: 502 })
  })

  it('acks a missing card', async () => {
    cardStatus = 404
    const result = await call(notice(new Date().toISOString()))
    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
  })

  it('reads the status title from the pipeline when the card omits it', async () => {
    cardBody = { data: [formCard({ status: { id: 7 } })] }

    const result = await call(notice(new Date(Date.now() - 60_000).toISOString()))

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, `${KEYCRM_API_ORIGIN}/pipelines/1/statuses`)).toHaveLength(1)
    expect(jsonBody(callsTo(fetchMock, 'google-analytics.com')[0]!).events[0].name).toBe('qualified_lead')
  })

  it('retries when no ads destination is configured', async () => {
    await expect(call(notice(new Date().toISOString()), undefined, readyConfig({
      ga4MeasurementId: '',
      ga4ApiSecret: '',
      metaPixelId: '',
      metaCapiToken: '',
      googleAdsCustomerId: '',
      googleAdsClientId: '',
      googleAdsClientSecret: '',
      googleAdsRefreshToken: '',
      googleAdsQualifiedActionId: '',
      googleAdsBookedActionId: '',
    }))).rejects.toMatchObject({ statusCode: 502 })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
    expect(callsTo(fetchMock, KEYCRM_API_URL).some(entry => (entry[1] as RequestInit).method === 'PUT')).toBe(false)
  })

  it('does not send when the mark field is not configured', async () => {
    await expect(call(
      notice(new Date(Date.now() - 60_000).toISOString()),
      undefined,
      readyConfig({ keycrmAdsQualifiedField: '' }),
    )).rejects.toMatchObject({ statusCode: 502 })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
  })

  it('does not invent an event time', async () => {
    const result = await call({
      event: 'lead.change_lead_status',
      context: { id: 148, pipeline_id: 1 },
    })

    expect(result).toEqual({ ok: true })
    expect(callsTo(fetchMock, 'google-analytics.com')).toHaveLength(0)
  })

  it('sends the payment total in UAH when the card has no product total', async () => {
    cardBody = formCard({ products_total: 0, payments_total: '4800', currency_code: '' })

    await call(notice(new Date(Date.now() - 60_000).toISOString()))

    const ga4 = jsonBody(callsTo(fetchMock, 'google-analytics.com')[0]!)
    expect(ga4.events[0].params.value).toBe(4800)
    expect(ga4.events[0].params.currency).toBe('UAH')
  })

  it('does not mark the card when Meta accepts zero events', async () => {
    metaBody = { events_received: 0 }

    await expect(call(notice(new Date().toISOString()))).rejects.toMatchObject({ statusCode: 502 })
    expect(callsTo(fetchMock, KEYCRM_API_URL).some(entry => (entry[1] as RequestInit).method === 'PUT')).toBe(false)
  })
})
