import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mountComposable } from '../helpers/mountComposable'

const pushEvent = vi.fn()

mockNuxtImport('useGtm', () => () => ({
  pushEvent,
  grantAllConsent: vi.fn(),
  denyAllConsent: vi.fn(),
  enabled: false,
}))

function mockMessengerTab() {
  const tab = {
    closed: false,
    location: { href: '' },
    close: vi.fn(),
    opener: null as Window | null,
  }
  vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
}

describe('useLeadAttribution', () => {
  it('exposes hidden fields from cookie', async () => {
    const cookie = useCookie('ew_attribution')
    cookie.value = JSON.stringify({
      utmSource: 'google',
      utmMedium: 'cpc',
      landingPath: '/',
    })

    const { hiddenFields, gtmAttribution } = await mountComposable(() => useLeadAttribution())

    expect(hiddenFields.value.utmSource).toBe('google')
    expect(gtmAttribution.value.utm_source).toBe('google')
    expect(gtmAttribution.value.utm_medium).toBe('cpc')
  })
})

describe('useLeadForm', () => {
  beforeEach(() => {
    pushEvent.mockReset()
    mockMessengerTab()
  })

  it('submits with stub turnstile when site key is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      leadId: 'testlead01',
      receivedAt: new Date().toISOString(),
    })
    vi.stubGlobal('$fetch', fetchMock)

    const form = await mountComposable(() => useLeadForm('hero'))
    form.from.value = 'Kyiv'
    form.to.value = 'Warsaw'
    form.contactMethod.value = 'telegram'
    form.consentAccepted.value = true

    await form.onSubmit(new Event('submit'))

    expect(fetchMock).toHaveBeenCalled()
    expect(form.submitSuccess.value).toBe(true)
    expect(pushEvent).toHaveBeenCalledWith(
      'lead_submit_success',
      expect.objectContaining({ source: 'hero', contactMethod: 'telegram' }),
    )

    vi.unstubAllGlobals()
  })

  it('maps 403 to captcha error', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue({ statusCode: 403 }))

    const turnstileRef = ref({ enabled: true, token: 'token', reset: vi.fn() })
    const form = await mountComposable(() => useLeadForm('hero', turnstileRef))
    form.from.value = 'Kyiv'
    form.to.value = 'Warsaw'
    form.contactMethod.value = 'telegram'
    form.consentAccepted.value = true

    await form.onSubmit(new Event('submit'))

    expect(form.submitError.value).toBe('captcha')
    expect(turnstileRef.value.reset).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('submits phone contact method', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      ok: true,
      leadId: 'phonelead1',
      receivedAt: new Date().toISOString(),
    }))

    const form = await mountComposable(() => useLeadForm('cta'))
    form.from.value = 'Kyiv'
    form.to.value = 'Warsaw'
    form.contactMethod.value = 'phone'
    form.phone.value = '+380 93 321 88 99'
    form.consentAccepted.value = true

    await form.onSubmit(new Event('submit'))

    expect(form.submitSuccess.value).toBe(true)
    vi.unstubAllGlobals()
  })

  it('maps generic errors to submit failure', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue({ statusCode: 500 }))
    const turnstileRef = ref({ enabled: false, token: '', reset: vi.fn() })

    const form = await mountComposable(() => useLeadForm('hero', turnstileRef))
    form.from.value = 'Kyiv'
    form.to.value = 'Warsaw'
    form.contactMethod.value = 'telegram'
    form.consentAccepted.value = true

    await form.onSubmit(new Event('submit'))

    expect(form.submitError.value).toBe('submit')
    vi.unstubAllGlobals()
  })
})

describe('useLeadMessenger', () => {
  it('builds deeplink from contacts config', async () => {
    const { deeplinkFor } = await mountComposable(() => useLeadMessenger())
    const href = deeplinkFor('whatsapp', { from: 'A', to: 'B' })
    expect(href).toContain('wa.me')
    expect(href).toContain('text=')
  })

  it('returns Viber handoff promise without showing toast', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })

    const { openMessenger } = await mountComposable(() => useLeadMessenger())
    const handoff = openMessenger('viber', { from: 'A', to: 'B' })

    expect(handoff).toBeInstanceOf(Promise)
    const { toast } = useToast()
    expect(toast.value).toBeNull()

    vi.unstubAllGlobals()
  })
})
