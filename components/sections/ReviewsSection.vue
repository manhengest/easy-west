<template>
  <section id="reviews" class="reviews-section" v-motion="scrollVisible()">
    <header class="reviews-section__header">
      <span class="reviews-section__title">
        {{ t('reviews.title') }}
      </span>
      <h2 class="reviews-section__lead">
        {{ t('reviews.lead') }}
      </h2>
    </header>
    <ReviewsCarousel :slides="reviewSlides" />
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { reviewSlides } = useLandingContent()
</script>
