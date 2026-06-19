import { useMediaQuery } from '@vueuse/core'
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

interface TurnstileBridge {
  enabled: boolean
  token: string
  reset: () => void
}

export function useLeadForm(
  source: LeadSource,
  turnstileRef?: Ref<TurnstileBridge | null>,
) {
  const { locale, t } = useI18n()
  const { hiddenFields } = useLeadAttribution()
  const { pushEvent } = useGtm()
  const config = useRuntimeConfig()
  const isMobile = useMediaQuery('(max-width: 767px)')

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
      details: '',
      phone: '',
      consentAccepted: false,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    },
  })

  const [from, fromAttrs] = defineField('from')
  const [to, toAttrs] = defineField('to')
  const [details, detailsAttrs] = defineField('details')
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

  function resolveTurnstileToken(): string | null {
    const turnstile = turnstileRef?.value
    if (turnstile?.enabled) {
      return turnstile.token || null
    }
    if (config.public.turnstileSiteKey) {
      return null
    }
    return 'stub-turnstile-phase2'
  }

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting.value) {
      return
    }

    const turnstileToken = resolveTurnstileToken()
    if (!turnstileToken) {
      submitError.value = 'captcha'
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
      details: values.details?.trim() || undefined,
      phone: values.phone,
      locale: localeCode,
      source,
      device: isMobile.value ? 'mobile' as const : 'desktop' as const,
      consentAccepted: true as const,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
      turnstileToken,
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
      if (err && typeof err === 'object' && 'statusCode' in err) {
        const statusCode = (err as { statusCode: number }).statusCode
        if (statusCode === 400) {
          pushEvent('lead_validation_error', { source })
          setFieldError('phone', 'phone')
        }
        if (statusCode === 403) {
          turnstileRef?.value?.reset()
          submitError.value = 'captcha'
          return
        }
      }
      submitError.value = 'submit'
      turnstileRef?.value?.reset()
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
    turnstileRef?.value?.reset()
  }

  return {
    from,
    fromAttrs,
    to,
    toAttrs,
    details,
    detailsAttrs,
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
