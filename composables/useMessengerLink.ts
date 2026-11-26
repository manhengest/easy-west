import { useMediaQuery } from '@vueuse/core'
import type { MessengerChannel } from '~/composables/useContacts'
import type { LeadSource, MessengerLeadChannel } from '~/shared/lead-constants'
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
  normalizeMessengerLeadStore,
  type MessengerLeadStore,
} from '~/shared/messenger-lead'

const REVEAL_PROTECTED_CHANNELS = new Set<MessengerChannel>(['whatsapp', 'telegram', 'viber'])

interface MessengerLeadApiResponse {
  ok: true
  leadId: string
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

export function useMessengerActions() {
  const { hrefFor, links } = useContacts()
  const { pushEvent } = useGtm()
  const { showViberFallbackToast } = useViberFallbackToast()
  const { locale, t } = useI18n()
  const { hiddenFields } = useLeadAttribution()
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
    }).catch((error: unknown) => {
      console.error('[messenger-leads] click was not saved', { leadId, channel, error })
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
    })
    if (decision.writeStore) {
      cookie.value = decision.store
    }

    const message = buildMessengerClickMessage(decision.leadId, {
      greeting: t('lead.message.greeting'),
      serviceField: t('lead.message.serviceField'),
      leadNumber: t('lead.message.leadNumber'),
    })
    const href = buildMessengerDeeplink(channel, message, {
      phone: links.value.phone,
      whatsapp: links.value.whatsapp,
      telegram: links.value.telegram,
      viber: links.value.viber,
    })
    openExternalHref(href)
    watchViber(channel)
    postMessengerLead(decision.leadId, channel, source)
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
