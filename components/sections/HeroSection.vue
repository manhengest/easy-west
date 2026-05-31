<template>
  <section id="hero" ref="section" class="hero">
    <div class="hero__grid">
      <div class="hero__copy">
        <h1 class="hero__title" v-motion="fadeUp(0)">
          {{ t('hero.title') }}
          <span class="hero__title-accent">{{ t('hero.titleAccent') }}</span>
        </h1>
        <p class="hero__lead" v-motion="fadeUp(80)">
          {{ t('hero.lead') }}
        </p>
        <div class="hero__messengers-block" v-motion="fadeUp(160)">
          <p class="hero__messengers-label">
            {{ t('hero.messengerLead') }}
          </p>
          <div class="hero__messengers">
            <UiMessengerLink channel="whatsapp" />
            <UiMessengerLink channel="telegram" />
            <UiMessengerLink channel="viber" />
          </div>
        </div>
        <div class="hero__cta" v-motion="fadeUp(240)">
          <UiButton
            type="button"
            variant="primary"
            class="hero__cta-button"
            @click="onCalculateClick"
          >
            {{ t('hero.ctaCalculate') }}
            <UiIcon name="lucide:arrow-right" size="sm" />
          </UiButton>
        </div>
        <div
          class="hero__social"
          v-motion="fadeUp(320)"
          :aria-label="t('hero.socialProofAria')"
        >
          <div class="hero__stars" aria-hidden="true">
            <svg
              v-for="star in 5"
              :key="star"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              class="hero__star"
            >
              <path
                fill="currentColor"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z"
              />
            </svg>
          </div>
          <span class="hero__social-text">{{ t('hero.socialProof') }}</span>
        </div>
      </div>
      <div class="hero__media" v-motion="fadeUp(120)">
        <img
          :src="HERO_BACKGROUND"
          :alt="t('hero.imageAlt')"
          class="hero__image"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      </div>
    </div>
    <a
      href="#segments"
      class="hero__scroll"
      :aria-label="t('hero.scrollDown')"
    >
      <UiIcon name="lucide:chevron-down" size="md" />
    </a>
  </section>
</template>

<script setup lang="ts">
import { HERO_BACKGROUND } from '~/content/landing-media'

const { t } = useI18n()
const { fadeUp } = useMotionPresets()
const { openLead } = useLeadHost()

function onCalculateClick() {
  openLead('hero')
}
</script>
