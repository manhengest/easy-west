<template>
  <div class="gallery-carousel">
    <div ref="viewport" class="gallery-carousel__viewport">
      <div class="gallery-carousel__container">
        <button
          v-for="(image, index) in images"
          :key="image.src"
          type="button"
          class="gallery-carousel__slide"
          :aria-label="image.alt"
          @click="openAt(index)"
        >
          <img
            :src="image.src"
            :alt="image.alt"
            :width="image.width"
            :height="image.height"
            loading="lazy"
            decoding="async"
            class="gallery-carousel__img"
          />
        </button>
      </div>
    </div>
    <div class="gallery-carousel__controls">
      <button
        type="button"
        class="gallery-carousel__btn"
        :disabled="!canScrollPrev"
        :aria-label="t('gallery.prev')"
        @click="scrollPrev"
      >
        <UiIcon name="lucide:chevron-left" size="sm" />
      </button>
      <button
        type="button"
        class="gallery-carousel__btn"
        :disabled="!canScrollNext"
        :aria-label="t('gallery.next')"
        @click="scrollNext"
      >
        <UiIcon name="lucide:chevron-right" size="sm" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import useEmblaCarousel from 'embla-carousel-vue'
import type { GalleryImage } from '~/types/content'

const props = defineProps<{
  images: GalleryImage[]
}>()

const { t } = useI18n()

const [viewport, emblaApi] = useEmblaCarousel({
  align: 'start',
  containScroll: 'trimSnaps',
  dragFree: true,
})

const canScrollPrev = ref(false)
const canScrollNext = ref(false)

function updateButtons() {
  const api = emblaApi.value
  if (!api) {
    return
  }
  canScrollPrev.value = api.canScrollPrev()
  canScrollNext.value = api.canScrollNext()
}

function scrollPrev() {
  emblaApi.value?.scrollPrev()
}

function scrollNext() {
  emblaApi.value?.scrollNext()
}

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

watch(
  emblaApi,
  (api) => {
    if (!api) {
      return
    }
    updateButtons()
    api.on('select', updateButtons)
    api.on('reInit', updateButtons)
  },
  { immediate: true },
)

watch(
  () => props.images,
  () => {
    nextTick(() => emblaApi.value?.reInit())
  },
)

onMounted(() => {
  const viewportEl = viewport.value
  if (!viewportEl || typeof IntersectionObserver === 'undefined') {
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        emblaApi.value?.reInit()
      }
    },
    { threshold: 0.1 },
  )

  observer.observe(viewportEl)
  onBeforeUnmount(() => observer.disconnect())
})
</script>
