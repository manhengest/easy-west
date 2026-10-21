import { z } from 'zod'
import { localeCodeSchema } from './lead-schema'

export const MESSENGER_INTENT_STORAGE_KEY = 'ew_messenger_intent'

const optionalText = z.string().optional()

export const messengerIntentSchema = z.object({
  channel: z.enum(['whatsapp', 'telegram', 'viber']),
  locale: localeCodeSchema,
  utmSource: optionalText,
  utmMedium: optionalText,
  utmCampaign: optionalText,
  utmContent: optionalText,
  utmTerm: optionalText,
  gclid: optionalText,
  gbraid: optionalText,
  wbraid: optionalText,
  fbclid: optionalText,
  referrer: optionalText,
  landingPath: optionalText,
  firstUtmSource: optionalText,
  firstUtmMedium: optionalText,
  firstUtmCampaign: optionalText,
  firstUtmContent: optionalText,
  firstUtmTerm: optionalText,
  firstGclid: optionalText,
  firstGbraid: optionalText,
  firstWbraid: optionalText,
  firstFbclid: optionalText,
  firstTouchedAt: optionalText,
  firstLandingPath: optionalText,
  gaClientId: optionalText,
  fbp: optionalText,
  website: z
    .string()
    .optional()
    .transform(v => v ?? '')
    .refine(v => v.length === 0, 'honeypot'),
})

export type MessengerIntentPayload = z.infer<typeof messengerIntentSchema>

export interface MessengerIntentResult {
  ok: boolean
  enabled: boolean
  cardId?: number
}

export function parseMessengerPipelineId(raw: unknown): number | null {
  const value = typeof raw === 'number' && Number.isInteger(raw)
    ? String(raw)
    : typeof raw === 'string'
      ? raw.trim()
      : ''
  if (!/^[1-9]\d*$/.test(value)) {
    return null
  }
  return Number(value)
}

interface IntentStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function readMessengerIntentCardId(storage: IntentStorage): number | null {
  try {
    const raw = storage.getItem(MESSENGER_INTENT_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const cardId = (parsed as { cardId?: unknown }).cardId
    if (typeof cardId === 'number' && Number.isInteger(cardId) && cardId > 0) {
      return cardId
    }
    return null
  }
  catch {
    return null
  }
}

export function writeMessengerIntentCardId(storage: IntentStorage, cardId: number): void {
  storage.setItem(MESSENGER_INTENT_STORAGE_KEY, JSON.stringify({ cardId }))
}
