import { createHash, timingSafeEqual } from 'node:crypto'
import { deliverAdsEvent, type AdsCredentials, type AdsEventName } from '../../utils/ads-conversions'
import { keycrmId, markAdsEventSent, readPipelineCard, type PipelineCardView } from '../../utils/keycrm'
import { KEYCRM_PIPELINE_ID, KEYCRM_STATUS, KEYCRM_WEBHOOK_SECRET_HEADER } from '../../utils/keycrm-map'

interface LeadStatusNotice {
  cardId: number
  pipelineId?: number
  statusChangedAt?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = present(config.keycrmWebhookSecret)
  const provided = getHeader(event, KEYCRM_WEBHOOK_SECRET_HEADER) ?? ''
  if (!secret || !secretsMatch(secret, provided)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const notice = parseLeadStatusNotice(await readBody(event))
  if (!notice) {
    return { ok: true }
  }
  if (notice.pipelineId !== undefined && notice.pipelineId !== KEYCRM_PIPELINE_ID) {
    return { ok: true }
  }

  const apiKey = present(config.keycrmApiKey)
  if (!apiKey) {
    console.error('[ads] KeyCRM API key is not configured')
    throw createError({ statusCode: 502, statusMessage: 'KeyCRM is not configured' })
  }

  const marks = {
    qualifiedField: present(config.keycrmAdsQualifiedField),
    bookedField: present(config.keycrmAdsBookedField),
  }
  const read = await readPipelineCard(apiKey, notice.cardId, marks)
  if (!read.ok) {
    if (!read.retry) {
      return { ok: true }
    }
    throw createError({ statusCode: 502, statusMessage: 'KeyCRM card read failed' })
  }

  const card = read.card
  if (card.pipelineId !== null && card.pipelineId !== KEYCRM_PIPELINE_ID) {
    return { ok: true }
  }

  const eventName = adsEventForStatus(card.statusTitle)
  if (!eventName || !hasAdsAttribution(card) || alreadySent(card, eventName)) {
    return { ok: true }
  }

  const occurredAt = occurredAtFrom(notice.statusChangedAt) ?? occurredAtFrom(card.statusChangedAt)
  if (!occurredAt) {
    console.error('[ads] status change has no status_changed_at', { cardId: card.id })
    return { ok: true }
  }

  const fieldUuid = eventName === 'qualified_lead' ? marks.qualifiedField : marks.bookedField
  if (!fieldUuid) {
    console.error('[ads] KeyCRM mark field is not configured', { cardId: card.id, eventName })
    throw createError({ statusCode: 502, statusMessage: 'KeyCRM mark field is not configured' })
  }

  const delivery = await deliverAdsEvent({
    cardId: card.id,
    eventName,
    occurredAt,
    gclid: card.gclid,
    gbraid: card.gbraid,
    wbraid: card.wbraid,
    fbclid: card.fbclid,
    gaClientId: card.gaClientId,
    fbp: card.fbp,
    phone: card.phone,
    value: card.value,
    currency: card.value === undefined ? undefined : 'UAH',
  }, adsCredentials(config))

  if (!delivery.ok || !delivery.shouldMark) {
    throw createError({ statusCode: 502, statusMessage: 'Ads conversion delivery failed' })
  }

  const marked = await markAdsEventSent(apiKey, card.id, fieldUuid, occurredAt.toISOString())
  if (!marked) {
    throw createError({ statusCode: 502, statusMessage: 'KeyCRM mark failed' })
  }

  return { ok: true }
})

function parseLeadStatusNotice(body: unknown): LeadStatusNotice | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  const record = body as { event?: unknown, context?: unknown }
  if (record.event !== 'lead.change_lead_status' || !record.context || typeof record.context !== 'object') {
    return null
  }
  const context = record.context as {
    id?: unknown
    pipeline_id?: unknown
    status_changed_at?: unknown
  }
  const cardId = keycrmId(context.id)
  if (cardId === null) {
    return null
  }
  const pipelineId = keycrmId(context.pipeline_id)
  const statusChangedAt = typeof context.status_changed_at === 'string' && context.status_changed_at.trim()
    ? context.status_changed_at.trim()
    : undefined
  return {
    cardId,
    ...(pipelineId === null ? {} : { pipelineId }),
    ...(statusChangedAt ? { statusChangedAt } : {}),
  }
}

function adsEventForStatus(title: string): AdsEventName | null {
  if (title === KEYCRM_STATUS.qualified) {
    return 'qualified_lead'
  }
  if (title === KEYCRM_STATUS.booked) {
    return 'booked_move'
  }
  return null
}

function hasAdsAttribution(card: PipelineCardView): boolean {
  return Boolean(card.gclid || card.gbraid || card.wbraid || card.fbclid || card.gaClientId || card.fbp)
}

function alreadySent(card: PipelineCardView, eventName: AdsEventName): boolean {
  return eventName === 'qualified_lead' ? card.qualifiedSent : card.bookedSent
}

function occurredAtFrom(raw: string | undefined): Date | null {
  if (!raw) {
    return null
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function adsCredentials(config: ReturnType<typeof useRuntimeConfig>): AdsCredentials {
  return {
    ga4MeasurementId: present(config.ga4MeasurementId),
    ga4ApiSecret: present(config.ga4ApiSecret),
    metaPixelId: present(config.metaPixelId),
    metaCapiToken: present(config.metaCapiToken),
    googleAdsCustomerId: present(config.googleAdsCustomerId),
    googleAdsLoginCustomerId: present(config.googleAdsLoginCustomerId),
    googleAdsClientId: present(config.googleAdsClientId),
    googleAdsClientSecret: present(config.googleAdsClientSecret),
    googleAdsRefreshToken: present(config.googleAdsRefreshToken),
    googleAdsQualifiedActionId: present(config.googleAdsQualifiedActionId),
    googleAdsBookedActionId: present(config.googleAdsBookedActionId),
  }
}

function present(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed || undefined
}

function secretsMatch(expected: string, provided: string): boolean {
  const left = createHash('sha256').update(expected).digest()
  const right = createHash('sha256').update(provided).digest()
  return timingSafeEqual(left, right)
}
