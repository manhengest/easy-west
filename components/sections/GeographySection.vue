<template>
  <section id="geography" class="geography" v-motion="scrollVisible()">
    <header class="geography__header">
      <span class="geography__title">
        {{ t('geography.title') }}
      </span>
      <h2 class="geography__lead">
        {{ t('geography.lead') }}
      </h2>
    </header>

    <ul class="geography__highlights">
      <li
        v-for="(item, index) in geographyHighlights"
        :key="item.text"
        class="geography-highlight"
        v-motion="scrollVisible(index * 60)"
      >
        <UiIcon :name="item.icon" size="md" class="geography-highlight__icon" />
        <span>{{ item.text }}</span>
      </li>
    </ul>

    <div class="geography__panel">
      <div class="geography__routes">
        <article
          v-for="(route, index) in routeHighlights"
          :key="route.id"
          class="geography-route"
          :class="`geography-route_${route.id}`"
          v-motion="scrollVisible(index * 80 + 100)"
        >
          <span class="geography-route__icon" aria-hidden="true">
            <UiIcon :name="route.icon" size="md" />
          </span>
          <div class="geography-route__body">
            <h3 class="geography-route__title">
              {{ route.label }}
            </h3>
            <p class="geography-route__desc">
              {{ route.description }}
            </p>
          </div>
        </article>
      </div>

      <figure class="geography__map" v-motion="scrollVisible(180)">
        <img
          :src="GEOGRAPHY_MAP.src"
          :alt="t('geography.mapAlt')"
          :width="GEOGRAPHY_MAP.width"
          :height="GEOGRAPHY_MAP.height"
          loading="lazy"
          decoding="async"
          class="geography__map-img"
        />
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GEOGRAPHY_MAP } from '~/content/landing-media'

const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { routeHighlights, geographyHighlights } = useLandingContent()
</script>
