import {
  type CountryCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import type { LocaleCode } from './lead-constants'

export function defaultCountryForLocale(locale: LocaleCode): CountryCode | undefined {
  return locale === 'ua' ? 'UA' : undefined
}

export function normalizePhoneToE164(
  raw: string,
  locale: LocaleCode,
): { e164: string } | { error: 'invalid' } {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { error: 'invalid' }
  }

  const defaultCountry = defaultCountryForLocale(locale)
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry)

  if (!parsed || !isValidPhoneNumber(parsed.number, defaultCountry)) {
    return { error: 'invalid' }
  }

  return { e164: parsed.format('E.164') }
}
