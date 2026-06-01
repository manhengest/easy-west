<template>
  <section id="process" class="process" v-motion="scrollVisible()">
    <header class="process__header">
      <h2 class="process__title">
        {{ t('timeline.title') }}
      </h2>
      <p class="process__lead">
        {{ t('timeline.lead') }}
      </p>
    </header>

    <ol class="process__overview" :aria-label="t('timeline.title')">
      <li
        v-for="(phase, index) in processPhases"
        :key="phase.id"
        class="process__overview-item"
        v-motion="scrollVisible(index * 60)"
      >
        <span class="process__overview-marker">{{ index + 1 }}</span>
        <span class="process__overview-label">{{ phase.title }}</span>
      </li>
    </ol>

    <div class="process__toggle-wrap">
      <UiButton
        type="button"
        variant="ghost"
        class="process__toggle"
        :aria-expanded="detailsExpanded"
        aria-controls="process-grid"
        @click="detailsExpanded = !detailsExpanded"
      >
        {{ detailsExpanded ? t('timeline.lessDetails') : t('timeline.moreDetails') }}
      </UiButton>
    </div>

    <div
      v-show="detailsExpanded"
      id="process-grid"
      class="process__grid"
    >
      <article
        v-for="(phase, phaseIndex) in processPhases"
        :key="phase.id"
        class="process-phase"
        v-motion="scrollVisible(phaseIndex * 80 + 120)"
      >
        <header class="process-phase__header">
          <span class="process-phase__badge" aria-hidden="true">
            <UiIcon :name="phase.icon" size="md" />
          </span>
          <div class="process-phase__heading">
            <p class="process-phase__eyebrow">
              {{ phaseIndex + 1 }} / {{ processPhases.length }}
            </p>
            <h3 class="process-phase__title">
              {{ phase.title }}
            </h3>
          </div>
        </header>

        <ol class="process-phase__steps">
          <li
            v-for="step in phase.steps"
            :key="step.id"
            class="process-step"
          >
            <h4 class="process-step__title">
              <span class="process-step__num">{{ step.number }}</span>
              {{ step.title }}
            </h4>
            <p
              v-if="step.description"
              class="process-step__desc"
            >
              {{ step.description }}
            </p>
          </li>
        </ol>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { scrollVisible } = useMotionPresets()
const { processPhases } = useLandingContent()

const detailsExpanded = ref(false)
</script>
