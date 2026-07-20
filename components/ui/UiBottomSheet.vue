<template>
  <UiOverlayBase
    :model-value="modelValue"
    :overlay-id="overlayId"
    :title-id="titleId"
    panel-class="ui-bottom-sheet"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <header class="ui-bottom-sheet__header">
      <h2 :id="titleId" class="ui-bottom-sheet__title">
        {{ title }}
      </h2>
      <button
        type="button"
        class="ui-bottom-sheet__close"
        :aria-label="t('overlay.close')"
        @click="emit('update:modelValue', false)"
      >
        <UiIcon name="lucide:x" size="sm" />
      </button>
    </header>
    <div class="ui-bottom-sheet__body">
      <slot />
    </div>
  </UiOverlayBase>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  overlayId?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const overlayId = computed(() => props.overlayId ?? 'bottom-sheet')
const titleId = computed(() => `${overlayId.value}-title`)
</script>
