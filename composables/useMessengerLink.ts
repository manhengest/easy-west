import type { MessengerChannel } from '~/composables/useContacts'
import { openExternalHref } from '~/shared/open-external'

const REVEAL_PROTECTED_CHANNELS = new Set<MessengerChannel>(['whatsapp', 'telegram', 'viber'])

export function isRevealProtectedChannel(channel: MessengerChannel): boolean {
  return REVEAL_PROTECTED_CHANNELS.has(channel)
}

function gtmEventFor(channel: MessengerChannel): string {
  switch (channel) {
    case 'whatsapp':
      return 'click_whatsapp'
    case 'telegram':
      return 'click_telegram'
    case 'viber':
      return 'click_viber'
    case 'phone':
      return 'click_phone'
  }
}

export function useMessengerActions() {
  const { hrefFor } = useContacts()
  const { pushEvent } = useGtm()

  function trackClick(channel: MessengerChannel) {
    pushEvent(gtmEventFor(channel), { channel })
  }

  function openMessenger(channel: MessengerChannel) {
    trackClick(channel)
    openExternalHref(hrefFor(channel))
  }

  return {
    trackClick,
    openMessenger,
  }
}

export function useMessengerLink(channel: MaybeRefOrGetter<MessengerChannel>) {
  const { hrefFor } = useContacts()
  const { trackClick, openMessenger } = useMessengerActions()

  const resolvedChannel = computed(() => toValue(channel))
  const href = computed(() => hrefFor(resolvedChannel.value))
  const revealProtected = computed(() => isRevealProtectedChannel(resolvedChannel.value))

  function open() {
    openMessenger(resolvedChannel.value)
  }

  function trackDirectClick() {
    trackClick(resolvedChannel.value)
  }

  return {
    href,
    revealProtected,
    open,
    trackDirectClick,
  }
}
