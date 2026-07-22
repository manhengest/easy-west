import { describe, expect, it } from 'vitest'
import { mountComposable } from '../helpers/mountComposable'

describe('useLeadAttribution (branches)', () => {
  it('parses string cookie JSON', async () => {
    useCookie('ew_attribution').value = JSON.stringify({
      utmSource: 'email',
      landingPath: '/promo',
    })

    const { attribution } = await mountComposable(() => useLeadAttribution())
    expect(attribution.value?.utmSource).toBe('email')
  })

  it('ignores invalid cookie JSON', async () => {
    useCookie('ew_attribution').value = '{not-json'

    const { attribution } = await mountComposable(() => useLeadAttribution())
    expect(attribution.value).toBeNull()
  })

  it('skips capture when no incoming UTM and cookie exists', async () => {
    useCookie('ew_attribution').value = { utmSource: 'existing' }
    await navigateTo('/')

    const { captureFromQuery, attribution } = await mountComposable(() => useLeadAttribution())
    captureFromQuery()
    expect(attribution.value?.utmSource).toBe('existing')
  })
})
