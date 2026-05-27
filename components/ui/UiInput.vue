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
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${inputId}-error` : undefined"
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
    autocomplete?: string
    inputId?: string
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = computed(() => props.inputId ?? `field-${props.name}`)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
