import { useMediaQuery } from '@vueuse/core'
import type { MessengerChannel } from '~/composables/useContacts'
import type { LeadSource, MessengerLeadChannel } from '~/shared/lead-constants'
import type { AttributionTouch } from '~/shared/lead-attribution'
import { watchCustomSchemeHandoff } from '~/shared/custom-scheme-handoff'
import { openExternalHref } from '~/shared/open-external'
import {
  buildMessengerClickMessage,
  buildMessengerDeeplink,
  isMessengerContactMethod,
} from '~/shared/messenger-deeplink'
import {
  MESSENGER_LEAD_COOKIE,
  MESSENGER_LEAD_MAX_AGE,
  decideMessengerClick,
  messengerTouchKey,
  normalizeMessengerLeadStore,
  withCardId,
  withTouchKey,
  type MessengerLeadStore,
} from '~/shared/messenger-lead'

const REVEAL_PROTECTED_CHANNELS = new Set<MessengerChannel>(['whatsapp', 'telegram', 'viber'])

interface MessengerLeadApiResponse {
  ok: true
  leadId: string
  cardId: number | null
}

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

function filledAttribution(fields: Record<string, string>): Record<string, string> {
  const body: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    const trimmed = value.trim()
    if (trimmed) {
      body[key] = trimmed
    }
  }
  return body
}

function lastTouchBody(touch: AttributionTouch | undefined): Record<string, string> {
  return filledAttribution({
    utmSource: touch?.utmSource ?? '',
    utmMedium: touch?.utmMedium ?? '',
    utmCampaign: touch?.utmCampaign ?? '',
    utmContent: touch?.utmContent ?? '',
    utmTerm: touch?.utmTerm ?? '',
    gclid: touch?.gclid ?? '',
    gbraid: touch?.gbraid ?? '',
    wbraid: touch?.wbraid ?? '',
    fbclid: touch?.fbclid ?? '',
  })
}

export function useMessengerActions() {
  const { hrefFor, links } = useContacts()
  const { pushEvent } = useGtm()
  const { showViberFallbackToast } = useViberFallbackToast()
  const { locale } = useI18n()
  const { hiddenFields, attribution } = useLeadAttribution()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const cookie = useCookie<MessengerLeadStore | string | null>(MESSENGER_LEAD_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: MESSENGER_LEAD_MAX_AGE,
  })

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

  function rememberCard(channel: MessengerLeadChannel, leadId: string, cardId: number) {
    const next = withCardId(normalizeMessengerLeadStore(cookie.value), channel, leadId, cardId)
    if (next) {
      cookie.value = next
    }
  }

  function rememberTouch(channel: MessengerLeadChannel, leadId: string, touch: AttributionTouch | undefined) {
    const next = withTouchKey(
      normalizeMessengerLeadStore(cookie.value),
      channel,
      leadId,
      messengerTouchKey(touch),
    )
    if (next) {
      cookie.value = next
    }
  }

  function postMessengerLead(
    leadId: string,
    channel: MessengerLeadChannel,
    source: LeadSource,
  ) {
    const localeCode = locale.value === 'ru' ? 'ru' : 'ua'
    const body = {
      leadId,
      channel,
      source,
      locale: localeCode,
      device: isMobile.value ? 'mobile' as const : 'desktop' as const,
      ...filledAttribution(hiddenFields.value),
    }

    void $fetch<MessengerLeadApiResponse>('/api/messenger-leads', {
      method: 'POST',
      body,
    }).then((response) => {
      if (response.cardId) {
        rememberCard(channel, leadId, response.cardId)
      }
    }).catch((error: unknown) => {
      console.error('[messenger-leads] card was not created', { leadId, channel, error })
    })
  }

  function putLastTouch(cardId: number, channel: MessengerLeadChannel, leadId: string) {
    const touch = attribution.value?.last
    const body = {
      cardId,
      leadId,
      ...lastTouchBody(touch),
    }

    void $fetch('/api/messenger-leads', {
      method: 'PUT',
      body,
    }).then(() => {
      rememberTouch(channel, leadId, touch)
    }).catch((error: unknown) => {
      console.error('[messenger-leads] last touch was not updated', { leadId, cardId, error })
    })
  }

  function openMessenger(channel: MessengerChannel, source: LeadSource = 'hero') {
    trackClick(channel)

    if (!isMessengerContactMethod(channel)) {
      openExternalHref(hrefFor(channel))
      return
    }

    // The chat has to open in this turn. An await before it drops the click's permission to open a window.
    const decision = decideMessengerClick({
      store: normalizeMessengerLeadStore(cookie.value),
      channel,
      now: Date.now(),
      lastTouch: attribution.value?.last,
    })
    if (decision.writeStore) {
      cookie.value = decision.store
    }

    const message = buildMessengerClickMessage(decision.leadId, channel)
    const href = buildMessengerDeeplink(channel, message, {
      phone: links.value.phone,
      whatsapp: links.value.whatsapp,
      telegram: links.value.telegram,
      viber: links.value.viber,
    })
    openExternalHref(href)
    watchViber(channel)

    if (decision.kind === 'mint' || decision.retryCreate) {
      postMessengerLead(decision.leadId, channel, source)
      return
    }
    if (decision.putLastTouch && decision.cardId) {
      putLastTouch(decision.cardId, channel, decision.leadId)
    }
  }

  return {
    trackClick,
    openMessenger,
  }
}

export function useMessengerLink(
  channel: MaybeRefOrGetter<MessengerChannel>,
  source: MaybeRefOrGetter<LeadSource> = 'hero',
) {
  const { hrefFor } = useContacts()
  const { trackClick, openMessenger } = useMessengerActions()

  const resolvedChannel = computed(() => toValue(channel))
  const href = computed(() => hrefFor(resolvedChannel.value))
  const revealProtected = computed(() => isRevealProtectedChannel(resolvedChannel.value))

  function open() {
    openMessenger(resolvedChannel.value, toValue(source))
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
