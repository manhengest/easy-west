import { describe, expect, it } from 'vitest'
import { LEAD_ID_PATTERN, mintLeadId } from '~/shared/lead-id'
import {
  MESSENGER_LEAD_TTL_MS,
  decideMessengerClick,
  isTaggedTouch,
  messengerTouchKey,
  normalizeMessengerLeadStore,
  withCardId,
  withTouchKey,
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
    touchKey: messengerTouchKey({ utmSource: 'google', gclid: 'click-a' }),
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
      lastTouch: { utmSource: 'google', gclid: 'click-a' },
      mintId: () => 'abc1234567',
    })

    expect(decision.kind).toBe('mint')
    expect(decision.leadId).toBe('abc1234567')
    expect(decision.putLastTouch).toBe(false)
    expect(decision.store.telegram).toEqual({
      leadId: 'abc1234567',
      clickedAt: CLICKED_AT,
      touchKey: messengerTouchKey({ utmSource: 'google', gclid: 'click-a' }),
    })
  })

  it('reopens the same lead for the same channel inside 30 days', () => {
    const store: MessengerLeadStore = { telegram: lead({ cardId: 15 }) }
    const decision = decideMessengerClick({
      store,
      channel: 'telegram',
      now: WITHIN_30_DAYS,
      lastTouch: { utmSource: 'google', gclid: 'click-a' },
      mintId: () => 'should-not-run',
    })

    expect(decision).toMatchObject({
      kind: 'reopen',
      leadId: 'abc1234567',
      cardId: 15,
      putLastTouch: false,
      retryCreate: false,
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
      store: { viber: lead({ cardId: 15 }) },
      channel: 'viber',
      now: AT_30_DAYS,
      mintId: () => 'def9876543',
    })

    expect(decision.kind).toBe('mint')
    expect(decision.leadId).toBe('def9876543')
    expect(decision.store.viber?.clickedAt).toBe(new Date(AT_30_DAYS).toISOString())
  })

  it('asks for a last-touch update when a new tagged visit has a card id', () => {
    const decision = decideMessengerClick({
      store: { telegram: lead({ cardId: 15 }) },
      channel: 'telegram',
      now: WITHIN_30_DAYS,
      lastTouch: { utmSource: 'facebook', utmMedium: 'cpc', fbclid: 'click-b' },
    })

    expect(decision.putLastTouch).toBe(true)
    expect(decision.cardId).toBe(15)
    expect(decision.leadId).toBe('abc1234567')
    expect(decision.writeStore).toBe(false)
  })

  it('retries the same lead while the KeyCRM id is still missing', () => {
    const decision = decideMessengerClick({
      store: { telegram: lead() },
      channel: 'telegram',
      now: WITHIN_30_DAYS,
      lastTouch: { utmSource: 'facebook', fbclid: 'click-b' },
    })

    expect(decision.kind).toBe('reopen')
    expect(decision.retryCreate).toBe(true)
    expect(decision.putLastTouch).toBe(false)
    expect(decision.cardId).toBeUndefined()
    expect(decision.leadId).toBe('abc1234567')
  })

  it('does not overwrite the card on a direct visit', () => {
    const decision = decideMessengerClick({
      store: { telegram: lead({ cardId: 15, touchKey: '' }) },
      channel: 'telegram',
      now: WITHIN_30_DAYS,
      lastTouch: { utmSource: 'direct', utmMedium: 'direct' },
    })

    expect(decision.putLastTouch).toBe(false)
    expect(isTaggedTouch({ utmSource: 'news.example', utmMedium: 'referral' })).toBe(false)
    expect(isTaggedTouch({ utmSource: 'google', utmMedium: 'cpc' })).toBe(true)
  })
})

describe('messenger lead cookie', () => {
  it('drops a broken record and keeps a numeric card id', () => {
    const store = normalizeMessengerLeadStore(JSON.stringify({
      telegram: { leadId: 'nope', clickedAt: CLICKED_AT },
      whatsapp: { leadId: 'abc1234567', clickedAt: CLICKED_AT, cardId: '15' },
    }))

    expect(store.telegram).toBeUndefined()
    expect(store.whatsapp?.cardId).toBe(15)
  })

  it('stores the card id without moving the first click time', () => {
    const store: MessengerLeadStore = { telegram: lead() }
    const next = withCardId(store, 'telegram', 'abc1234567', 15)

    expect(next?.telegram).toEqual({ ...lead(), cardId: 15 })
    expect(withCardId(store, 'telegram', 'otherlead1', 15)).toBeNull()
  })

  it('stores the sent touch without moving the first click time', () => {
    const store: MessengerLeadStore = { telegram: lead({ cardId: 15 }) }
    const next = withTouchKey(store, 'telegram', 'abc1234567', 'facebook')

    expect(next?.telegram?.clickedAt).toBe(CLICKED_AT)
    expect(next?.telegram?.touchKey).toBe('facebook')
    expect(next?.telegram?.cardId).toBe(15)
  })
})
