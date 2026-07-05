<template>
  <ClientOnly>
    <button
      v-if="revealProtected"
      type="button"
      class="ui-messenger-link"
      :class="[channelClass, appearanceClass]"
      @click="open"
    >
      <UiIcon :name="iconName" size="sm" />
      <span class="ui-messenger-link__label">
        <slot>{{ defaultLabel }}</slot>
      </span>
    </button>
    <a
      v-else
      :href="href"
      class="ui-messenger-link"
      :class="[channelClass, appearanceClass]"
      :rel="opensExternally ? 'noopener noreferrer' : undefined"
      :target="opensExternally ? '_blank' : undefined"
      @click="trackDirectClick"
    >
      <UiIcon :name="iconName" size="sm" />
      <span class="ui-messenger-link__label">
        <slot>{{ defaultLabel }}</slot>
      </span>
    </a>
    <template #fallback>
      <span
        class="ui-messenger-link"
        :class="[channelClass, appearanceClass]"
        role="presentation"
      >
        <UiIcon :name="iconName" size="sm" />
        <span class="ui-messenger-link__label">
          <slot>{{ defaultLabel }}</slot>
        </span>
      </span>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { MessengerChannel } from '~/composables/useContacts'

const props = withDefaults(
  defineProps<{
    channel: MessengerChannel
    label?: string
    appearance?: 'default' | 'on-dark'
  }>(),
  { appearance: 'default', label: undefined },
)

const appearanceClass = computed(() =>
  props.appearance === 'on-dark' ? 'ui-messenger-link_on-dark' : undefined,
)

const { t } = useI18n()
const { href, revealProtected, open, trackDirectClick } = useMessengerLink(() => props.channel)

const opensExternally = computed(() => props.channel !== 'phone')

const iconName = computed(() => {
  switch (props.channel) {
    case 'whatsapp':
      return 'simple-icons:whatsapp'
    case 'telegram':
      return 'simple-icons:telegram'
    case 'viber':
      return 'simple-icons:viber'
    case 'phone':
      return 'lucide:phone'
    default:
      return 'lucide:phone'
  }
})

const channelClass = computed(() => `ui-messenger-link_${props.channel}`)

const defaultLabel = computed(() => {
  if (props.label) {
    return props.label
  }
  return t(`contacts.${props.channel}`)
})

</script>
