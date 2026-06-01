<template>
  <div class="lead-thank-you" role="status" aria-live="polite">
    <div class="lead-thank-you__icon-wrap" aria-hidden="true">
      <UiIcon name="lucide:circle-check" class="lead-thank-you__icon" />
    </div>
    <p class="lead-thank-you__message">
      {{ t('lead.success') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
