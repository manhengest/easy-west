<template>
  <div class="landing">
    <HeroSection />
    <SegmentsSection @open-lead="openLead('segment')" />
    <TimelineSection />
    <GeographySection />
    <GallerySection />
    <ReviewsSection />
    <FaqSection />
    <CtaSection @open-lead="openLead('cta')" />

    <LeadFormHost v-model="leadOpen" :source="leadSource" />
  </div>
</template>

<script setup lang="ts">
import type { LeadSource } from '~/shared/lead-constants'

const { t } = useI18n()
const config = useRuntimeConfig()
const leadOpen = ref(false)
const leadSource = ref<LeadSource>('cta')

function openLead(source: LeadSource) {
  leadSource.value = source
  leadOpen.value = true
}

provideLeadHost(openLead)

useLocaleHead({ seo: true })

useSeoMeta({
  title: () => t('seo.title'),
  description: () => t('seo.description'),
  ogTitle: () => t('seo.title'),
  ogDescription: () => t('seo.description'),
  ogImage: () => `${config.public.siteUrl}/og/og-default.jpg`,
  twitterCard: 'summary_large_image',
})

definePageMeta({
  layout: 'default',
})
</script>
