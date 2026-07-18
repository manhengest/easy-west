import { z } from 'zod'
import {
  CONSENT_POLICY_VERSION,
  CONTACT_METHODS,
  LEAD_DEVICES,
  LEAD_SOURCES,
  LOCALE_CODES,
} from './lead-constants'
import { normalizePhoneToE164 } from './phone'

export const leadSourceSchema = z.enum(LEAD_SOURCES)
export const leadDeviceSchema = z.enum(LEAD_DEVICES)
export const localeCodeSchema = z.enum(LOCALE_CODES)
export const contactMethodSchema = z.enum(CONTACT_METHODS)

const leadContactFields = {
  from: z.string().trim().min(1, 'from'),
  to: z.string().trim().min(1, 'to'),
  details: z.string().trim().max(2000).optional().default(''),
  contactMethod: contactMethodSchema,
  phone: z.string().trim().default(''),
  consentAccepted: z.boolean().refine(v => v === true, { message: 'consent' }),
  consentPolicyVersion: z.literal(CONSENT_POLICY_VERSION),
}

function refineLeadPhone(
  data: { contactMethod: z.infer<typeof contactMethodSchema>, phone: string },
  ctx: z.RefinementCtx,
  locale: z.infer<typeof localeCodeSchema> = 'ua',
) {
  if (data.contactMethod !== 'phone') {
    return
  }

  if (data.phone.length < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'phone', path: ['phone'] })
    return
  }

  const phone = normalizePhoneToE164(data.phone, locale)
  if ('error' in phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'phone', path: ['phone'] })
  }
}

export const leadFormSchema = z.object(leadContactFields).superRefine((data, ctx) => {
  refineLeadPhone(data, ctx)
})

export type LeadFormValues = z.infer<typeof leadFormSchema>

export const leadSubmitSchema = z.object({
  idempotencyKey: z.string().uuid(),
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  details: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform(v => (v && v.length > 0 ? v : undefined)),
  contactMethod: contactMethodSchema,
  phone: z.string().trim().default(''),
  locale: localeCodeSchema,
  source: leadSourceSchema,
  device: leadDeviceSchema,
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
  refineLeadPhone(data, ctx, data.locale)
})

export type LeadSubmitPayload = z.infer<typeof leadSubmitSchema>

export function parseLeadPhoneE164(payload: LeadSubmitPayload): string | null {
  if (payload.contactMethod !== 'phone') {
    return null
  }

  const result = normalizePhoneToE164(payload.phone, payload.locale)
  if ('error' in result) {
    throw new Error('Invalid phone')
  }
  return result.e164
}
