import { useMediaQuery } from '@vueuse/core'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { useLeadMessenger } from '~/composables/useLeadMessenger'
import {
  CONSENT_POLICY_VERSION,
  type ContactMethod,
  type LeadSource,
} from '~/shared/lead-constants'
import { leadFormSchema } from '~/shared/lead-schema'
import { isMessengerContactMethod } from '~/shared/messenger-deeplink'
import { closeExternalTab, openBlankExternalTab } from '~/shared/open-external'

interface LeadApiResponse {
  ok: true
  leadId: string
  receivedAt: string
  phoneE164?: string | null
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
  const { hiddenFields, gtmAttribution } = useLeadAttribution()
  const { pushEvent } = useGtm()
  const { openMessenger } = useLeadMessenger()
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
      contactMethod: 'telegram' as ContactMethod,
      phone: '',
      consentAccepted: false,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    },
  })

  const [from, fromAttrs] = defineField('from')
  const [to, toAttrs] = defineField('to')
  const [details, detailsAttrs] = defineField('details')
  const [contactMethod, contactMethodAttrs] = defineField('contactMethod')
  const [phone, phoneAttrs] = defineField('phone')
  const [consentAccepted, consentAttrs] = defineField('consentAccepted')

  const isPhoneMethod = computed(() => contactMethod.value === 'phone')
  const isMessengerMethod = computed(() =>
    contactMethod.value ? isMessengerContactMethod(contactMethod.value) : false,
  )

  const submitLabel = computed(() => {
    if (isSubmitting.value) {
      return t('lead.submitting')
    }

    switch (contactMethod.value) {
      case 'telegram':
        return t('lead.submitTelegram')
      case 'whatsapp':
        return t('lead.submitWhatsapp')
      case 'viber':
        return t('lead.submitViber')
      default:
        return t('lead.submit')
    }
  })

  const submitIcon = computed(() => {
    switch (contactMethod.value) {
      case 'telegram':
        return 'simple-icons:telegram'
      case 'whatsapp':
        return 'simple-icons:whatsapp'
      case 'viber':
        return 'simple-icons:viber'
      default:
        return null
    }
  })

  const errorSummary = computed(() => {
    const keys = ['from', 'to', 'contactMethod', ...(isPhoneMethod.value ? ['phone'] as const : []), 'consentAccepted'] as const
    return keys
      .filter(field => errors.value[field])
      .map(field => ({
        field,
        message: t(`lead.errors.${field}`),
        href: `#lead-${field}`,
      }))
  })

  watch(contactMethod, (method) => {
    if (method !== 'phone') {
      setFieldError('phone', undefined)
    }
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
    pushEvent('lead_submit_attempt', {
      source,
      locale: locale.value,
      contactMethod: values.contactMethod,
      ...gtmAttribution.value,
    })

    const localeCode = locale.value
    if (localeCode !== 'ua' && localeCode !== 'ru') {
      return
    }

    const payload = {
      idempotencyKey: idempotencyKey.value,
      from: values.from,
      to: values.to,
      details: values.details?.trim() || undefined,
      contactMethod: values.contactMethod,
      phone: values.contactMethod === 'phone' ? values.phone : '',
      locale: localeCode,
      source,
      device: isMobile.value ? 'mobile' as const : 'desktop' as const,
      consentAccepted: true as const,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
      turnstileToken,
      ...hiddenFields.value,
      website: '',
    }

    // HTTPS messenger tabs must open in the same user-gesture turn as the click.
    // After await $fetch, Chrome blocks window.open as a popup.
    let messengerTab: Window | null = null
    if (
      isMessengerContactMethod(values.contactMethod)
      && values.contactMethod !== 'viber'
    ) {
      messengerTab = openBlankExternalTab()
    }

    try {
      const res = await $fetch<LeadApiResponse>('/api/leads', {
        method: 'POST',
        body: payload,
      })

      if (isMessengerContactMethod(values.contactMethod)) {
        await openMessenger(
          values.contactMethod,
          {
            from: values.from,
            to: values.to,
            details: values.details,
          },
          { tab: messengerTab },
        )
        messengerTab = null
      }

      submitSuccess.value = true
      pushEvent('lead_submit_success', {
        source,
        leadId: res.leadId,
        locale: locale.value,
        contactMethod: values.contactMethod,
        ...gtmAttribution.value,
      })
    }
    catch (err: unknown) {
      closeExternalTab(messengerTab)
      messengerTab = null
      pushEvent('lead_submit_error', {
        source,
        locale: locale.value,
        contactMethod: values.contactMethod,
        ...gtmAttribution.value,
      })
      if (err && typeof err === 'object' && 'statusCode' in err) {
        const statusCode = (err as { statusCode: number }).statusCode
        if (statusCode === 400) {
          pushEvent('lead_validation_error', { source, ...gtmAttribution.value })
          if (values.contactMethod === 'phone') {
            setFieldError('phone', 'phone')
          }
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
    contactMethod,
    contactMethodAttrs,
    phone,
    phoneAttrs,
    consentAccepted,
    consentAttrs,
    errors,
    errorSummary,
    isSubmitting,
    submitError,
    submitSuccess,
    isPhoneMethod,
    isMessengerMethod,
    submitLabel,
    submitIcon,
    onSubmit,
    resetIdempotency,
    idempotencyKey,
  }
}
