<template>
  <div v-if="enabled" class="ui-turnstile">
    <div ref="containerRef" class="ui-turnstile__widget" />
    <p v-if="loadError" class="ui-turnstile__error" role="alert">
      {{ t('lead.errors.captcha') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const containerRef = ref<HTMLElement | null>(null)
const { t } = useI18n()

const {
  enabled,
  token,
  loadError,
  reset,
} = useTurnstile(containerRef)

defineExpose({
  get enabled() {
    return enabled.value
  },
  get token() {
    return token.value
  },
  reset,
  get loadError() {
    return loadError.value
  },
})
</script>
