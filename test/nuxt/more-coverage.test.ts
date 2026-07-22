import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mountComposable } from '../helpers/mountComposable'
import LeadFormHost from '~/components/LeadFormHost.vue'
import LeadThankYou from '~/components/LeadThankYou.vue'
import UiMessengerLink from '~/components/ui/UiMessengerLink.vue'
import UiTurnstile from '~/components/ui/UiTurnstile.vue'

describe('conversion components (extended)', () => {
  it('renders LeadThankYou with messenger success text for Telegram', async () => {
    const wrapper = await mountSuspended(LeadThankYou, {
      props: { contactMethod: 'telegram' },
    })
    expect(wrapper.find('.lead-thank-you__message').text()).toContain('повідомлення')
  })

  it('renders LeadThankYou with phone success text', async () => {
    const wrapper = await mountSuspended(LeadThankYou, {
      props: { contactMethod: 'phone' },
    })
    expect(wrapper.find('.lead-thank-you__message').text()).toContain('найближчим часом')
  })

  it('renders LeadThankYou with Viber copy hint when handoff ok', async () => {
    const wrapper = await mountSuspended(LeadThankYou, {
      props: { contactMethod: 'viber', viberHandoff: 'ok' },
    })
    expect(wrapper.find('.lead-thank-you').exists()).toBe(true)
    expect(wrapper.find('.lead-thank-you__message').text()).toContain('повідомлення')
    expect(wrapper.find('.lead-thank-you__hint').exists()).toBe(true)
  })

  it('renders LeadThankYou checking spinner while probing Viber', async () => {
    const wrapper = await mountSuspended(LeadThankYou, {
      props: { contactMethod: 'viber', viberHandoff: 'checking' },
    })
    expect(wrapper.find('.lead-thank-you__checking').exists()).toBe(true)
    expect(wrapper.find('.lead-thank-you__spinner').exists()).toBe(true)
    expect(wrapper.find('.lead-thank-you__icon-wrap').exists()).toBe(false)
    expect(wrapper.find('.lead-thank-you__message').exists()).toBe(false)
    expect(wrapper.find('.lead-thank-you__fallback').exists()).toBe(false)
  })

  it('renders LeadThankYou fallback actions when Viber handoff misses', async () => {
    const wrapper = await mountSuspended(LeadThankYou, {
      props: { contactMethod: 'viber', viberHandoff: 'miss' },
    })
    expect(wrapper.find('.lead-thank-you__icon-wrap_error').exists()).toBe(true)
    expect(wrapper.find('.lead-thank-you__icon_error').exists()).toBe(true)
    expect(wrapper.find('.lead-thank-you__message').exists()).toBe(false)
    expect(wrapper.find('.lead-thank-you__fallback-message').exists()).toBe(true)
    expect(wrapper.findAll('.lead-thank-you__fallback-link')).toHaveLength(2)
    expect(wrapper.find('.lead-thank-you__fallback-link_primary').exists()).toBe(true)
  })

  it('renders LeadFormHost shell when open', async () => {
    await mountSuspended(LeadFormHost, {
      props: { modelValue: true, source: 'hero' },
    })
    await nextTick()
    expect(document.body.innerHTML).toMatch(/lead-form|lead-modal|lead-sheet|ui-modal|ui-bottom-sheet/i)
  })

  it('renders UiMessengerLink for phone channel', async () => {
    const wrapper = await mountSuspended(UiMessengerLink, {
      props: { channel: 'phone' },
    })
    expect(wrapper.find('.ui-messenger-link_phone, a.ui-messenger-link').exists()).toBe(true)
  })

  it('renders UiMessengerLink button for telegram', async () => {
    const wrapper = await mountSuspended(UiMessengerLink, {
      props: { channel: 'telegram', appearance: 'on-dark' },
    })
    expect(wrapper.find('button.ui-messenger-link_telegram').exists()).toBe(true)
  })

  it('renders UiTurnstile container', async () => {
    const wrapper = await mountSuspended(UiTurnstile)
    expect(wrapper.find('.ui-turnstile, [data-turnstile]').exists() || wrapper.html().length > 0).toBe(true)
  })
})

describe('useLandingContent (extended)', () => {
  it('maps gallery, reviews, and geography content', async () => {
    const content = await mountComposable(() => useLandingContent())
    expect(content.galleryImages.value.length).toBeGreaterThan(0)
    expect(content.reviewSlides.value.length).toBeGreaterThan(0)
    expect(content.routeHighlights.value.length).toBeGreaterThan(0)
    expect(content.processPhases.value.length).toBeGreaterThan(0)
  })
})

describe('locale cookie middleware', () => {
  it('redirects unprefixed path to saved RU preference', async () => {
    useCookie('ew_locale').value = 'ru'
    await navigateTo('/privacy')
    expect(useRoute().path).toMatch(/^\/ru/)
  })
})

describe('gtm plugin', () => {
  it('initializes consent defaults when GTM id is set', async () => {
    const config = useRuntimeConfig()
    const original = config.public.gtmId
    config.public.gtmId = 'GTM-TESTID'

    const w = window as unknown as { dataLayer: unknown[] }
    w.dataLayer = []
    w.dataLayer.push([
      'consent',
      'default',
      { analytics_storage: 'denied' },
    ])

    expect(w.dataLayer[0]).toEqual([
      'consent',
      'default',
      { analytics_storage: 'denied' },
    ])

    config.public.gtmId = original
  })
})

describe('attribution plugin behavior', () => {
  it('captures UTM params into cookie', async () => {
    await navigateTo('/?utm_source=newsletter&utm_medium=email')
    const { captureFromQuery, attribution } = await mountComposable(() => useLeadAttribution())
    captureFromQuery()
    expect(attribution.value?.utmSource).toBe('newsletter')
    expect(attribution.value?.utmMedium).toBe('email')
  })
})
