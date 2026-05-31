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
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const config = useRuntimeConfig()
const { openLead } = useLeadHost()

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
