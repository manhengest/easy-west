import { describe, expect, it } from 'vitest'
import { defaultCountryForLocale, normalizePhoneToE164 } from '~/shared/phone'

describe('defaultCountryForLocale', () => {
  it('defaults UA for Ukrainian locale', () => {
    expect(defaultCountryForLocale('ua')).toBe('UA')
  })

  it('returns undefined for Russian locale', () => {
    expect(defaultCountryForLocale('ru')).toBeUndefined()
  })
})

describe('normalizePhoneToE164', () => {
  it('normalizes a local UA number', () => {
    const result = normalizePhoneToE164('093 321 88 99', 'ua')
    expect(result).toEqual({ e164: '+380933218899' })
  })

  it('accepts international format', () => {
    const result = normalizePhoneToE164('+380933218899', 'ua')
    expect(result).toEqual({ e164: '+380933218899' })
  })

  it('rejects empty input', () => {
    expect(normalizePhoneToE164('', 'ua')).toEqual({ error: 'invalid' })
  })

  it('rejects invalid numbers', () => {
    expect(normalizePhoneToE164('123', 'ua')).toEqual({ error: 'invalid' })
  })
})
