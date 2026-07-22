import { CONSENT_POLICY_VERSION } from '~/shared/lead-constants'
import type { LeadSubmitPayload } from '~/shared/lead-schema'

export function validLeadSubmitBody(
  overrides: Partial<LeadSubmitPayload> = {},
): LeadSubmitPayload {
  return {
    idempotencyKey: crypto.randomUUID(),
    from: 'Kyiv',
    to: 'Warsaw',
    details: 'Two-bedroom apartment',
    contactMethod: 'telegram',
    phone: '',
    locale: 'ua',
    source: 'hero',
    device: 'desktop',
    consentAccepted: true,
    consentPolicyVersion: CONSENT_POLICY_VERSION,
    turnstileToken: 'stub-turnstile-test',
    website: '',
    ...overrides,
  }
}

export function validPhoneLeadBody(
  overrides: Partial<LeadSubmitPayload> = {},
): LeadSubmitPayload {
  return validLeadSubmitBody({
    contactMethod: 'phone',
    phone: '+380 93 321 88 99',
    ...overrides,
  })
}
