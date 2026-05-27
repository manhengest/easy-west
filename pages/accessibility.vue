<template>
  <article class="legal-page">
    <h1 class="legal-page__title">{{ t('accessibility.title') }}</h1>
    <p class="legal-page__body">{{ t('accessibility.commitment') }}</p>
    <p class="legal-page__body">
      {{ t('accessibility.contactLabel') }}: {{ t('accessibility.contact') }}
    </p>
    <p class="legal-page__meta">
      {{ t('accessibility.lastReviewedLabel') }}: {{ t('accessibility.lastReviewed') }}
    </p>
  </article>
</template>

<script setup lang="ts">
const { t } = useI18n()
usePageSeo('accessibility.title')
</script>
