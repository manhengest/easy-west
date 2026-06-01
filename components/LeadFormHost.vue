<template>
  <UiBottomSheet
    v-if="isMobile"
    :model-value="modelValue"
    :title="overlayTitle"
    overlay-id="lead-sheet"
    @update:model-value="onOverlayUpdate"
  >
    <LeadThankYou v-if="showThankYou" />
    <LeadForm v-else ref="formRef" :source="source" @success="onFormSuccess" @privacy-navigate="closeOverlay" />
  </UiBottomSheet>
  <UiModal
    v-else
    :model-value="modelValue"
    :title="overlayTitle"
    overlay-id="lead-modal"
    @update:model-value="onOverlayUpdate"
  >
    <LeadThankYou v-if="showThankYou" />
    <LeadForm v-else ref="formRef" :source="source" @success="onFormSuccess" @privacy-navigate="closeOverlay" />
  </UiModal>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import type { LeadSource } from '~/shared/lead-constants'

const props = defineProps<{
  modelValue: boolean
  source: LeadSource
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const { pushEvent } = useGtm()
const isMobile = useMediaQuery('(max-width: 767px)')

const showThankYou = ref(false)
const formRef = ref<{ resetIdempotency: () => void } | null>(null)

const overlayTitle = computed(() =>
  showThankYou.value ? t('lead.thankYou.title') : t('lead.title'),
)

function onFormSuccess() {
  showThankYou.value = true
}

function resetHostState() {
  showThankYou.value = false
  formRef.value?.resetIdempotency()
}

function closeOverlay() {
  onOverlayUpdate(false)
}

function onOverlayUpdate(open: boolean) {
  if (!open) {
    resetHostState()
  }
  emit('update:modelValue', open)
}

watch(() => props.modelValue, (open) => {
  if (open) {
    showThankYou.value = false
    pushEvent('open_bottom_sheet', { source: props.source })
  }
})
</script>
