import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mountComposable } from '../helpers/mountComposable'
import type { MessengerLeadStore } from '~/shared/messenger-lead'

const pushEvent = vi.fn()
const fetchMock = vi.fn()

mockNuxtImport('useGtm', () => () => ({
  pushEvent,
  grantAllConsent: vi.fn(),
  denyAllConsent: vi.fn(),
  enabled: false,
}))

function clickDraft(leadId: string): string {
  return [
    'Добрий день! Хочу замовити переїзд.',
    '--- службове поле ---',
    `Номер заявки: ${leadId}`,
  ].join('\n')
}

function leadIdFromDraft(text: string): string {
  const match = text.match(/Номер заявки: ([0-9a-f]{10})$/)
  if (!match?.[1]) {
    throw new Error(`lead number missing in draft: ${text}`)
  }
  return match[1]
}

describe('messenger click lead', () => {
  beforeEach(() => {
    pushEvent.mockReset()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true, leadId: 'ignored' })
    vi.stubGlobal('$fetch', fetchMock)
    useCookie('ew_messenger_lead').value = null
    useCookie('ew_attribution').value = null
    vi.spyOn(window, 'open').mockReturnValue({ closed: false } as Window)
  })

  it('opens the chat with greeting, service field, lead number and posts every click', async () => {
    const { openMessenger } = await mountComposable(() => useMessengerActions())
    openMessenger('telegram', 'footer')

    const href = String(vi.mocked(window.open).mock.calls[0]?.[0])
    const text = new URL(href).searchParams.get('text') ?? ''
    const leadId = leadIdFromDraft(text)
    expect(text).toBe(clickDraft(leadId))
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
    expect(fetchMock).toHaveBeenCalledWith('/api/messenger-leads', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ leadId, channel: 'telegram' }),
    }))
    expect(second).toBe(clickDraft(leadId))
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

  it('posts the same lead again when the cookie still has an old card id', async () => {
    useCookie('ew_messenger_lead').value = JSON.stringify({
      whatsapp: {
        leadId: 'abc1234567',
        clickedAt: new Date().toISOString(),
        cardId: 15,
      },
    })

    const { openMessenger } = await mountComposable(() => useMessengerActions())
    openMessenger('whatsapp', 'hero')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/messenger-leads', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        leadId: 'abc1234567',
        channel: 'whatsapp',
      }),
    }))
    const href = String(vi.mocked(window.open).mock.calls.at(-1)?.[0])
    expect(new URL(href).searchParams.get('text')).toBe(clickDraft('abc1234567'))
  })

  it('does not post a card for a phone click', async () => {
    const { open } = await mountComposable(() => useMessengerLink('phone'))
    open()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(pushEvent).toHaveBeenCalledWith('click_phone', { channel: 'phone' })
  })
})
