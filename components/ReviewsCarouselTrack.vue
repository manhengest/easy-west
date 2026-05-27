<template>
  <div class="reviews-carousel">
    <div ref="viewport" class="reviews-carousel__viewport">
      <div class="reviews-carousel__container">
        <article
          v-for="slide in slides"
          :key="slide.id"
          class="reviews-carousel__slide"
        >
          <NuxtImg
            :src="slide.src"
            :alt="slide.alt"
            :width="slide.width"
            :height="slide.height"
            loading="lazy"
            class="reviews-carousel__img"
          />
          <span class="reviews-carousel__channel">{{ t(`reviews.channel.${slide.channel}`) }}</span>
        </article>
      </div>
    </div>
    <div class="reviews-carousel__controls">
      <button
        type="button"
        class="reviews-carousel__btn"
        :disabled="!canScrollPrev"
        :aria-label="t('reviews.prev')"
        @click="scrollPrev"
      >
        <UiIcon name="lucide:chevron-left" size="sm" />
      </button>
      <button
        type="button"
        class="reviews-carousel__btn"
        :disabled="!canScrollNext"
        :aria-label="t('reviews.next')"
        @click="scrollNext"
      >
        <UiIcon name="lucide:chevron-right" size="sm" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import useEmblaCarousel from 'embla-carousel-vue'
import type { ReviewSlide } from '~/types/content'

const props = defineProps<{
  slides: ReviewSlide[]
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
  () => props.slides,
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
      if (entries.some((entry) => entry.isIntersecting)) {
        emblaApi.value?.reInit()
      }
    },
    { threshold: 0.1 },
  )

  observer.observe(viewportEl)
  onBeforeUnmount(() => observer.disconnect())
})
</script>
