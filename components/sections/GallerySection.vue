<template>
  <section id="gallery" class="gallery-section" v-motion="scrollVisible()">
    <header class="gallery-section__header">
      <span class="gallery-section__title">
        {{ t('gallery.title') }}
      </span>
      <h2 class="gallery-section__lead">
        {{ t('gallery.lead') }}
      </h2>
    </header>
    <GalleryCarousel :images="galleryImages" />
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { galleryImages } = useLandingContent()
</script>
