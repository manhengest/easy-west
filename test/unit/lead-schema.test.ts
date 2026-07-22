import { describe, expect, it } from 'vitest'
import {
  leadFormSchema,
  leadSubmitSchema,
  parseLeadPhoneE164,
} from '~/shared/lead-schema'
import { CONSENT_POLICY_VERSION } from '~/shared/lead-constants'
import { validLeadSubmitBody, validPhoneLeadBody } from '../fixtures/leads'

describe('leadFormSchema', () => {
  it('accepts a valid messenger form', () => {
    const result = leadFormSchema.safeParse({
      from: 'Kyiv',
      to: 'Warsaw',
      details: '',
      contactMethod: 'telegram',
      phone: '',
      consentAccepted: true,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing consent', () => {
    const result = leadFormSchema.safeParse({
      from: 'Kyiv',
      to: 'Warsaw',
      contactMethod: 'telegram',
      phone: '',
      consentAccepted: false,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    })
    expect(result.success).toBe(false)
  })

  it('requires a valid phone when contact method is phone', () => {
    const result = leadFormSchema.safeParse({
      from: 'Kyiv',
      to: 'Warsaw',
      contactMethod: 'phone',
      phone: '123',
      consentAccepted: true,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('phone'))).toBe(true)
    }
  })

  it('accepts a valid UA phone', () => {
    const result = leadFormSchema.safeParse({
      from: 'Kyiv',
      to: 'Warsaw',
      contactMethod: 'phone',
      phone: '+380 93 321 88 99',
      consentAccepted: true,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    })
    expect(result.success).toBe(true)
  })
})

describe('leadSubmitSchema', () => {
  it('accepts a valid submit payload', () => {
    const result = leadSubmitSchema.safeParse(validLeadSubmitBody())
    expect(result.success).toBe(true)
  })

  it('rejects honeypot website field', () => {
    const result = leadSubmitSchema.safeParse(
      validLeadSubmitBody({ website: 'spam' } as never),
    )
    expect(result.success).toBe(false)
  })

  it('rejects invalid idempotency key', () => {
    const result = leadSubmitSchema.safeParse(
      validLeadSubmitBody({ idempotencyKey: 'not-a-uuid' }),
    )
    expect(result.success).toBe(false)
  })

  it('normalizes empty details to undefined', () => {
    const result = leadSubmitSchema.safeParse(
      validLeadSubmitBody({ details: '   ' }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.details).toBeUndefined()
    }
  })
})

describe('parseLeadPhoneE164', () => {
  it('returns null for messenger methods', () => {
    expect(parseLeadPhoneE164(validLeadSubmitBody())).toBeNull()
  })

  it('returns E.164 for phone method', () => {
    const payload = validPhoneLeadBody()
    expect(parseLeadPhoneE164(payload)).toBe('+380933218899')
  })

  it('throws for invalid phone', () => {
    expect(() =>
      parseLeadPhoneE164(validPhoneLeadBody({ phone: 'abc' })),
    ).toThrow('Invalid phone')
  })
})
