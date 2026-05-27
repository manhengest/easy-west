<template>
  <ClientOnly>
    <ReviewsCarouselTrack :slides="slides" />
    <template #fallback>
      <ul class="reviews-carousel reviews-carousel_fallback">
        <li v-for="slide in slides" :key="slide.id" class="reviews-carousel__slide">
          <NuxtImg
            :src="slide.src"
            :alt="slide.alt"
            :width="slide.width"
            :height="slide.height"
            loading="lazy"
            class="reviews-carousel__img"
          />
        </li>
      </ul>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import ReviewsCarouselTrack from '~/components/ReviewsCarouselTrack.vue'
import type { ReviewSlide } from '~/types/content'

defineProps<{
  slides: ReviewSlide[]
}>()
</script>
