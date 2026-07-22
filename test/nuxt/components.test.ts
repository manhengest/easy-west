import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mountComposable } from '../helpers/mountComposable'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiToastHost from '~/components/ui/UiToastHost.vue'
import LocaleSwitcher from '~/components/layout/LocaleSwitcher.vue'
import CookieBanner from '~/components/CookieBanner.vue'
import LeadForm from '~/components/LeadForm.vue'

describe('conversion UI components', () => {
  it('renders UiButton with variant class', async () => {
    const wrapper = await mountSuspended(UiButton, {
      slots: { default: 'Submit' },
      props: { variant: 'primary' },
    })
    expect(wrapper.text()).toContain('Submit')
    expect(wrapper.classes()).toContain('ui-button_primary')
  })

  it('renders UiInput with label and error', async () => {
    const wrapper = await mountSuspended(UiInput, {
      props: {
        modelValue: '',
        name: 'from',
        inputId: 'test-from',
        label: 'From city',
        error: 'Required',
      },
    })
    expect(wrapper.text()).toContain('From city')
    expect(wrapper.text()).toContain('Required')
  })

  it('renders UiTextarea', async () => {
    const wrapper = await mountSuspended(UiTextarea, {
      props: {
        modelValue: 'details',
        name: 'details',
        inputId: 'test-details',
        label: 'Details',
      },
    })
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('renders UiSelect options', async () => {
    const wrapper = await mountSuspended(UiSelect, {
      props: {
        modelValue: 'telegram',
        name: 'method',
        selectId: 'test-method',
        label: 'Method',
        options: [{ value: 'telegram', label: 'Telegram' }],
      },
    })
    expect(wrapper.text()).toContain('Telegram')
  })

  it('renders LocaleSwitcher links', async () => {
    const wrapper = await mountSuspended(LocaleSwitcher)
    expect(wrapper.text()).toMatch(/UA|RU|УК|РУ/i)
  })

  it('renders LeadForm fields', async () => {
    const wrapper = await mountSuspended(LeadForm, {
      props: { source: 'hero' },
    })
    expect(wrapper.find('form.lead-form').exists()).toBe(true)
    expect(wrapper.find('#lead-from').exists()).toBe(true)
    expect(wrapper.find('#lead-to').exists()).toBe(true)
  })

  it('renders CookieBanner when consent missing', async () => {
    const cookie = useCookie('ew_analytics_consent')
    cookie.value = null

    const wrapper = await mountSuspended(CookieBanner)
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('cookie-banner')
    }, { timeout: 3000 })
  })

  it('renders UiToastHost', async () => {
    await mountSuspended(UiToastHost)
    const toastApi = await mountComposable(() => useToast())
    toastApi.show({ message: 'Toast message' })
    await nextTick()
    expect(document.body.textContent).toContain('Toast message')
  })
})
