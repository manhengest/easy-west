import { describe, expect, it } from 'vitest'
import { MATCH_WINDOW_MS, matchPendingLead, pendingFromClick, type PendingLead } from '~/shared/pending-lead'
import type { MessengerLeadPayload } from '~/shared/lead-schema'

const CREATED = '2026-11-25T06:16:50.000Z'
const CREATED_MS = Date.parse(CREATED)

function click(overrides: Partial<MessengerLeadPayload> = {}): MessengerLeadPayload {
  return {
    leadId: 'abc1234567',
    channel: 'telegram',
    source: 'hero',
    locale: 'ua',
    device: 'mobile',
    utmSource: 'google',
    utmMedium: 'cpc',
    gclid: 'click-a',
    ...overrides,
  }
}

function record(overrides: Partial<PendingLead> = {}): PendingLead {
  return {
    ...pendingFromClick(click(), new Date(CREATED_MS - 5 * 60 * 1000).toISOString()),
    ...overrides,
  }
}

describe('matchPendingLead', () => {
  it('returns the one unbound lead on the same channel inside 15 minutes', () => {
    const match = matchPendingLead([record()], { channel: 'telegram', createdAt: CREATED })
    expect(match?.leadId).toBe('abc1234567')
  })

  it('counts the window from the last click, including the 15 minute boundary', () => {
    const onEdge = record({ lastTouchAt: new Date(CREATED_MS - MATCH_WINDOW_MS).toISOString() })
    const tooOld = record({
      leadId: 'bbbbbbbbbb',
      lastTouchAt: new Date(CREATED_MS - MATCH_WINDOW_MS - 1).toISOString(),
    })
    const afterCard = record({
      leadId: 'cccccccccc',
      lastTouchAt: new Date(CREATED_MS + 1).toISOString(),
    })

    expect(matchPendingLead([onEdge], { channel: 'telegram', createdAt: CREATED })?.leadId).toBe('abc1234567')
    expect(matchPendingLead([tooOld], { channel: 'telegram', createdAt: CREATED })).toBeNull()
    expect(matchPendingLead([afterCard], { channel: 'telegram', createdAt: CREATED })).toBeNull()
  })

  it('returns null when nobody clicked, the channel differs, or the lead is already attached', () => {
    expect(matchPendingLead([], { channel: 'telegram', createdAt: CREATED })).toBeNull()
    expect(matchPendingLead([record({ channel: 'viber' })], { channel: 'telegram', createdAt: CREATED })).toBeNull()
    expect(matchPendingLead([record({ matchedCardId: 15 })], { channel: 'telegram', createdAt: CREATED })).toBeNull()
    expect(matchPendingLead([record({ formCardId: 20 })], { channel: 'telegram', createdAt: CREATED })).toBeNull()
  })

  it('returns null when two unbound leads share the channel', () => {
    const leads = [
      record(),
      record({ leadId: 'dddddddddd' }),
    ]
    expect(matchPendingLead(leads, { channel: 'telegram', createdAt: CREATED })).toBeNull()
  })
})
