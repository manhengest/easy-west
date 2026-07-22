<template>
  <Icon
    :name="name"
    class="ui-icon"
    :class="sizeClass"
    :aria-hidden="label ? undefined : true"
    :aria-label="label"
    role="img"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string
    label?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md', label: undefined },
)

const sizeClass = computed(() => `ui-icon_${props.size}`)
</script>
