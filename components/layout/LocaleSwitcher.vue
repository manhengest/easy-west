<template>
  <div class="locale-switcher" role="group" :aria-label="t('nav.language')">
    <template v-for="(loc, index) in availableLocales" :key="loc.code">
      <span v-if="index > 0" class="locale-switcher__sep" aria-hidden="true">/</span>
      <NuxtLink
        :to="localeSwitchPath(loc.code)"
        class="locale-switcher__link"
        :class="{ 'locale-switcher__link_active': loc.code === locale }"
        :aria-current="loc.code === locale ? 'true' : undefined"
        @click="onSwitch(loc.code)"
      >
        {{ loc.name }}
      </NuxtLink>
    </template>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localeCookie = useCookie('ew_locale', { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })

type LocaleCode = 'ua' | 'ru'

const availableLocales = computed(() =>
  (locales.value as Array<{ code: LocaleCode, name?: string }>).filter(l => l.code),
)

function localeSwitchPath(code: string) {
  return switchLocalePath(code as LocaleCode)
}

const { pushEvent } = useGtm()

function onSwitch(code: string) {
  if (code !== locale.value) {
    pushEvent('locale_switch', { from: locale.value, to: code })
    localeCookie.value = code
  }
}
</script>
