const VIBER_DOWNLOAD_URL = 'https://www.viber.com/download/'

export function useViberFallbackToast() {
  const { t } = useI18n()
  const { hrefFor } = useContacts()
  const { show } = useToast()
  const { pushEvent } = useGtm()

  function showViberFallbackToast() {
    pushEvent('viber_handoff_miss')
    show({
      message: t('contacts.viberFallback.message'),
      actions: [
        {
          label: t('contacts.viberFallback.download'),
          href: VIBER_DOWNLOAD_URL,
        },
        {
          label: t('contacts.viberFallback.telegram'),
          href: hrefFor('telegram'),
        },
      ],
    })
  }

  return { showViberFallbackToast }
}
