import {
  LEAD_DEVICES,
  LEAD_SOURCES,
  LOCALE_CODES,
  MESSENGER_LEAD_CHANNELS,
  type LeadDevice,
  type LeadSource,
  type LocaleCode,
  type MessengerLeadChannel,
} from './lead-constants'
import { LEAD_ID_PATTERN } from './lead-id'
import type { LeadSubmitPayload, MessengerLeadPayload } from './lead-schema'
import { isTaggedTouch, messengerTouchKey, MESSENGER_LEAD_TTL_MS } from './messenger-lead'

export const MATCH_WINDOW_MS = 15 * 60 * 1000
export const PENDING_LEAD_TTL_MS = MESSENGER_LEAD_TTL_MS

const LAST_TOUCH_KEYS = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'utmTerm',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
] as const

const COPY_KEYS = [
  ...LAST_TOUCH_KEYS,
  'gaClientId',
  'fbp',
  'referrer',
  'landingPath',
  'firstUtmSource',
  'firstUtmMedium',
  'firstUtmCampaign',
  'firstUtmContent',
  'firstUtmTerm',
  'firstGclid',
  'firstGbraid',
  'firstWbraid',
  'firstFbclid',
  'firstTouchedAt',
  'firstLandingPath',
  'from',
  'to',
  'details',
] as const

type CopyKey = (typeof COPY_KEYS)[number]

export interface PendingLead {
  leadId: string
  kind: 'click' | 'form'
  channel: MessengerLeadChannel
  lastTouchAt: string
  source: LeadSource
  locale: LocaleCode
  device: LeadDevice
  matchedCardId?: number
  formCardId?: number
  from?: string
  to?: string
  details?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
  gaClientId?: string
  fbp?: string
  referrer?: string
  landingPath?: string
  firstUtmSource?: string
  firstUtmMedium?: string
  firstUtmCampaign?: string
  firstUtmContent?: string
  firstUtmTerm?: string
  firstGclid?: string
  firstGbraid?: string
  firstWbraid?: string
  firstFbclid?: string
  firstTouchedAt?: string
  firstLandingPath?: string
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed || undefined
}

function positiveId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }
  return undefined
}

function copyStrings(source: object): Partial<PendingLead> {
  const record = source as Record<string, unknown>
  const copied: Partial<PendingLead> = {}
  for (const key of COPY_KEYS) {
    const value = text(record[key])
    if (value) {
      copied[key] = value
    }
  }
  return copied
}

function isChannel(value: unknown): value is MessengerLeadChannel {
  return typeof value === 'string' && (MESSENGER_LEAD_CHANNELS as readonly string[]).includes(value)
}

function isSource(value: unknown): value is LeadSource {
  return typeof value === 'string' && (LEAD_SOURCES as readonly string[]).includes(value)
}

function isLocale(value: unknown): value is LocaleCode {
  return typeof value === 'string' && (LOCALE_CODES as readonly string[]).includes(value)
}

function isDevice(value: unknown): value is LeadDevice {
  return typeof value === 'string' && (LEAD_DEVICES as readonly string[]).includes(value)
}

export function parsePendingLead(raw: unknown): PendingLead | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const record = raw as Record<string, unknown>
  if (typeof record.leadId !== 'string' || !LEAD_ID_PATTERN.test(record.leadId)) {
    return null
  }
  if (record.kind !== 'click' && record.kind !== 'form') {
    return null
  }
  if (!isChannel(record.channel) || !isSource(record.source) || !isLocale(record.locale) || !isDevice(record.device)) {
    return null
  }
  if (typeof record.lastTouchAt !== 'string' || Number.isNaN(Date.parse(record.lastTouchAt))) {
    return null
  }

  const lead: PendingLead = {
    leadId: record.leadId,
    kind: record.kind,
    channel: record.channel,
    lastTouchAt: record.lastTouchAt,
    source: record.source,
    locale: record.locale,
    device: record.device,
    ...copyStrings(record),
  }
  const matchedCardId = positiveId(record.matchedCardId)
  const formCardId = positiveId(record.formCardId)
  if (matchedCardId !== undefined) {
    lead.matchedCardId = matchedCardId
  }
  if (formCardId !== undefined) {
    lead.formCardId = formCardId
  }
  return lead
}

export function pendingFromClick(payload: MessengerLeadPayload, lastTouchAt: string): PendingLead {
  return {
    leadId: payload.leadId,
    kind: 'click',
    channel: payload.channel,
    lastTouchAt,
    source: payload.source,
    locale: payload.locale,
    device: payload.device,
    ...copyStrings(payload),
  }
}

export function pendingFromForm(
  leadId: string,
  payload: LeadSubmitPayload,
  lastTouchAt: string,
): PendingLead | null {
  if (!isChannel(payload.contactMethod)) {
    return null
  }
  return {
    leadId,
    kind: 'form',
    channel: payload.contactMethod,
    lastTouchAt,
    source: payload.source,
    locale: payload.locale,
    device: payload.device,
    ...copyStrings(payload),
  }
}

function assignText(record: PendingLead, key: CopyKey, value: unknown): void {
  const next = text(value)
  if (next) {
    record[key] = next
  }
}

export function applyMessengerClick(
  existing: PendingLead | null,
  payload: MessengerLeadPayload,
  lastTouchAt: string,
): { record: PendingLead, pushLastTouch: boolean } {
  if (!existing || existing.leadId !== payload.leadId) {
    return { record: pendingFromClick(payload, lastTouchAt), pushLastTouch: false }
  }

  const next: PendingLead = {
    ...existing,
    lastTouchAt,
    source: payload.source,
    locale: payload.locale,
    device: payload.device,
  }
  assignText(next, 'referrer', payload.referrer)
  assignText(next, 'landingPath', payload.landingPath)
  assignText(next, 'gaClientId', payload.gaClientId)
  assignText(next, 'fbp', payload.fbp)

  const touchChanged = isTaggedTouch(payload) && messengerTouchKey(payload) !== messengerTouchKey(existing)
  if (touchChanged) {
    next.utmSource = text(payload.utmSource)
    next.utmMedium = text(payload.utmMedium)
    next.utmCampaign = text(payload.utmCampaign)
    next.utmContent = text(payload.utmContent)
    next.utmTerm = text(payload.utmTerm)
    next.gclid = text(payload.gclid)
    next.gbraid = text(payload.gbraid)
    next.wbraid = text(payload.wbraid)
    next.fbclid = text(payload.fbclid)
  }

  return {
    record: next,
    pushLastTouch: existing.matchedCardId !== undefined && touchChanged,
  }
}

export function isPendingLeadExpired(record: PendingLead, now: number): boolean {
  const touched = Date.parse(record.lastTouchAt)
  return Number.isNaN(touched) || now - touched >= PENDING_LEAD_TTL_MS
}

export function matchPendingLead(
  records: readonly PendingLead[],
  input: { channel: MessengerLeadChannel, createdAt: string },
): PendingLead | null {
  const created = Date.parse(input.createdAt)
  if (Number.isNaN(created)) {
    return null
  }
  const from = created - MATCH_WINDOW_MS
  const matches = records.filter((record) => {
    if (record.matchedCardId || record.formCardId) {
      return false
    }
    if (record.channel !== input.channel) {
      return false
    }
    const touched = Date.parse(record.lastTouchAt)
    return !Number.isNaN(touched) && touched >= from && touched <= created
  })
  return matches.length === 1 ? matches[0]! : null
}

export function dueFormLeads(records: readonly PendingLead[], now: number): PendingLead[] {
  return records.filter((record) => {
    if (record.kind !== 'form' || record.matchedCardId || record.formCardId) {
      return false
    }
    const touched = Date.parse(record.lastTouchAt)
    return !Number.isNaN(touched) && now - touched >= MATCH_WINDOW_MS
  })
}
