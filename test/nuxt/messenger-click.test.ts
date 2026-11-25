import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mountComposable } from '../helpers/mountComposable'
import { messengerTouchKey, type MessengerLeadStore } from '~/shared/messenger-lead'

const pushEvent = vi.fn()
const fetchMock = vi.fn()

mockNuxtImport('useGtm', () => () => ({
  pushEvent,
  grantAllConsent: vi.fn(),
  denyAllConsent: vi.fn(),
  enabled: false,
}))

describe('messenger click lead', () => {
  beforeEach(() => {
    pushEvent.mockReset()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true, cardId: 15, leadId: 'ignored' })
    vi.stubGlobal('$fetch', fetchMock)
    useCookie('ew_messenger_lead').value = null
    useCookie('ew_attribution').value = null
    vi.spyOn(window, 'open').mockReturnValue({ closed: false } as Window)
  })

  it('opens the chat with a new lead id and posts one card', async () => {
    const { openMessenger } = await mountComposable(() => useMessengerActions())
    openMessenger('telegram', 'footer')

    const href = String(vi.mocked(window.open).mock.calls[0]?.[0])
    const leadId = new URL(href).searchParams.get('text')?.split('\n')[0] ?? ''
    expect(leadId).toMatch(/^[0-9a-f]{10}$/)
    expect(fetchMock).toHaveBeenCalledWith('/api/messenger-leads', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        leadId,
        channel: 'telegram',
        source: 'footer',
      }),
    }))
    expect(pushEvent).toHaveBeenCalledWith('click_telegram', { channel: 'telegram' })
    expect(pushEvent).not.toHaveBeenCalledWith('lead_submit_success', expect.anything())

    await Promise.resolve()
    await Promise.resolve()

    fetchMock.mockClear()
    openMessenger('telegram', 'footer')
    const second = new URL(String(vi.mocked(window.open).mock.calls.at(-1)?.[0])).searchParams.get('text')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(second).toBe(`${leadId}\nTelegram`)
  })

  it('retries the same lead when the KeyCRM card id is still missing', async () => {
    useCookie<MessengerLeadStore>('ew_messenger_lead').value = {
      telegram: {
        leadId: 'abc1234567',
        clickedAt: new Date().toISOString(),
      },
    }

    const { openMessenger } = await mountComposable(() => useMessengerActions())
    openMessenger('telegram', 'hero')

    expect(fetchMock).toHaveBeenCalledWith('/api/messenger-leads', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        leadId: 'abc1234567',
        channel: 'telegram',
        source: 'hero',
      }),
    }))
  })

  it('puts a new tagged last touch on the stored card', async () => {
    const previous = { utmSource: 'google', utmMedium: 'cpc', gclid: 'click-a' }
    const next = { utmSource: 'facebook', utmMedium: 'cpc', fbclid: 'click-b' }
    useCookie('ew_attribution').value = JSON.stringify({ first: previous, last: next })
    useCookie<MessengerLeadStore>('ew_messenger_lead').value = {
      whatsapp: {
        leadId: 'abc1234567',
        clickedAt: new Date().toISOString(),
        cardId: 15,
        touchKey: messengerTouchKey(previous),
      },
    }

    const { openMessenger } = await mountComposable(() => useMessengerActions())
    openMessenger('whatsapp', 'hero')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/messenger-leads', expect.objectContaining({
      method: 'PUT',
      body: expect.objectContaining({
        cardId: 15,
        leadId: 'abc1234567',
        utmSource: 'facebook',
        fbclid: 'click-b',
      }),
    }))
    const href = vi.mocked(window.open).mock.calls.at(-1)?.[0]
    expect(href).toContain(encodeURIComponent('abc1234567'))
  })

  it('does not post a card for a phone click', async () => {
    const { open } = await mountComposable(() => useMessengerLink('phone'))
    open()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(pushEvent).toHaveBeenCalledWith('click_phone', { channel: 'phone' })
  })
})
