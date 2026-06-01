<template>
  <section id="faq" class="faq-section" v-motion="scrollVisible()">
    <header class="faq-section__header">
      <h2 class="faq-section__title">
        {{ t('faq.title') }}
      </h2>
    </header>
    <div class="faq-section__body site-container_narrow">
      <UiAccordion :items="accordionItems" @toggle="onFaqToggle" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AccordionItem } from '~/components/ui/UiAccordion.vue'

const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { faqItems } = useLandingContent()
const { pushEvent } = useGtm()

const accordionItems = computed<AccordionItem[]>(() =>
  faqItems.value.map(item => ({
    id: item.id,
    title: item.important ? `⚠ ${item.title}` : item.title,
    description: item.description,
  })),
)

function onFaqToggle(payload: { id: string, open: boolean }) {
  if (payload.open) {
    pushEvent('faq_toggle', { faq_id: payload.id })
  }
}
</script>
