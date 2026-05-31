<template>
  <section id="segments" class="segments" v-motion="scrollVisible()">
    <header class="segments__header">
      <span class="segments__title">
        {{ t('segments.title') }}
      </span>
      <h2 class="segments__lead">
        {{ t('segments.lead') }}
      </h2>
      <p class="segments__unifying">
        {{ t('segments.unifying') }}
      </p>
    </header>
    <ul class="segments__grid">
      <li
        v-for="(segment, index) in segments"
        :key="segment.id"
        class="segments__card"
        v-motion="scrollVisible(index * 80)"
      >
        <button
          type="button"
          class="segment-card"
          @click="openSegment(segment)"
        >
          <span class="segment-card__hint" aria-hidden="true">?</span>
          <UiIcon :name="segment.icon" size="lg" class="segment-card__icon" />
          <h3 class="segment-card__title">
            {{ segment.title }}
          </h3>
          <p class="segment-card__teaser">
            {{ segment.teaser }}
          </p>
        </button>
      </li>
    </ul>

    <UiBottomSheet
      v-if="isMobile"
      v-model="sheetOpen"
      :title="activeSegment?.title ?? ''"
      overlay-id="segment-sheet"
    >
      <p v-if="activeSegment" class="segment-detail">
        {{ activeSegment.detail }}
      </p>
      <UiButton type="button" variant="primary" @click="onSegmentCta">
        {{ t('segments.cta') }}
      </UiButton>
    </UiBottomSheet>
    <UiModal
      v-else
      v-model="modalOpen"
      :title="activeSegment?.title ?? ''"
      overlay-id="segment-modal"
    >
      <p v-if="activeSegment" class="segment-detail">
        {{ activeSegment.detail }}
      </p>
      <UiButton type="button" variant="primary" @click="onSegmentCta">
        {{ t('segments.cta') }}
      </UiButton>
    </UiModal>
  </section>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import type { Segment } from '~/types/content'

const emit = defineEmits<{ 'open-lead': [] }>()

const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { segments } = useLandingContent()
const { pushEvent } = useGtm()
const isMobile = useMediaQuery('(max-width: 767px)')

const activeSegment = ref<Segment | null>(null)
const sheetOpen = ref(false)
const modalOpen = ref(false)

function openSegment(segment: Segment) {
  activeSegment.value = segment
  pushEvent('open_bottom_sheet', { source: 'segment', segment: segment.id })
  if (isMobile.value) {
    sheetOpen.value = true
  }
  else {
    modalOpen.value = true
  }
}

function onSegmentCta() {
  sheetOpen.value = false
  modalOpen.value = false
  emit('open-lead')
}
</script>
