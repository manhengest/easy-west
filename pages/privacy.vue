<template>
  <article class="legal-page">
    <h1 class="legal-page__title">{{ t('nav.privacy') }}</h1>
    <p class="legal-page__lead">{{ t('footer.privacyPolicy') }}</p>

    <section
      v-for="(section, index) in sections"
      :key="index"
      class="legal-page__section"
    >
      <h2 class="legal-page__heading">
        {{ section.heading }}
      </h2>
      <p
        v-for="(paragraph, pIndex) in section.paragraphs"
        :key="`p-${index}-${pIndex}`"
        class="legal-page__body"
      >
        {{ paragraph }}
      </p>
      <ul
        v-if="section.list?.length"
        class="legal-page__list"
      >
        <li
          v-for="(item, liIndex) in section.list"
          :key="`li-${index}-${liIndex}`"
        >
          {{ item }}
        </li>
      </ul>
      <p
        v-for="(paragraph, pIndex) in section.paragraphsAfter ?? []"
        :key="`pa-${index}-${pIndex}`"
        class="legal-page__body"
      >
        {{ paragraph }}
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { privacyPolicyRu, privacyPolicyUa } from '~/constants/privacy-policy'

const { t, locale } = useI18n()

const sections = computed(() =>
  locale.value === 'ru' ? privacyPolicyRu : privacyPolicyUa,
)

usePageSeo('nav.privacy')
</script>
