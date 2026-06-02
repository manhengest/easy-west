<template>
  <ClientOnly>
    <div
      v-if="needsBanner"
      class="cookie-banner"
      role="dialog"
      aria-modal="false"
      :aria-label="t('cookies.banner.title')"
    >
      <h2 class="cookie-banner__title">
        {{ t('cookies.banner.title') }}
      </h2>
      <p class="cookie-banner__text">
        {{ t('cookies.banner.description') }}
        <NuxtLink :to="localePath('/cookies')" class="cookie-banner__link">
          {{ t('cookies.banner.configure') }}
        </NuxtLink>.
      </p>
      <div class="cookie-banner__actions">
        <UiButton variant="primary" type="button" class="cookie-banner__btn" @click="acceptAll">
          {{ t('cookies.banner.acceptAll') }}
        </UiButton>
        <UiButton variant="ghost" type="button" class="cookie-banner__btn" @click="rejectAll">
          {{ t('cookies.banner.rejectAll') }}
        </UiButton>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { needsBanner, acceptAll, rejectAll } = useConsent()
</script>
