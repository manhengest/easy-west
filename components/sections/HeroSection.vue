<template>
  <section
    id="hero"
    ref="section"
    class="hero"
    :style="{ '--hero-bg': `url(${HERO_BACKGROUND})` }"
  >
    <div class="hero__grid">
      <div class="hero__copy">
        <h1 class="hero__title" v-motion="fadeUp(0)">
          {{ t('hero.title') }}
        </h1>
        <p class="hero__lead" v-motion="fadeUp(80)">
          {{ t('hero.lead') }}
        </p>
        <ul class="hero__benefits" v-motion="fadeUp(160)">
          <li v-for="(benefit, i) in heroBenefits" :key="i" class="hero__benefit">
            <UiIcon name="lucide:check" size="sm" class="hero__benefit-icon" />
            {{ benefit }}
          </li>
        </ul>
        <div class="hero__messengers" v-motion="fadeUp(240)">
          <UiMessengerLink channel="whatsapp" />
          <UiMessengerLink channel="telegram" />
          <UiMessengerLink channel="viber" />
          <UiMessengerLink channel="phone" />
        </div>
      </div>
      <div class="hero__form-wrap" v-motion="fadeUp(120)">
        <header class="hero__form-header">
          <h2 class="hero__form-title">
            {{ t('hero.formTitle') }}
          </h2>
          <p class="hero__form-note">
            {{ t('hero.formNote') }}
          </p>
        </header>
        <LeadForm source="hero" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { HERO_BACKGROUND } from '~/content/landing-media'

const { t } = useI18n()
const { fadeUp } = useMotionPresets()
const { heroBenefits } = useLandingContent()
</script>
