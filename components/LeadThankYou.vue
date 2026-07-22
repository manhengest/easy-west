<template>
  <div class="lead-thank-you" role="status" aria-live="polite">
    <div
      v-if="viberHandoff === 'checking'"
      class="lead-thank-you__checking"
      aria-busy="true"
    >
      <span class="lead-thank-you__spinner" aria-hidden="true" />
    </div>

    <div v-else-if="viberHandoff === 'miss'" class="lead-thank-you__fallback">
      <div class="lead-thank-you__icon-wrap lead-thank-you__icon-wrap_error" aria-hidden="true">
        <UiIcon name="lucide:circle-x" class="lead-thank-you__icon lead-thank-you__icon_error" />
      </div>
      <p class="lead-thank-you__fallback-message">
        {{ t('contacts.viberFallback.message') }}
      </p>
      <div class="lead-thank-you__fallback-actions">
        <a
          class="lead-thank-you__fallback-link"
          :href="VIBER_DOWNLOAD_URL"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('contacts.viberFallback.download') }}
        </a>
        <a
          class="lead-thank-you__fallback-link lead-thank-you__fallback-link_primary"
          :href="telegramHref"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('contacts.viberFallback.telegram') }}
        </a>
      </div>
    </div>

    <template v-else>
      <div class="lead-thank-you__icon-wrap" aria-hidden="true">
        <UiIcon name="lucide:circle-check" class="lead-thank-you__icon" />
      </div>
      <p class="lead-thank-you__message">
        {{ successMessage }}
      </p>
      <p v-if="viberHandoff === 'ok'" class="lead-thank-you__hint">
        {{ t('lead.viberCopyHint') }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ContactMethod } from '~/shared/lead-constants'
import type { ViberHandoffStatus } from '~/shared/custom-scheme-handoff'
import { isMessengerContactMethod } from '~/shared/messenger-deeplink'

const VIBER_DOWNLOAD_URL = 'https://www.viber.com/download/'

const props = withDefaults(
  defineProps<{
    contactMethod?: ContactMethod | null
    viberHandoff?: ViberHandoffStatus
  }>(),
  { contactMethod: null, viberHandoff: undefined },
)

const { t } = useI18n()
const { hrefFor } = useContacts()

const successMessage = computed(() =>
  props.contactMethod && isMessengerContactMethod(props.contactMethod)
    ? t('lead.successMessenger')
    : t('lead.success'),
)

const telegramHref = computed(() => hrefFor('telegram'))
</script>
