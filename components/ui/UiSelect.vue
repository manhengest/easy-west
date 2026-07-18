<template>
  <div class="ui-select" :class="{ 'ui-select_invalid': !!error }">
    <label class="ui-select__label" :for="selectId">
      {{ label }}
    </label>
    <div class="ui-select__control-wrap">
      <span v-if="selectedIcon" class="ui-select__icon" aria-hidden="true">
        <UiIcon :name="selectedIcon" size="sm" />
      </span>
      <select
        :id="selectId"
        class="ui-select__control"
        :name="name"
        :value="modelValue"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        v-bind="$attrs"
        @change="onChange"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <span class="ui-select__chevron" aria-hidden="true">
        <UiIcon name="lucide:chevron-down" size="sm" />
      </span>
    </div>
    <p
      v-if="error"
      :id="`${selectId}-error`"
      class="ui-select__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="`${selectId}-hint`"
      class="ui-select__hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

export interface UiSelectOption {
  value: string
  label: string
  icon?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    name: string
    options: UiSelectOption[]
    error?: string
    hint?: string
    selectId?: string
    required?: boolean
  }>(),
  { required: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const selectId = computed(() => props.selectId ?? `field-${props.name}`)

const selectedIcon = computed(() =>
  props.options.find(option => option.value === props.modelValue)?.icon,
)

const describedBy = computed(() => {
  if (props.error) {
    return `${selectId.value}-error`
  }
  if (props.hint) {
    return `${selectId.value}-hint`
  }
  return undefined
})

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>
