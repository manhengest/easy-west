<template>
  <UiBottomSheet
    v-if="isMobile"
    :model-value="modelValue"
    :title="t('lead.title')"
    overlay-id="lead-sheet"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <LeadForm :source="source" />
  </UiBottomSheet>
  <UiModal
    v-else
    :model-value="modelValue"
    :title="t('lead.title')"
    overlay-id="lead-modal"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <LeadForm :source="source" />
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

watch(() => props.modelValue, (open) => {
  if (open) {
    pushEvent('open_bottom_sheet', { source: props.source })
  }
})
</script>
