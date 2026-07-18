export const CONSENT_POLICY_VERSION = '2026-05-27'

export const LEAD_TURNSTILE_ACTION = 'lead_submit'

export const LEAD_SOURCES = [
  'hero',
  'header',
  'cta',
  'segment',
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

export const LEAD_DEVICES = ['mobile', 'desktop'] as const

export type LeadDevice = (typeof LEAD_DEVICES)[number]

export const LOCALE_CODES = ['ua', 'ru'] as const
export type LocaleCode = (typeof LOCALE_CODES)[number]

export const CONTACT_METHODS = [
  'telegram',
  'whatsapp',
  'viber',
  'phone',
] as const

export type ContactMethod = (typeof CONTACT_METHODS)[number]
