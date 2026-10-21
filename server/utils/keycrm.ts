import type { ContactMethod, LeadDevice, LeadSource, LocaleCode } from '~/shared/lead-constants'
import type { LeadSubmitPayload } from '~/shared/lead-schema'
import type { MessengerIntentPayload } from '~/shared/messenger-intent'
import { KEYCRM_API_URL, KEYCRM_FIELDS, KEYCRM_PIPELINE_ID, KEYCRM_SOURCE_ID } from './keycrm-map'

export const KEYCRM_PENDING_TITLE = 'Лід'

const MESSENGER_CONTACT_NAMES = {
  whatsapp: 'WhatsApp з сайту',
  telegram: 'Telegram з сайту',
  viber: 'Viber з сайту',
} as const

const MESSENGER_INTENT_COMMENT = 'Клік з кнопки, діалогу ще немає'

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

export function buildMessengerIntentCard(
  pipelineId: number,
  payload: MessengerIntentPayload,
): KeycrmPipelineCard {
  const lines = [MESSENGER_INTENT_COMMENT]
  const page = filled(payload.landingPath)
  const referrer = filled(payload.referrer)
  if (page) lines.push(`Сторінка: ${page}`)
  if (referrer) lines.push(`Referrer: ${referrer}`)

  const card: KeycrmPipelineCard = {
    title: KEYCRM_PENDING_TITLE,
    pipeline_id: pipelineId,
    source_id: KEYCRM_SOURCE_ID,
    contact: {
      full_name: MESSENGER_CONTACT_NAMES[payload.channel],
    },
    manager_comment: lines.join('\n'),
    custom_fields: [
      { uuid: KEYCRM_FIELDS.channel, value: [CONTACT_CHANNEL_VALUES[payload.channel]] },
      { uuid: KEYCRM_FIELDS.locale, value: [LOCALE_VALUES[payload.locale]] },
      ...attributionFields(payload),
    ],
  }

  applyUtm(card, payload)
  return card
}

function cardIdFromBody(body: unknown): number | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  const id = (body as { id?: unknown }).id
  if (typeof id === 'number' && Number.isInteger(id) && id > 0) {
    return id
  }
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id)) {
    return Number(id)
  }
  return null
}

async function keycrmRequest(
  apiKey: string,
  url: string,
  method: 'POST' | 'PUT',
  body: unknown,
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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
