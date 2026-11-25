import type { AttributionTouch } from './lead-attribution'
import type { MessengerLeadChannel } from './lead-constants'
import { MESSENGER_LEAD_CHANNELS } from './lead-constants'
import { LEAD_ID_PATTERN, mintLeadId } from './lead-id'

export const MESSENGER_LEAD_COOKIE = 'ew_messenger_lead'
export const MESSENGER_LEAD_MAX_AGE = 60 * 60 * 24 * 30
export const MESSENGER_LEAD_TTL_MS = MESSENGER_LEAD_MAX_AGE * 1000

export interface MessengerChannelLead {
  leadId: string
  clickedAt: string
  cardId?: number
  touchKey?: string
}

export type MessengerLeadStore = Partial<Record<MessengerLeadChannel, MessengerChannelLead>>

export interface TagFields {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
}

function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function isTaggedTouch(touch: TagFields | undefined): boolean {
  if (!touch) {
    return false
  }

  const utmSource = text(touch.utmSource)
  const utmMedium = text(touch.utmMedium)
  if (text(touch.gclid) || text(touch.gbraid) || text(touch.wbraid) || text(touch.fbclid)) {
    return true
  }
  if (text(touch.utmCampaign) || text(touch.utmContent) || text(touch.utmTerm)) {
    return true
  }
  if (utmMedium && utmMedium !== 'direct' && utmMedium !== 'referral') {
    return true
  }
  if (utmSource && utmSource !== 'direct' && utmMedium !== 'referral') {
    return true
  }
  return false
}

export function messengerTouchKey(touch: TagFields | undefined): string {
  return [
    text(touch?.utmSource) ?? '',
    text(touch?.utmMedium) ?? '',
    text(touch?.utmCampaign) ?? '',
    text(touch?.utmContent) ?? '',
    text(touch?.utmTerm) ?? '',
    text(touch?.gclid) ?? '',
    text(touch?.gbraid) ?? '',
    text(touch?.wbraid) ?? '',
    text(touch?.fbclid) ?? '',
  ].join('\0')
}

function parseCardId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    return Number(value)
  }
  return undefined
}

function parseChannelLead(value: unknown): MessengerChannelLead | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  if (typeof record.leadId !== 'string' || !LEAD_ID_PATTERN.test(record.leadId)) {
    return null
  }
  if (typeof record.clickedAt !== 'string' || Number.isNaN(Date.parse(record.clickedAt))) {
    return null
  }

  const lead: MessengerChannelLead = {
    leadId: record.leadId,
    clickedAt: record.clickedAt,
  }
  const cardId = parseCardId(record.cardId)
  if (cardId !== undefined) {
    lead.cardId = cardId
  }
  if (typeof record.touchKey === 'string') {
    lead.touchKey = record.touchKey
  }
  return lead
}

export function normalizeMessengerLeadStore(raw: unknown): MessengerLeadStore {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    }
    catch {
      return {}
    }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const record = value as Record<string, unknown>
  const store: MessengerLeadStore = {}
  for (const channel of MESSENGER_LEAD_CHANNELS) {
    const parsed = parseChannelLead(record[channel])
    if (parsed) {
      store[channel] = parsed
    }
  }
  return store
}

function isFresh(clickedAt: string, now: number): boolean {
  const then = Date.parse(clickedAt)
  return !Number.isNaN(then) && now - then < MESSENGER_LEAD_TTL_MS
}

export interface MessengerClickDecision {
  kind: 'mint' | 'reopen'
  leadId: string
  cardId?: number
  putLastTouch: boolean
  /** Same lead, KeyCRM card still missing — POST again, do not mint a second lead. */
  retryCreate: boolean
  store: MessengerLeadStore
  writeStore: boolean
}

export function decideMessengerClick(input: {
  store: MessengerLeadStore | null
  channel: MessengerLeadChannel
  now: number
  lastTouch?: AttributionTouch
  mintId?: () => string
}): MessengerClickDecision {
  const store = input.store ?? {}
  const existing = store[input.channel]
  const key = messengerTouchKey(input.lastTouch)

  if (existing && isFresh(existing.clickedAt, input.now)) {
    const putLastTouch = existing.cardId !== undefined
      && isTaggedTouch(input.lastTouch)
      && key !== (existing.touchKey ?? '')
    const decision: MessengerClickDecision = {
      kind: 'reopen',
      leadId: existing.leadId,
      putLastTouch,
      retryCreate: existing.cardId === undefined,
      store,
      writeStore: false,
    }
    if (existing.cardId !== undefined) {
      decision.cardId = existing.cardId
    }
    return decision
  }

  const leadId = (input.mintId ?? mintLeadId)()
  return {
    kind: 'mint',
    leadId,
    putLastTouch: false,
    retryCreate: false,
    writeStore: true,
    store: {
      ...store,
      [input.channel]: {
        leadId,
        clickedAt: new Date(input.now).toISOString(),
        touchKey: key,
      },
    },
  }
}

export function withCardId(
  store: MessengerLeadStore,
  channel: MessengerLeadChannel,
  leadId: string,
  cardId: number,
): MessengerLeadStore | null {
  const current = store[channel]
  if (!current || current.leadId !== leadId) {
    return null
  }
  return {
    ...store,
    [channel]: { ...current, cardId },
  }
}

export function withTouchKey(
  store: MessengerLeadStore,
  channel: MessengerLeadChannel,
  leadId: string,
  touchKey: string,
): MessengerLeadStore | null {
  const current = store[channel]
  if (!current || current.leadId !== leadId) {
    return null
  }
  return {
    ...store,
    [channel]: { ...current, touchKey },
  }
}
