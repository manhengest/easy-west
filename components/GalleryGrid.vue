<template>
  <ClientOnly>
    <div class="gallery-grid">
      <button
        v-for="(image, index) in images"
        :key="image.src"
        type="button"
        class="gallery-grid__item"
        @click="openAt(index)"
      >
        <NuxtImg
          :src="image.src"
          :alt="image.alt"
          :width="image.width"
          :height="image.height"
          loading="lazy"
          class="gallery-grid__img"
        />
      </button>
    </div>
    <template #fallback>
      <ul class="gallery-grid gallery-grid_fallback">
        <li v-for="image in images" :key="image.src" class="gallery-grid__item">
          <NuxtImg
            :src="image.src"
            :alt="image.alt"
            :width="image.width"
            :height="image.height"
            loading="lazy"
            class="gallery-grid__img"
          />
        </li>
      </ul>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { GalleryImage } from '~/types/content'

const props = defineProps<{
  images: GalleryImage[]
}>()

async function openAt(index: number) {
  const [{ default: PhotoSwipe }] = await Promise.all([
    import('photoswipe'),
    import('photoswipe/style.css'),
  ])
  const pswp = new PhotoSwipe({
    dataSource: props.images.map(img => ({
      src: img.src,
      width: img.width,
      height: img.height,
      alt: img.alt,
    })),
    index,
  })
  pswp.init()
}
</script>
