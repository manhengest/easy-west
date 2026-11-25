import { describe, expect, it } from 'vitest'
import { LEAD_ID_PATTERN, mintLeadId } from '~/shared/lead-id'
import {
  MESSENGER_LEAD_TTL_MS,
  decideMessengerClick,
  isTaggedTouch,
  normalizeMessengerLeadStore,
  type MessengerChannelLead,
  type MessengerLeadStore,
} from '~/shared/messenger-lead'

const CLICKED_AT = '2026-10-01T00:00:00.000Z'
const WITHIN_30_DAYS = Date.parse('2026-10-30T00:00:00.000Z')
const AT_30_DAYS = Date.parse(CLICKED_AT) + MESSENGER_LEAD_TTL_MS

function lead(overrides: Partial<MessengerChannelLead> = {}): MessengerChannelLead {
  return {
    leadId: 'abc1234567',
    clickedAt: CLICKED_AT,
    ...overrides,
  }
}

describe('mintLeadId', () => {
  it('matches the 10 hex characters stored on the form card', () => {
    expect(mintLeadId()).toMatch(LEAD_ID_PATTERN)
  })
})

describe('decideMessengerClick', () => {
  it('mints one lead and keeps the first click time', () => {
    const decision = decideMessengerClick({
      store: null,
      channel: 'telegram',
      now: Date.parse(CLICKED_AT),
      mintId: () => 'abc1234567',
    })

    expect(decision.kind).toBe('mint')
    expect(decision.leadId).toBe('abc1234567')
    expect(decision.writeStore).toBe(true)
    expect(decision.store.telegram).toEqual({
      leadId: 'abc1234567',
      clickedAt: CLICKED_AT,
    })
  })

  it('reopens the same lead for the same channel inside 30 days', () => {
    const store: MessengerLeadStore = { telegram: lead() }
    const decision = decideMessengerClick({
      store,
      channel: 'telegram',
      now: WITHIN_30_DAYS,
      mintId: () => 'should-not-run',
    })

    expect(decision).toMatchObject({
      kind: 'reopen',
      leadId: 'abc1234567',
      writeStore: false,
    })
    expect(decision.store.telegram?.clickedAt).toBe(CLICKED_AT)
  })

  it('mints a separate lead for another channel', () => {
    const decision = decideMessengerClick({
      store: { telegram: lead() },
      channel: 'whatsapp',
      now: WITHIN_30_DAYS,
      mintId: () => 'def9876543',
    })

    expect(decision.kind).toBe('mint')
    expect(decision.leadId).toBe('def9876543')
    expect(decision.store.telegram?.leadId).toBe('abc1234567')
    expect(decision.store.whatsapp?.leadId).toBe('def9876543')
  })

  it('mints again once the first click is 30 days old', () => {
    const decision = decideMessengerClick({
      store: { viber: lead() },
      channel: 'viber',
      now: AT_30_DAYS,
      mintId: () => 'def9876543',
    })

    expect(decision.kind).toBe('mint')
    expect(decision.leadId).toBe('def9876543')
    expect(decision.store.viber?.clickedAt).toBe(new Date(AT_30_DAYS).toISOString())
  })
})

describe('isTaggedTouch', () => {
  it('ignores a referral and keeps a tagged campaign', () => {
    expect(isTaggedTouch({ utmSource: 'news.example', utmMedium: 'referral' })).toBe(false)
    expect(isTaggedTouch({ utmSource: 'google', utmMedium: 'cpc' })).toBe(true)
  })
})

describe('messenger lead cookie', () => {
  it('drops a broken record and ignores a stored card id', () => {
    const store = normalizeMessengerLeadStore(JSON.stringify({
      telegram: { leadId: 'nope', clickedAt: CLICKED_AT },
      whatsapp: { leadId: 'abc1234567', clickedAt: CLICKED_AT, cardId: '15' },
    }))

    expect(store.telegram).toBeUndefined()
    expect(store.whatsapp).toEqual({ leadId: 'abc1234567', clickedAt: CLICKED_AT })
  })
})
