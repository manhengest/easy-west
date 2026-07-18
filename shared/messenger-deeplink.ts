import type { ContactMethod } from './lead-constants'

export interface LeadMessageFields {
  from: string
  to: string
  details?: string
}

export interface LeadMessageLines {
  greeting: string
  from: string
  to: string
  details: string
}

export interface ContactLinkSources {
  phone: string
  whatsapp: string
  telegram: string
  viber: string
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function extractTelegramUsername(telegramUrl: string): string | null {
  try {
    const url = new URL(telegramUrl)
    const path = url.pathname.replace(/^\/+/, '')
    if (!path || path === 'share' || path === 'joinchat') {
      return null
    }
    return path.split('/')[0] ?? null
  }
  catch {
    const match = telegramUrl.match(/(?:t\.me|telegram\.me)\/([^/?#]+)/i)
    return match?.[1] ?? null
  }
}

function extractWhatsappDigits(whatsappUrl: string, fallbackPhone: string): string {
  const fromUrl = extractDigits(whatsappUrl)
  if (fromUrl.length >= 10) {
    return fromUrl
  }
  return extractDigits(fallbackPhone)
}

function extractViberNumber(viberUrl: string, fallbackPhone: string): string {
  try {
    const url = new URL(viberUrl)
    const number = url.searchParams.get('number')
    if (number) {
      return extractDigits(number)
    }
  }
  catch {
    const match = viberUrl.match(/number=([^&]+)/i)
    if (match?.[1]) {
      return extractDigits(decodeURIComponent(match[1]))
    }
  }
  return extractDigits(fallbackPhone)
}

export function buildLeadMessage(
  fields: LeadMessageFields,
  lines: LeadMessageLines,
): string {
  const parts = [
    lines.greeting,
    `${lines.from} ${fields.from.trim()}`,
    `${lines.to} ${fields.to.trim()}`,
  ]

  const details = fields.details?.trim()
  if (details) {
    parts.push(`${lines.details} ${details}`)
  }

  return parts.join('\n')
}

export function buildMessengerDeeplink(
  method: ContactMethod,
  message: string,
  links: ContactLinkSources,
): string {
  const encoded = encodeURIComponent(message)

  switch (method) {
    case 'whatsapp': {
      const digits = extractWhatsappDigits(links.whatsapp, links.phone)
      return `https://wa.me/${digits}?text=${encoded}`
    }
    case 'telegram': {
      const username = extractTelegramUsername(links.telegram)
      if (username) {
        return `https://t.me/${username}?text=${encoded}`
      }
      return `${links.telegram}${links.telegram.includes('?') ? '&' : '?'}text=${encoded}`
    }
    case 'viber': {
      const digits = extractViberNumber(links.viber, links.phone)
      return `viber://chat?number=%2B${digits}`
    }
    case 'phone':
      return links.phone.startsWith('tel:') ? links.phone : `tel:${links.phone.replace(/\s/g, '')}`
  }
}

export function isMessengerContactMethod(method: ContactMethod): boolean {
  return method === 'telegram' || method === 'whatsapp' || method === 'viber'
}
