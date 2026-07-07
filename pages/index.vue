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
import { OG_IMAGE_PATH } from '~/content/brand-assets'

const { t } = useI18n()
const config = useRuntimeConfig()
const { openLead } = useLeadHost()

const i18nHead = useLocaleHead({ seo: true })
useHead(i18nHead)

useSeoMeta({
  title: () => t('seo.title'),
  description: () => t('seo.description'),
  ogTitle: () => t('seo.title'),
  ogDescription: () => t('seo.description'),
  ogImage: () => `${config.public.siteUrl}${OG_IMAGE_PATH}`,
  twitterCard: 'summary_large_image',
})

definePageMeta({
  layout: 'default',
})
</script>
