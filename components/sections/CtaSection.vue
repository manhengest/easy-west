<template>
  <div class="cta-section-wrap">
    <section id="contacts" v-motion="scrollVisible()" class="cta-section">
      <div class="cta-section__content">
        <h2 class="cta-section__title">
          {{ t('cta.title') }}
        </h2>
        <p class="cta-section__lead">
          {{ t('cta.lead') }}
        </p>
      </div>
      <div class="cta-section__actions">
        <UiButton
          type="button"
          variant="inverse"
          class="cta-section__submit"
          @click="emit('open-lead')"
        >
          {{ t('cta.submit') }}
        </UiButton>
        <UiMessengerLink channel="whatsapp" appearance="on-dark" />
        <UiMessengerLink channel="telegram" appearance="on-dark" />
        <UiMessengerLink channel="viber" appearance="on-dark" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ 'open-lead': [] }>()

const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
</script>
