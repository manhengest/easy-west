import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { CONSENT_POLICY_VERSION } from '~/shared/lead-constants'
import { leadFormSchema } from '~/shared/lead-schema'
import type { LeadSource } from '~/shared/lead-constants'
import type { LocaleCode } from '~/shared/lead-constants'

interface LeadApiResponse {
  ok: true
  leadId: string
  receivedAt: string
}

export function useLeadForm(source: LeadSource) {
  const { locale, t } = useI18n()
  const { hiddenFields } = useLeadAttribution()
  const { pushEvent } = useGtm()
  const config = useRuntimeConfig()

  const idempotencyKey = ref(crypto.randomUUID())
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  const submitSuccess = ref(false)

  const validationSchema = toTypedSchema(leadFormSchema)

  const { defineField, handleSubmit, errors, resetForm, setFieldError } = useForm({
    validationSchema,
    initialValues: {
      from: '',
      to: '',
      phone: '',
      consentAccepted: false,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    },
  })

  const [from, fromAttrs] = defineField('from')
  const [to, toAttrs] = defineField('to')
  const [phone, phoneAttrs] = defineField('phone')
  const [consentAccepted, consentAttrs] = defineField('consentAccepted')

  const errorSummary = computed(() => {
    const keys = ['from', 'to', 'phone', 'consentAccepted'] as const
    return keys
      .filter(field => errors.value[field])
      .map(field => ({
        field,
        message: t(`lead.errors.${field}`),
        href: `#lead-${field}`,
      }))
  })

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting.value) {
      return
    }
    isSubmitting.value = true
    submitError.value = null
    pushEvent('lead_submit_attempt', { source, locale: locale.value })

    const localeCode = locale.value as LocaleCode
    const payload = {
      idempotencyKey: idempotencyKey.value,
      from: values.from,
      to: values.to,
      phone: values.phone,
      locale: localeCode,
      source,
      consentAccepted: true as const,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
      turnstileToken: config.public.turnstileSiteKey
        ? 'stub-turnstile-phase2'
        : 'stub-turnstile-phase2',
      ...hiddenFields.value,
      website: '',
    }

    try {
      const res = await $fetch<LeadApiResponse>('/api/leads', {
        method: 'POST',
        body: payload,
      })
      submitSuccess.value = true
      pushEvent('lead_submit_success', { source, leadId: res.leadId, locale: locale.value })
    }
    catch (err: unknown) {
      pushEvent('lead_submit_error', { source, locale: locale.value })
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 400) {
        pushEvent('lead_validation_error', { source })
        setFieldError('phone', 'phone')
      }
      submitError.value = 'submit'
    }
    finally {
      isSubmitting.value = false
    }
  })

  function resetIdempotency() {
    idempotencyKey.value = crypto.randomUUID()
    submitSuccess.value = false
    submitError.value = null
    resetForm()
  }

  return {
    from,
    fromAttrs,
    to,
    toAttrs,
    phone,
    phoneAttrs,
    consentAccepted,
    consentAttrs,
    errors,
    errorSummary,
    isSubmitting,
    submitError,
    submitSuccess,
    onSubmit,
    resetIdempotency,
    idempotencyKey,
  }
}
