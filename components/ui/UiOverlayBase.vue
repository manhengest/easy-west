<template>
  <Teleport to="body">
    <Transition
      name="ui-overlay"
      @after-leave="leaving = false"
    >
      <div
        v-if="open"
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
    </Transition>
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
const open = ref(false)
const leaving = ref(false)
const overlayActive = computed(() => open.value || leaving.value)

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      leaving.value = false
      open.value = true
    }
    else if (open.value) {
      leaving.value = true
      open.value = false
    }
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
}

useFocusTrap(panelRef as Ref<HTMLElement | null>, overlayActive)
useOverlayInert(overlayActive)
useOverlayHistory(toRef(() => props.modelValue), toRef(() => props.overlayId), close)
</script>
