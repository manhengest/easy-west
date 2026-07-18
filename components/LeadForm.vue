<template>
  <form
    class="lead-form"
    novalidate
    @submit="onSubmit"
  >
    <div
      v-if="errorSummary.length"
      class="lead-form__summary"
      role="alert"
      aria-live="polite"
    >
      <p class="lead-form__summary-title">
        {{ t('lead.errors.summary') }}
      </p>
      <ul class="lead-form__summary-list">
        <li v-for="item in errorSummary" :key="item.field">
          <a :href="item.href">{{ item.message }}</a>
        </li>
      </ul>
    </div>

    <p v-if="submitError" class="lead-form__error" role="alert">
      {{ submitError === 'captcha' ? t('lead.errors.captcha') : t('lead.errors.submit') }}
    </p>

    <UiInput
      :model-value="from ?? ''"
      v-bind="fromAttrs"
      @update:model-value="from = $event"
      name="from"
      input-id="lead-from"
      :label="t('lead.fields.from')"
      :error="errors.from ? t('lead.errors.from') : undefined"
      required
      autocomplete="address-level2"
    />

    <UiInput
      :model-value="to ?? ''"
      v-bind="toAttrs"
      @update:model-value="to = $event"
      name="to"
      input-id="lead-to"
      :label="t('lead.fields.to')"
      :error="errors.to ? t('lead.errors.to') : undefined"
      required
      autocomplete="address-level1"
    />

    <UiTextarea
      :model-value="details ?? ''"
      v-bind="detailsAttrs"
      @update:model-value="details = $event"
      name="details"
      input-id="lead-details"
      :label="t('lead.fields.details')"
      :placeholder="t('lead.fields.detailsPlaceholder')"
    />

    <UiSelect
      :model-value="contactMethod ?? 'telegram'"
      v-bind="contactMethodAttrs"
      @update:model-value="contactMethod = $event as ContactMethod"
      name="contactMethod"
      select-id="lead-contact-method"
      :label="t('lead.fields.contactMethod')"
      :options="contactMethodOptions"
      :hint="isMessengerMethod ? t('lead.fields.contactMethodHint') : undefined"
      :error="errors.contactMethod ? t('lead.errors.contactMethod') : undefined"
      required
    />

    <UiInput
      v-if="isPhoneMethod"
      :model-value="phone ?? ''"
      v-bind="phoneAttrs"
      @update:model-value="phone = $event"
      name="phone"
      input-id="lead-phone"
      type="tel"
      :label="t('lead.fields.phone')"
      :placeholder="t('lead.fields.phonePlaceholder')"
      :hint="t('lead.fields.phoneHint')"
      :error="errors.phone ? t('lead.errors.phone') : undefined"
      required
      autocomplete="tel"
    />

    <div class="lead-form__consent">
      <label class="lead-form__consent-label" for="lead-consent">
        <input
          id="lead-consent"
          v-model="consentAccepted"
          v-bind="consentAttrs"
          type="checkbox"
          name="consentAccepted"
          class="lead-form__checkbox"
          :aria-invalid="errors.consentAccepted ? 'true' : undefined"
        >
        <span class="lead-form__consent-text">
          {{ t('lead.consent') }}
          <NuxtLink
            :to="localePath('/privacy')"
            class="lead-form__consent-link"
            @click.stop="emit('privacy-navigate')"
          >
            {{ t('nav.privacy') }}
          </NuxtLink>
        </span>
      </label>
      <p v-if="errors.consentAccepted" class="lead-form__consent-error" role="alert">
        {{ t('lead.errors.consentAccepted') }}
      </p>
    </div>

    <input
      v-model="honeypot"
      type="text"
      name="website"
      class="lead-form__honeypot"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
    >

    <UiTurnstile ref="turnstileRef" />

    <div class="lead-form__submit-wrap">
      <UiButton
        type="submit"
        variant="primary"
        class="lead-form__submit"
        :class="submitButtonClass"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        <UiIcon
          v-if="submitIcon && !isSubmitting"
          :name="submitIcon"
          size="sm"
          class="lead-form__submit-icon"
        />
        {{ submitLabel }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { ContactMethod, LeadSource } from '~/shared/lead-constants'
import type { UiSelectOption } from '~/components/ui/UiSelect.vue'

const props = defineProps<{
  source: LeadSource
}>()

const emit = defineEmits<{ success: [contactMethod: ContactMethod], 'privacy-navigate': [] }>()

const { t } = useI18n()
const localePath = useLocalePath()
const honeypot = ref('')
const turnstileRef = ref<{
  enabled: boolean
  token: string
  reset: () => void
} | null>(null)

const {
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
  onSubmit: baseSubmit,
  resetIdempotency,
} = useLeadForm(props.source, turnstileRef)

const submitButtonClass = computed(() => {
  const method = contactMethod.value
  if (method && method !== 'phone') {
    return `lead-form__submit_${method}`
  }
  return undefined
})

const contactMethodOptions = computed<UiSelectOption[]>(() => [
  {
    value: 'telegram',
    label: t('lead.contactMethods.telegram'),
    icon: 'simple-icons:telegram',
  },
  {
    value: 'whatsapp',
    label: t('lead.contactMethods.whatsapp'),
    icon: 'simple-icons:whatsapp',
  },
  {
    value: 'viber',
    label: t('lead.contactMethods.viber'),
    icon: 'simple-icons:viber',
  },
  {
    value: 'phone',
    label: t('lead.contactMethods.phone'),
    icon: 'lucide:phone',
  },
])

watch(submitSuccess, (success) => {
  if (success && contactMethod.value) {
    emit('success', contactMethod.value)
  }
})

defineExpose({ resetIdempotency })

const onSubmit = (event: Event) => {
  if (honeypot.value) {
    event.preventDefault()
    return
  }
  baseSubmit(event)
}
</script>
