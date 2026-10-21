import type { MessengerChannel } from '~/composables/useContacts'
import type { MessengerIntentResult } from '~/shared/messenger-intent'
import { watchCustomSchemeHandoff } from '~/shared/custom-scheme-handoff'
import {
  buildMessengerDeeplink,
  messengerApplicationCode,
} from '~/shared/messenger-deeplink'
import {
  readMessengerIntentCardId,
  writeMessengerIntentCardId,
} from '~/shared/messenger-intent'
import { openBlankExternalTab, openExternalHref } from '~/shared/open-external'

const REVEAL_PROTECTED_CHANNELS = new Set<MessengerChannel>(['whatsapp', 'telegram', 'viber'])

type MessengerButton = 'whatsapp' | 'telegram' | 'viber'

let inflightCardId: Promise<number | null> | null = null

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
  const { hrefFor, links } = useContacts()
  const { pushEvent } = useGtm()
  const { showViberFallbackToast } = useViberFallbackToast()
  const config = useRuntimeConfig()
  const { locale } = useI18n()
  const { hiddenFields } = useLeadAttribution()

  function trackClick(channel: MessengerChannel) {
    pushEvent(gtmEventFor(channel), { channel })
  }

  function watchViber(channel: MessengerChannel) {
    if (channel !== 'viber') {
      return
    }
    void watchCustomSchemeHandoff().then((result) => {
      if (result === 'stayed') {
        showViberFallbackToast()
      }
    })
  }

  function openPlain(channel: MessengerChannel, tab?: Window | null) {
    openExternalHref(hrefFor(channel), tab)
    watchViber(channel)
  }

  function openCoded(channel: MessengerButton, cardId: number, tab?: Window | null) {
    const href = buildMessengerDeeplink(channel, messengerApplicationCode(cardId), {
      phone: links.value.phone,
      whatsapp: links.value.whatsapp,
      telegram: links.value.telegram,
      viber: links.value.viber,
    })
    openExternalHref(href, tab)
    watchViber(channel)
  }

  function requestCardId(channel: MessengerButton): Promise<number | null> {
    if (!inflightCardId) {
      const localeCode = locale.value === 'ru' ? 'ru' : 'ua'
      inflightCardId = $fetch<MessengerIntentResult>('/api/messenger-intent', {
        method: 'POST',
        body: {
          channel,
          locale: localeCode,
          ...hiddenFields.value,
          website: '',
        },
      }).then((result) => {
        if (result.enabled && typeof result.cardId === 'number') {
          writeMessengerIntentCardId(sessionStorage, result.cardId)
          return result.cardId
        }
        return null
      }).catch(() => null).finally(() => {
        inflightCardId = null
      })
    }
    return inflightCardId
  }

  function openMessenger(channel: MessengerChannel) {
    trackClick(channel)
    if (channel === 'phone' || !config.public.messengerIntentEnabled) {
      openPlain(channel)
      return
    }

    const stored = readMessengerIntentCardId(sessionStorage)
    if (stored) {
      openCoded(channel, stored)
      return
    }

    const tab = channel === 'viber' ? null : openBlankExternalTab()
    void requestCardId(channel).then((cardId) => {
      if (cardId) {
        openCoded(channel, cardId, tab)
        return
      }
      openPlain(channel, tab)
    })
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
