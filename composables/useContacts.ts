export type MessengerChannel = 'whatsapp' | 'telegram' | 'viber' | 'phone'

export interface ContactLinks {
  phone: string
  phoneHref: string
  email: string
  emailHref: string
  whatsapp: string
  telegram: string
  viber: string
}

const DEFAULT_PHONE = '+380000000000'

export function useContacts() {
  const config = useRuntimeConfig()

  const phone = computed(() => String(config.public.contactPhone || DEFAULT_PHONE))
  const email = computed(() => String(config.public.contactEmail || 'info@easywest.eu'))

  const links = computed<ContactLinks>(() => {
    const raw = phone.value.replace(/\s/g, '')
    const digits = raw.replace(/\D/g, '')
    return {
      phone: raw,
      phoneHref: `tel:${raw}`,
      email: email.value,
      emailHref: `mailto:${email.value}`,
      whatsapp: String(config.public.contactWhatsapp || `https://wa.me/${digits}`),
      telegram: String(config.public.contactTelegram || 'https://t.me/easywest'),
      viber: String(config.public.contactViber || `viber://chat?number=%2B${digits}`),
    }
  })

  function hrefFor(channel: MessengerChannel): string {
    switch (channel) {
      case 'whatsapp':
        return links.value.whatsapp
      case 'telegram':
        return links.value.telegram
      case 'viber':
        return links.value.viber
      case 'phone':
        return links.value.phoneHref
    }
  }

  return { phone, email, links, hrefFor }
}
