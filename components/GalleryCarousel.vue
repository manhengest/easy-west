<template>
  <ClientOnly>
    <GalleryCarouselTrack :images="images" />
    <template #fallback>
      <ul class="gallery-carousel gallery-carousel_fallback">
        <li v-for="image in images" :key="image.src" class="gallery-carousel__slide">
          <img
            :src="image.src"
            :alt="image.alt"
            :width="image.width"
            :height="image.height"
            loading="lazy"
            decoding="async"
            class="gallery-carousel__img"
          >
        </li>
      </ul>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import GalleryCarouselTrack from '~/components/GalleryCarouselTrack.vue'
import type { GalleryImage } from '~/types/content'

defineProps<{
  images: GalleryImage[]
}>()
</script>
