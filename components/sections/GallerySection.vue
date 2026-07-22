<template>
  <section id="gallery" v-motion="scrollVisible()" class="gallery-section">
    <header class="gallery-section__header">
      <h2 class="gallery-section__title">
        {{ t('gallery.title') }}
      </h2>
      <p class="gallery-section__lead">
        {{ t('gallery.lead') }}
      </p>
    </header>
    <GalleryCarousel :images="galleryImages" />
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { galleryImages } = useLandingContent()
</script>
