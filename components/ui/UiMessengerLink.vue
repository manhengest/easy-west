<template>
  <a
    :href="href"
    class="ui-messenger-link"
    :class="[channelClass, appearanceClass]"
    target="_blank"
    rel="noopener noreferrer"
    @click="onClick"
  >
    <UiIcon :name="iconName" size="sm" />
    <span class="ui-messenger-link__label">
      <slot>{{ defaultLabel }}</slot>
    </span>
  </a>
</template>

<script setup lang="ts">
import type { MessengerChannel } from '~/composables/useContacts'

const props = withDefaults(
  defineProps<{
    channel: MessengerChannel
    label?: string
    appearance?: 'default' | 'on-dark'
  }>(),
  { appearance: 'default' },
)

const appearanceClass = computed(() =>
  props.appearance === 'on-dark' ? 'ui-messenger-link_on-dark' : undefined,
)

const { t } = useI18n()
const { hrefFor } = useContacts()
const { pushEvent } = useGtm()

const href = computed(() => hrefFor(props.channel))

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
  }
})

const channelClass = computed(() => `ui-messenger-link_${props.channel}`)

const defaultLabel = computed(() => {
  if (props.label) {
    return props.label
  }
  return t(`contacts.${props.channel}`)
})

const gtmEvent = computed(() => {
  switch (props.channel) {
    case 'whatsapp':
      return 'click_whatsapp'
    case 'telegram':
      return 'click_telegram'
    case 'viber':
      return 'click_viber'
    case 'phone':
      return 'click_phone'
  }
})

function onClick() {
  pushEvent(gtmEvent.value, { channel: props.channel })
}
</script>
