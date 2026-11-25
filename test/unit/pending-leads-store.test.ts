import { describe, expect, it } from 'vitest'
import {
  MATCH_WINDOW_MS,
  PENDING_LEAD_TTL_MS,
  dueFormLeads,
  pendingFromClick,
  pendingFromForm,
  type PendingLead,
} from '~/shared/pending-lead'
import { validLeadSubmitBody } from '../fixtures/leads'
import { listFreshPendingLeads, upsertClickLead, type PendingLeadBucket } from '~/server/utils/pending-leads'

function memoryBucket(seed: PendingLead[] = []): PendingLeadBucket & { all: () => PendingLead[] } {
  const map = new Map(seed.map(record => [record.leadId, record]))
  return {
    all: () => [...map.values()],
    getItem: async key => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value)
    },
    getKeys: async () => [...map.keys()],
    removeItem: async (key) => {
      map.delete(key)
    },
  }
}

describe('pending lead store', () => {
  it('drops a click that is 30 days old and keeps a newer one', async () => {
    const now = Date.parse('2026-11-25T00:00:00.000Z')
    const bucket = memoryBucket([
      pendingFromClick({
        leadId: 'aaaaaaaaaa',
        channel: 'telegram',
        source: 'hero',
        locale: 'ua',
        device: 'mobile',
      }, new Date(now - PENDING_LEAD_TTL_MS).toISOString()),
      pendingFromClick({
        leadId: 'bbbbbbbbbb',
        channel: 'whatsapp',
        source: 'hero',
        locale: 'ua',
        device: 'mobile',
      }, new Date(now - PENDING_LEAD_TTL_MS + 1000).toISOString()),
    ])

    const fresh = await listFreshPendingLeads(bucket, now)
    expect(fresh.map(record => record.leadId)).toEqual(['bbbbbbbbbb'])
    expect(bucket.all().map(record => record.leadId)).toEqual(['bbbbbbbbbb'])
  })

  it('updates the last click time and a tagged touch without clearing the first touch', async () => {
    const bucket = memoryBucket()
    const now = Date.parse('2026-11-25T06:00:00.000Z')
    await upsertClickLead(bucket, {
      leadId: 'abc1234567',
      channel: 'telegram',
      source: 'hero',
      locale: 'ua',
      device: 'mobile',
      utmSource: 'google',
      gclid: 'click-a',
      firstUtmSource: 'newsletter',
    }, now)

    const later = await upsertClickLead(bucket, {
      leadId: 'abc1234567',
      channel: 'telegram',
      source: 'footer',
      locale: 'ru',
      device: 'desktop',
      utmSource: 'facebook',
      utmMedium: 'cpc',
      fbclid: 'click-b',
      firstUtmSource: 'should-not-replace',
    }, now + 60_000)

    expect(later.pushLastTouch).toBe(false)
    expect(later.record).toMatchObject({
      lastTouchAt: new Date(now + 60_000).toISOString(),
      source: 'footer',
      locale: 'ru',
      utmSource: 'facebook',
      fbclid: 'click-b',
      firstUtmSource: 'newsletter',
    })
    expect(later.record.gclid).toBeUndefined()
  })

  it('asks for a card update only after the lead is already matched', async () => {
    const now = Date.parse('2026-11-25T06:00:00.000Z')
    const bucket = memoryBucket([
      {
        ...pendingFromClick({
          leadId: 'abc1234567',
          channel: 'telegram',
          source: 'hero',
          locale: 'ua',
          device: 'mobile',
          gclid: 'click-a',
        }, new Date(now).toISOString()),
        matchedCardId: 15,
      },
    ])

    const applied = await upsertClickLead(bucket, {
      leadId: 'abc1234567',
      channel: 'telegram',
      source: 'hero',
      locale: 'ua',
      device: 'mobile',
      utmSource: 'facebook',
      fbclid: 'click-b',
    }, now + 1000)

    expect(applied.pushLastTouch).toBe(true)
    expect(applied.record.matchedCardId).toBe(15)
  })
})

describe('dueFormLeads', () => {
  it('selects a messenger form that is still unmatched after 15 minutes', () => {
    const now = Date.parse('2026-11-25T06:16:50.000Z')
    const form = pendingFromForm('abc1234567', validLeadSubmitBody(), new Date(now - MATCH_WINDOW_MS).toISOString())
    const fresh = pendingFromForm('bbbbbbbbbb', validLeadSubmitBody(), new Date(now - MATCH_WINDOW_MS + 1).toISOString())
    const click = pendingFromClick({
      leadId: 'cccccccccc',
      channel: 'telegram',
      source: 'hero',
      locale: 'ua',
      device: 'desktop',
    }, new Date(now - MATCH_WINDOW_MS - 1000).toISOString())

    expect(form && fresh).toBeTruthy()
    const due = dueFormLeads([form!, fresh!, click], now)
    expect(due.map(record => record.leadId)).toEqual(['abc1234567'])
  })
})
