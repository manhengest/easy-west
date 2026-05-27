import { z } from 'zod'
import { CONSENT_POLICY_VERSION, LEAD_SOURCES, LOCALE_CODES } from './lead-constants'
import { normalizePhoneToE164 } from './phone'

export const leadSourceSchema = z.enum(LEAD_SOURCES)
export const localeCodeSchema = z.enum(LOCALE_CODES)

export const leadFormSchema = z.object({
  from: z.string().trim().min(2, 'from'),
  to: z.string().trim().min(2, 'to'),
  phone: z.string().trim().min(5, 'phone'),
  consentAccepted: z.boolean().refine(v => v === true, { message: 'consent' }),
  consentPolicyVersion: z.literal(CONSENT_POLICY_VERSION),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>

export const leadSubmitSchema = z.object({
  idempotencyKey: z.string().uuid(),
  from: z.string().trim().min(2),
  to: z.string().trim().min(2),
  phone: z.string().trim().min(5),
  locale: localeCodeSchema,
  source: leadSourceSchema,
  consentAccepted: z.literal(true),
  consentPolicyVersion: z.literal(CONSENT_POLICY_VERSION),
  turnstileToken: z.string().min(1),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  referrer: z.string().optional(),
  landingPath: z.string().optional(),
  website: z
    .string()
    .optional()
    .transform(v => v ?? '')
    .refine(v => v.length === 0, 'honeypot'),
}).superRefine((data, ctx) => {
  if (data.website) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'honeypot', path: ['website'] })
  }
  const phone = normalizePhoneToE164(data.phone, data.locale)
  if ('error' in phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'phone', path: ['phone'] })
  }
})

export type LeadSubmitPayload = z.infer<typeof leadSubmitSchema>

export function parseLeadPhoneE164(payload: LeadSubmitPayload): string {
  const result = normalizePhoneToE164(payload.phone, payload.locale)
  if ('error' in result) {
    throw new Error('Invalid phone')
  }
  return result.e164
}
