<template>
  <div class="ui-accordion">
    <div
      v-for="item in items"
      :key="item.id"
      class="ui-accordion__item"
      :class="{ 'ui-accordion__item_open': openId === item.id }"
    >
      <button
        :id="`trigger-${item.id}`"
        type="button"
        class="ui-accordion__trigger"
        :aria-expanded="openId === item.id"
        :aria-controls="`panel-${item.id}`"
        @click="toggle(item.id)"
      >
        {{ item.title }}
        <UiIcon
          name="lucide:chevron-down"
          size="sm"
          class="ui-accordion__chevron"
          :class="{ 'ui-accordion__chevron_open': openId === item.id }"
        />
      </button>
      <div
        :id="`panel-${item.id}`"
        class="ui-accordion__panel-wrap"
        role="region"
        :aria-labelledby="`trigger-${item.id}`"
        :aria-hidden="openId !== item.id"
        :inert="openId !== item.id || undefined"
      >
        <div class="ui-accordion__panel-inner">
          <p class="ui-accordion__content">
            {{ item.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface AccordionItem {
  id: string
  title: string
  description: string
}

const props = withDefaults(
  defineProps<{
    items: AccordionItem[]
    single?: boolean
  }>(),
  { single: true },
)

const emit = defineEmits<{ toggle: [{ id: string, open: boolean }] }>()

const openId = ref<string | null>(null)

function toggle(id: string) {
  const next = openId.value === id ? null : id
  openId.value = next
  emit('toggle', { id, open: next === id })
}
</script>
