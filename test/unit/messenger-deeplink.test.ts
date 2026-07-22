import { describe, expect, it } from 'vitest'
import {
  buildLeadMessage,
  buildMessengerDeeplink,
  isMessengerContactMethod,
} from '~/shared/messenger-deeplink'

const lines = {
  greeting: 'Hello',
  from: 'From:',
  to: 'To:',
  details: 'Details:',
}

const links = {
  phone: '+380933218899',
  whatsapp: 'https://wa.me/380933218899',
  telegram: 'https://t.me/easywestdelivery',
  viber: 'viber://chat?number=380933218899',
}

describe('buildLeadMessage', () => {
  it('builds multiline message with optional details', () => {
    const message = buildLeadMessage(
      { from: 'Kyiv', to: 'Warsaw', details: 'Fragile items' },
      lines,
    )
    expect(message).toBe('Hello\nFrom: Kyiv\nTo: Warsaw\nDetails: Fragile items')
  })

  it('omits empty details', () => {
    const message = buildLeadMessage({ from: 'Kyiv', to: 'Warsaw' }, lines)
    expect(message).toBe('Hello\nFrom: Kyiv\nTo: Warsaw')
  })
})

describe('buildMessengerDeeplink', () => {
  const message = 'Test message'

  it('builds WhatsApp deeplink', () => {
    const href = buildMessengerDeeplink('whatsapp', message, links)
    expect(href).toBe(`https://wa.me/380933218899?text=${encodeURIComponent(message)}`)
  })

  it('builds Telegram deeplink with username', () => {
    const href = buildMessengerDeeplink('telegram', message, links)
    expect(href).toBe(`https://t.me/easywestdelivery?text=${encodeURIComponent(message)}`)
  })

  it('builds Viber deeplink', () => {
    const href = buildMessengerDeeplink('viber', message, links)
    expect(href).toBe('viber://chat?number=%2B380933218899')
  })

  it('builds tel link for phone method with tel prefix', () => {
    const href = buildMessengerDeeplink('phone', message, {
      ...links,
      phone: 'tel:+380933218899',
    })
    expect(href).toBe('tel:+380933218899')
  })

  it('falls back to phone digits for malformed viber URL', () => {
    const href = buildMessengerDeeplink('viber', message, {
      ...links,
      viber: 'not-a-url',
    })
    expect(href).toContain('viber://chat?number=')
  })

  it('parses telegram username from bare domain string', () => {
    const href = buildMessengerDeeplink('telegram', message, {
      ...links,
      telegram: 't.me/customuser',
    })
    expect(href).toContain('t.me/customuser')
  })

  it('appends text param for telegram share URLs', () => {
    const href = buildMessengerDeeplink('telegram', message, {
      ...links,
      telegram: 'https://t.me/share/url?url=https://easy-west.com',
    })
    expect(href).toContain('text=')
  })
})

describe('isMessengerContactMethod', () => {
  it('returns true for messenger channels', () => {
    expect(isMessengerContactMethod('telegram')).toBe(true)
    expect(isMessengerContactMethod('whatsapp')).toBe(true)
    expect(isMessengerContactMethod('viber')).toBe(true)
  })

  it('returns false for phone', () => {
    expect(isMessengerContactMethod('phone')).toBe(false)
  })
})
