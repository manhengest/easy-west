import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LeadForm from '~/components/LeadForm.vue'

describe('LeadForm branches', () => {
  it('blocks submit when honeypot is filled', async () => {
    const wrapper = await mountSuspended(LeadForm, {
      props: { source: 'hero' },
    })

    const honeypot = wrapper.find('input[name="website"]')
    await honeypot.setValue('bot')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('success')).toBeUndefined()
  })

  it('shows phone field when phone contact method selected', async () => {
    const wrapper = await mountSuspended(LeadForm, {
      props: { source: 'hero' },
    })

    await wrapper.find('#lead-contact-method').setValue('phone')
    await nextTick()
    expect(wrapper.find('#lead-phone').exists()).toBe(true)
  })
})
