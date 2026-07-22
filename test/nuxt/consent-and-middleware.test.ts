import { defineComponent } from 'vue'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { mountComposable } from '../helpers/mountComposable'

const pushEvent = vi.fn()
const grantAllConsent = vi.fn()
const denyAllConsent = vi.fn()

mockNuxtImport('useGtm', () => () => ({
  pushEvent,
  grantAllConsent,
  denyAllConsent,
  enabled: true,
}))

describe('useConsent', () => {
  beforeEach(() => {
    pushEvent.mockReset()
    grantAllConsent.mockReset()
    denyAllConsent.mockReset()
    useCookie('ew_analytics_consent').value = null
  })

  it('acceptAll stores granted consent', async () => {
    const TestComponent = defineComponent({
      setup() {
        const { acceptAll } = useConsent()
        return { acceptAll }
      },
      template: '<button @click="acceptAll">accept</button>',
    })

    const wrapper = await mountSuspended(TestComponent)
    await wrapper.find('button').trigger('click')

    expect(useCookie('ew_analytics_consent').value).toBe('granted')
    expect(grantAllConsent).toHaveBeenCalled()
  })

  it('rejectAll stores denied consent', async () => {
    const { rejectAll, consent } = await mountComposable(() => useConsent())
    rejectAll()
    expect(consent.value).toBe('denied')
    expect(denyAllConsent).toHaveBeenCalled()
  })
})

describe('useGtm', () => {
  beforeEach(() => {
    ;(window as unknown as { dataLayer: unknown[] }).dataLayer = []
  })

  it('pushes events to dataLayer', async () => {
    const { pushEvent: push } = await mountComposable(() => useGtm())
    push('test_event', { foo: 'bar' })
    expect(pushEvent).toHaveBeenCalledWith('test_event', { foo: 'bar' })
  })
})

describe('useContacts', () => {
  it('builds contact links from runtime config', async () => {
    const { links, hrefFor } = await mountComposable(() => useContacts())
    expect(links.value.phone).toContain('380')
    expect(hrefFor('telegram')).toContain('t.me')
    expect(hrefFor('viber')).toContain('viber://')
  })
})

describe('useToast', () => {
  it('shows and dismisses toast', async () => {
    vi.useFakeTimers()
    const { toast, show, dismiss } = await mountComposable(() => useToast())
    show({ message: 'Hello' })
    expect(toast.value?.visible).toBe(true)
    dismiss()
    expect(toast.value?.visible).toBe(false)
    vi.useRealTimers()
  })
})

describe('useMessengerLink', () => {
  beforeEach(() => {
    pushEvent.mockReset()
  })

  it('tracks messenger clicks', async () => {
    const { open, trackDirectClick } = await mountComposable(() => useMessengerLink('phone'))
    vi.spyOn(window, 'open').mockReturnValue(null)
    open()
    trackDirectClick()
    expect(pushEvent).toHaveBeenCalledWith('click_phone', { channel: 'phone' })
  })
})
