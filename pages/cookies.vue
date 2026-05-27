<template>
  <article class="legal-page">
    <h1 class="legal-page__title">{{ t('nav.cookies') }}</h1>
    <p class="legal-page__body">{{ t('legal.placeholder') }}</p>
  </article>
</template>

<script setup lang="ts">
const { t } = useI18n()
usePageSeo('nav.cookies')
</script>
