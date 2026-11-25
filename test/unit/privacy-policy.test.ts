import { describe, expect, it } from 'vitest'
import { privacyPolicyRu, privacyPolicyUa } from '~/constants/privacy-policy'

describe('privacy policy', () => {
  it('says a messenger click is kept on the site server for 30 days', () => {
    const text = JSON.stringify({ privacyPolicyUa, privacyPolicyRu })
    expect(text).toContain('до 30 днів')
    expect(text).toContain('до 30 дней')
  })
})
