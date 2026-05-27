<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="ui-overlay"
      @keydown.esc.prevent="close"
    >
      <div
        class="ui-overlay__backdrop"
        aria-hidden="true"
        @click="close"
      />
      <div
        ref="panelRef"
        class="ui-overlay__panel"
        :class="panelClass"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  overlayId: string
  titleId: string
  panelClass?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const panelRef = ref<HTMLElement | null>(null)
const active = computed(() => props.modelValue)

function close() {
  emit('update:modelValue', false)
}

useFocusTrap(panelRef as Ref<HTMLElement | null>, active)
useOverlayInert(active)
useOverlayHistory(active, toRef(() => props.overlayId), close)
</script>
