export const CONSENT_POLICY_VERSION = '2026-05-27'

export const LEAD_TURNSTILE_ACTION = 'lead_submit'

export const LEAD_SOURCES = [
  'hero',
  'header',
  'cta',
  'segment',
  'modal',
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

export const LOCALE_CODES = ['ua', 'ru'] as const
export type LocaleCode = (typeof LOCALE_CODES)[number]
