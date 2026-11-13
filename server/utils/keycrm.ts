import type { ContactMethod, LeadDevice, LeadSource, LocaleCode } from '~/shared/lead-constants'
import type { LeadSubmitPayload } from '~/shared/lead-schema'
import { KEYCRM_API_ORIGIN, KEYCRM_API_URL, KEYCRM_FIELDS, KEYCRM_PIPELINE_ID, KEYCRM_SOURCE_ID } from './keycrm-map'

export const KEYCRM_PENDING_TITLE = 'Лід'

const CONTACT_CHANNEL_VALUES: Record<ContactMethod, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  viber: 'Viber',
  phone: 'Телефон',
}

const LOCALE_VALUES: Record<LocaleCode, string> = {
  ua: 'UA',
  ru: 'RU',
}

const SOURCE_LABELS: Record<LeadSource, string> = {
  hero: 'Банер',
  header: 'Шапка',
  cta: 'Нижній CTA',
  segment: 'Блок "Який переїзд вам потрібен"',
}

const DEVICE_LABELS: Record<LeadDevice, string> = {
  mobile: 'Мобільний',
  desktop: 'Десктоп',
}

export interface KeycrmCustomField {
  uuid: string
  value: string | string[]
}

export interface KeycrmPipelineCard {
  title: string
  pipeline_id: number
  source_id: number
  contact: {
    full_name: string
    phone?: string
  }
  manager_comment?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  custom_fields?: KeycrmCustomField[]
}

export interface KeycrmLeadContext {
  leadId: string
  phoneE164: string | null
  payload: LeadSubmitPayload
}

export type KeycrmCardResult =
  | { ok: true, id: number }
  | { ok: false, status: number }

interface ClickAttribution {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
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
  gaClientId?: string
  fbp?: string
  referrer?: string
  landingPath?: string
}

function filled(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function textField(uuid: string, value: string | undefined): KeycrmCustomField | null {
  const next = filled(value)
  if (!next) {
    return null
  }
  return { uuid, value: next }
}

export function leadCardTitle(cardId: number): string {
  return `Лід ${cardId}`
}

function attributionFields(payload: ClickAttribution): KeycrmCustomField[] {
  return [
    textField(KEYCRM_FIELDS.firstSource, payload.firstUtmSource),
    textField(KEYCRM_FIELDS.firstMedium, payload.firstUtmMedium),
    textField(KEYCRM_FIELDS.firstCampaign, payload.firstUtmCampaign),
    textField(KEYCRM_FIELDS.firstContent, payload.firstUtmContent),
    textField(KEYCRM_FIELDS.firstTerm, payload.firstUtmTerm),
    textField(KEYCRM_FIELDS.firstVisit, payload.firstTouchedAt),
    textField(KEYCRM_FIELDS.firstPage, payload.firstLandingPath),
    textField(KEYCRM_FIELDS.firstGclid, payload.firstGclid),
    textField(KEYCRM_FIELDS.firstGbraid, payload.firstGbraid),
    textField(KEYCRM_FIELDS.firstWbraid, payload.firstWbraid),
    textField(KEYCRM_FIELDS.firstFbclid, payload.firstFbclid),
    textField(KEYCRM_FIELDS.gclid, payload.gclid),
    textField(KEYCRM_FIELDS.gbraid, payload.gbraid),
    textField(KEYCRM_FIELDS.wbraid, payload.wbraid),
    textField(KEYCRM_FIELDS.fbclid, payload.fbclid),
    textField(KEYCRM_FIELDS.gaClientId, payload.gaClientId),
    textField(KEYCRM_FIELDS.fbp, payload.fbp),
  ].filter((field): field is KeycrmCustomField => field !== null)
}

function applyUtm(card: KeycrmPipelineCard, payload: ClickAttribution): void {
  const utmSource = filled(payload.utmSource)
  const utmMedium = filled(payload.utmMedium)
  const utmCampaign = filled(payload.utmCampaign)
  const utmContent = filled(payload.utmContent)
  const utmTerm = filled(payload.utmTerm)
  if (utmSource) card.utm_source = utmSource
  if (utmMedium) card.utm_medium = utmMedium
  if (utmCampaign) card.utm_campaign = utmCampaign
  if (utmContent) card.utm_content = utmContent
  if (utmTerm) card.utm_term = utmTerm
}

function managerComment(payload: LeadSubmitPayload): string | undefined {
  const lines = [
    filled(payload.details),
    `Форма: ${SOURCE_LABELS[payload.source]}`,
    `Пристрій: ${DEVICE_LABELS[payload.device]}`,
    filled(payload.referrer) ? `Referrer: ${payload.referrer}` : undefined,
    filled(payload.landingPath) ? `Сторінка: ${payload.landingPath}` : undefined,
  ].filter((line): line is string => Boolean(line))

  return lines.length > 0 ? lines.join('\n') : undefined
}

export function buildPipelineCard(ctx: KeycrmLeadContext): KeycrmPipelineCard {
  const { leadId, phoneE164, payload } = ctx
  const customFields = [
    textField(KEYCRM_FIELDS.from, payload.from),
    textField(KEYCRM_FIELDS.to, payload.to),
    textField(KEYCRM_FIELDS.leadId, leadId),
    { uuid: KEYCRM_FIELDS.channel, value: [CONTACT_CHANNEL_VALUES[payload.contactMethod]] },
    { uuid: KEYCRM_FIELDS.locale, value: [LOCALE_VALUES[payload.locale]] },
    ...attributionFields(payload),
  ].filter((field): field is KeycrmCustomField => field !== null)

  const card: KeycrmPipelineCard = {
    title: KEYCRM_PENDING_TITLE,
    pipeline_id: KEYCRM_PIPELINE_ID,
    source_id: KEYCRM_SOURCE_ID,
    contact: {
      full_name: 'Заявка з сайту',
    },
    custom_fields: customFields,
  }

  if (phoneE164) {
    card.contact.phone = phoneE164
  }

  const comment = managerComment(payload)
  if (comment) {
    card.manager_comment = comment
  }

  applyUtm(card, payload)

  return card
}

export function keycrmId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    return Number(value)
  }
  return null
}

function cardIdFromBody(body: unknown): number | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  return keycrmId((body as { id?: unknown }).id)
}

async function keycrmRequest(
  apiKey: string,
  url: string,
  method: 'GET' | 'POST' | 'PUT',
  body?: unknown,
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

export async function createPipelineCard(
  apiKey: string,
  card: KeycrmPipelineCard,
): Promise<KeycrmCardResult> {
  const response = await keycrmRequest(apiKey, KEYCRM_API_URL, 'POST', card)

  if (!response.ok) {
    return { ok: false, status: response.status }
  }

  let id: number | null
  try {
    id = cardIdFromBody(await response.json())
  }
  catch {
    id = null
  }
  if (id === null) {
    return { ok: false, status: 502 }
  }

  const renamed = await renamePipelineCard(apiKey, id)
  if (!renamed) {
    console.error('[keycrm] card title was not updated', { id })
  }

  return { ok: true, id }
}

const RENAME_ATTEMPTS = 3

async function renamePipelineCard(apiKey: string, id: number): Promise<boolean> {
  for (let attempt = 1; attempt <= RENAME_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    const renamed = await keycrmRequest(apiKey, `${KEYCRM_API_URL}/${id}`, 'PUT', {
      title: leadCardTitle(id),
    })
    if (renamed.ok) {
      return true
    }
    if (renamed.status !== 404) {
      return false
    }
  }
  return false
}

export interface PipelineCardView {
  id: number
  pipelineId: number | null
  statusTitle: string
  statusChangedAt?: string
  phone?: string
  value?: number
  currency?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
  gaClientId?: string
  fbp?: string
  qualifiedSent: boolean
  bookedSent: boolean
}

export type ReadPipelineCardResult =
  | { ok: true, card: PipelineCardView }
  | { ok: false, retry: boolean }

export async function readPipelineCard(
  apiKey: string,
  cardId: number,
  marks: { qualifiedField?: string, bookedField?: string },
): Promise<ReadPipelineCardResult> {
  let response: Response
  try {
    response = await keycrmRequest(
      apiKey,
      `${KEYCRM_API_URL}/${cardId}?include=custom_fields,status`,
      'GET',
    )
  }
  catch {
    console.error('[keycrm] card read failed', { cardId })
    return { ok: false, retry: true }
  }

  if (response.status === 404) {
    return { ok: false, retry: false }
  }
  if (!response.ok) {
    console.error('[keycrm] card read failed', { cardId, status: response.status })
    return { ok: false, retry: true }
  }

  let body: unknown
  try {
    body = await response.json()
  }
  catch {
    return { ok: false, retry: true }
  }

  const record = unwrapCard(body)
  if (!record) {
    return { ok: false, retry: true }
  }

  let statusTitle = readStatusTitle(record.status)
  const pipelineId = keycrmId(record.pipeline_id)
  const statusId = keycrmId(record.status_id) ?? statusObjectId(record.status)

  if (!statusTitle && statusId !== null) {
    const listed = await readStatusTitleFromPipeline(apiKey, pipelineId ?? KEYCRM_PIPELINE_ID, statusId)
    if (listed === 'retry') {
      return { ok: false, retry: true }
    }
    statusTitle = listed
  }

  const fields = readCustomFields(record.custom_fields)
  const money = readMoney(record)

  return {
    ok: true,
    card: {
      id: cardId,
      pipelineId,
      statusTitle,
      statusChangedAt: typeof record.status_changed_at === 'string' ? record.status_changed_at : undefined,
      phone: readPhone(record),
      value: money?.value,
      currency: money?.currency,
      gclid: fieldText(fields, KEYCRM_FIELDS.gclid),
      gbraid: fieldText(fields, KEYCRM_FIELDS.gbraid),
      wbraid: fieldText(fields, KEYCRM_FIELDS.wbraid),
      fbclid: fieldText(fields, KEYCRM_FIELDS.fbclid),
      gaClientId: fieldText(fields, KEYCRM_FIELDS.gaClientId),
      fbp: fieldText(fields, KEYCRM_FIELDS.fbp),
      qualifiedSent: Boolean(fieldText(fields, marks.qualifiedField)),
      bookedSent: Boolean(fieldText(fields, marks.bookedField)),
    },
  }
}

export async function markAdsEventSent(
  apiKey: string,
  cardId: number,
  fieldUuid: string,
  sentAt: string,
): Promise<boolean> {
  try {
    const response = await keycrmRequest(apiKey, `${KEYCRM_API_URL}/${cardId}`, 'PUT', {
      custom_fields: [{ uuid: fieldUuid, value: sentAt }],
    })
    if (!response.ok) {
      console.error('[keycrm] ads mark was not saved', { cardId, status: response.status })
      return false
    }
    return true
  }
  catch {
    console.error('[keycrm] ads mark was not saved', { cardId })
    return false
  }
}

function unwrapCard(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  const record = body as Record<string, unknown>
  const data = record.data
  if (Array.isArray(data)) {
    const first = data.find(item => item && typeof item === 'object')
    return first && typeof first === 'object' ? first as Record<string, unknown> : null
  }
  if (data && typeof data === 'object') {
    return data as Record<string, unknown>
  }
  if ('id' in record || 'status' in record || 'custom_fields' in record) {
    return record
  }
  return null
}

function readStatusTitle(status: unknown): string {
  if (!status || typeof status !== 'object') {
    return ''
  }
  const title = (status as { title?: unknown }).title
  return typeof title === 'string' ? title.trim() : ''
}

function statusObjectId(status: unknown): number | null {
  if (!status || typeof status !== 'object') {
    return null
  }
  return keycrmId((status as { id?: unknown }).id)
}

async function readStatusTitleFromPipeline(
  apiKey: string,
  pipelineId: number,
  statusId: number,
): Promise<string | 'retry'> {
  let response: Response
  try {
    response = await keycrmRequest(
      apiKey,
      `${KEYCRM_API_ORIGIN}/pipelines/${pipelineId}/statuses`,
      'GET',
    )
  }
  catch {
    console.error('[keycrm] status list failed', { pipelineId })
    return 'retry'
  }
  if (!response.ok) {
    console.error('[keycrm] status list failed', { pipelineId, status: response.status })
    return 'retry'
  }
  let body: unknown
  try {
    body = await response.json()
  }
  catch {
    return 'retry'
  }
  const list = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data)
      ? (body as { data: unknown[] }).data
      : []
  for (const item of list) {
    if (!item || typeof item !== 'object') {
      continue
    }
    if (keycrmId((item as { id?: unknown }).id) !== statusId) {
      continue
    }
    return readStatusTitle(item)
  }
  return ''
}

function readCustomFields(raw: unknown): KeycrmCustomField[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const fields: KeycrmCustomField[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const uuid = (item as { uuid?: unknown }).uuid
    const value = (item as { value?: unknown }).value
    if (typeof uuid !== 'string') {
      continue
    }
    if (typeof value === 'string') {
      fields.push({ uuid, value })
    }
    else if (Array.isArray(value) && value.every(entry => typeof entry === 'string')) {
      fields.push({ uuid, value })
    }
  }
  return fields
}

function fieldText(fields: KeycrmCustomField[], uuid: string | undefined): string | undefined {
  if (!uuid) {
    return undefined
  }
  const field = fields.find(item => item.uuid === uuid)
  if (!field) {
    return undefined
  }
  const raw = Array.isArray(field.value) ? field.value[0] : field.value
  const trimmed = raw?.trim()
  return trimmed || undefined
}

function readPhone(record: Record<string, unknown>): string | undefined {
  const contact = record.contact
  if (!contact || typeof contact !== 'object') {
    return undefined
  }
  const phone = (contact as { phone?: unknown }).phone
  return typeof phone === 'string' && phone.trim() ? phone.trim() : undefined
}

function readMoney(record: Record<string, unknown>): { value: number, currency: string } | undefined {
  const value = positiveAmount(record.products_total) ?? positiveAmount(record.payments_total)
  if (value === undefined) {
    return undefined
  }
  const code = record.currency_code
  const currency = typeof code === 'string' && /^[A-Z]{3}$/.test(code) ? code : 'UAH'
  return { value, currency }
}

function positiveAmount(value: unknown): number | undefined {
  const number = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : Number.NaN
  if (!Number.isFinite(number) || number <= 0) {
    return undefined
  }
  return number
}
