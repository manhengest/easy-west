<template>
  <div class="ui-textarea" :class="{ 'ui-textarea_invalid': !!error }">
    <label class="ui-textarea__label" :for="inputId">
      {{ label }}
    </label>
    <textarea
      :id="inputId"
      class="ui-textarea__control"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      v-bind="$attrs"
      @input="onInput"
    />
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="ui-textarea__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="`${inputId}-hint`"
      class="ui-textarea__hint"
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
    error?: string
    hint?: string
    placeholder?: string
    inputId?: string
    rows?: number
  }>(),
  {
    rows: 4,
    error: undefined,
    hint: undefined,
    placeholder: undefined,
    inputId: undefined,
  },
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
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>
