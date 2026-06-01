<template>
  <section id="reviews" class="reviews-section" v-motion="scrollVisible()">
    <header class="reviews-section__header">
      <h2 class="reviews-section__title">
        {{ t('reviews.title') }}
      </h2>
      <p class="reviews-section__lead">
        {{ t('reviews.lead') }}
      </p>
    </header>
    <ReviewsCarousel :slides="reviewSlides" />
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { reviewSlides } = useLandingContent()
</script>
