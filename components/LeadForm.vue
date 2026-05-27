<template>
  <form
    class="lead-form"
    :class="{ 'lead-form_hero': source === 'hero' }"
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

    <p v-if="submitSuccess" class="lead-form__success" role="status">
      {{ t('lead.success') }}
    </p>
    <p v-else-if="submitError" class="lead-form__error" role="alert">
      {{ t('lead.errors.submit') }}
    </p>

    <UiInput
      :model-value="from ?? ''"
      v-bind="fromAttrs"
      @update:model-value="from = $event"
      name="from"
      input-id="lead-from"
      :label="t('lead.fields.from')"
      :error="errors.from ? t('lead.errors.from') : undefined"
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
      autocomplete="address-level1"
    />

    <UiInput
      :model-value="phone ?? ''"
      v-bind="phoneAttrs"
      @update:model-value="phone = $event"
      name="phone"
      input-id="lead-phone"
      type="tel"
      :label="t('lead.fields.phone')"
      :error="errors.phone ? t('lead.errors.phone') : undefined"
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
          <NuxtLink :to="localePath('/privacy')" class="lead-form__consent-link">
            {{ t('nav.privacy') }}
          </NuxtLink>
        </span>
      </label>
      <p v-if="errors.consentAccepted" class="lead-form__consent-error" role="alert">
        {{ t('lead.errors.consent') }}
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

    <div v-if="source === 'hero'" class="lead-form__footer">
      <UiButton
        type="submit"
        variant="primary"
        class="lead-form__submit"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        {{ t('hero.formSubmit') }}
        <UiIcon name="lucide:arrow-right" size="sm" />
      </UiButton>
      <p class="lead-form__footer-note">
        {{ t('hero.formFooter') }}
      </p>
    </div>
    <UiButton
      v-else
      type="submit"
      variant="primary"
      class="lead-form__submit"
      :loading="isSubmitting"
      :disabled="isSubmitting"
    >
      {{ t('lead.submit') }}
    </UiButton>
  </form>
</template>

<script setup lang="ts">
import type { LeadSource } from '~/shared/lead-constants'

const props = defineProps<{
  source: LeadSource
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const honeypot = ref('')

const {
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
  onSubmit: baseSubmit,
} = useLeadForm(props.source)

const onSubmit = (event: Event) => {
  if (honeypot.value) {
    event.preventDefault()
    return
  }
  baseSubmit(event)
}
</script>
