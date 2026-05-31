<template>
  <div class="ui-input" :class="{ 'ui-input_invalid': !!error }">
    <label class="ui-input__label" :for="inputId">
      {{ label }}
    </label>
    <input
      :id="inputId"
      class="ui-input__control"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      v-bind="$attrs"
      @input="onInput"
    >
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="ui-input__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="`${inputId}-hint`"
      class="ui-input__hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    name: string
    type?: string
    error?: string
    hint?: string
    placeholder?: string
    autocomplete?: string
    inputId?: string
    required?: boolean
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = computed(() => props.inputId ?? `field-${props.name}`)

const describedBy = computed(() => {
  if (props.error) {
    return `${inputId.value}-error`
  }
  if (props.hint) {
    return `${inputId.value}-hint`
  }
  return undefined
})

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
