import type { ContactMethod } from '~/shared/lead-constants'
import type { CustomSchemeHandoffResult } from '~/shared/custom-scheme-handoff'
import {
  buildLeadMessage,
  buildMessengerDeeplink,
  isMessengerContactMethod,
  type LeadMessageFields,
} from '~/shared/messenger-deeplink'
import { watchCustomSchemeHandoff } from '~/shared/custom-scheme-handoff'
import { openExternalHref } from '~/shared/open-external'

export function useLeadMessenger() {
  const { t } = useI18n()
  const { links } = useContacts()
  const { trackClick } = useMessengerActions()

  function buildMessage(fields: LeadMessageFields): string {
    return buildLeadMessage(fields, {
      greeting: t('lead.message.greeting'),
      from: t('lead.message.from'),
      to: t('lead.message.to'),
      details: t('lead.message.details'),
    })
  }

  function deeplinkFor(method: ContactMethod, fields: LeadMessageFields): string {
    const message = buildMessage(fields)
    return buildMessengerDeeplink(method, message, {
      phone: links.value.phone,
      whatsapp: links.value.whatsapp,
      telegram: links.value.telegram,
      viber: links.value.viber,
    })
  }

  function openMessenger(
    method: ContactMethod,
    fields: LeadMessageFields,
    options?: { tab?: Window | null },
  ): Promise<CustomSchemeHandoffResult> | undefined {
    if (!isMessengerContactMethod(method)) {
      return undefined
    }

    const message = buildMessage(fields)
    const href = buildMessengerDeeplink(method, message, {
      phone: links.value.phone,
      whatsapp: links.value.whatsapp,
      telegram: links.value.telegram,
      viber: links.value.viber,
    })

    if (method === 'viber') {
      void navigator.clipboard.writeText(message).catch(() => {
        // Clipboard may be unavailable; user can still paste manually.
      })
    }

    trackClick(method)
    openExternalHref(href, options?.tab)

    if (method === 'viber') {
      return watchCustomSchemeHandoff()
    }

    return undefined
  }

  return {
    buildMessage,
    deeplinkFor,
    openMessenger,
    isMessengerContactMethod,
  }
}
