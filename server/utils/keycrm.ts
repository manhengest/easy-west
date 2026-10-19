import type { ContactMethod, LeadDevice, LeadSource, LocaleCode } from '~/shared/lead-constants'
import type { LeadSubmitPayload } from '~/shared/lead-schema'
import { KEYCRM_API_URL, KEYCRM_FIELDS, KEYCRM_PIPELINE_ID, KEYCRM_SOURCE_ID } from './keycrm-map'

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
  ].filter((field): field is KeycrmCustomField => field !== null)

  const card: KeycrmPipelineCard = {
    title: `${payload.from} → ${payload.to}`,
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

  return card
}

export async function createPipelineCard(
  apiKey: string,
  card: KeycrmPipelineCard,
): Promise<{ ok: true } | { ok: false, status: number }> {
  const response = await fetch(KEYCRM_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(card),
  })

  if (!response.ok) {
    return { ok: false, status: response.status }
  }

  return { ok: true }
}
