import { describe, expect, it } from 'vitest'
import {
  CONSENT_POLICY_VERSION,
  CONTACT_METHODS,
  LEAD_DEVICES,
  LEAD_SOURCES,
  LEAD_TURNSTILE_ACTION,
  LOCALE_CODES,
} from '~/shared/lead-constants'

describe('lead-constants', () => {
  it('keeps stable enum values', () => {
    expect(LEAD_SOURCES).toEqual(['hero', 'header', 'cta', 'segment'])
    expect(LEAD_DEVICES).toEqual(['mobile', 'desktop'])
    expect(LOCALE_CODES).toEqual(['ua', 'ru'])
    expect(CONTACT_METHODS).toEqual(['telegram', 'whatsapp', 'viber', 'phone'])
    expect(CONSENT_POLICY_VERSION).toBe('2026-05-27')
    expect(LEAD_TURNSTILE_ACTION).toBe('lead_submit')
  })
})
