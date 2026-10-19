import { describe, expect, it } from 'vitest'
import {
  applyAttribution,
  normalizeAttribution,
  type AttributionIncoming,
  type LeadAttribution,
} from '~/shared/lead-attribution'

function incoming(overrides: Partial<AttributionIncoming> = {}): AttributionIncoming {
  return {
    touchedAt: '2026-10-19T08:00:00.000Z',
    landingPath: '/',
    ...overrides,
  }
}

describe('normalizeAttribution', () => {
  it('copies a legacy cookie into first and last', () => {
    const stored = normalizeAttribution({
      utmSource: 'google',
      utmMedium: 'cpc',
      landingPath: '/old',
    })

    expect(stored?.first.utmSource).toBe('google')
    expect(stored?.last).toEqual(stored?.first)
    expect(stored?.first).not.toBe(stored?.last)
  })

  it('returns null for invalid JSON', () => {
    expect(normalizeAttribution('{not-json')).toBeNull()
  })
})

describe('applyAttribution', () => {
  it('records the first landing as both touches', () => {
    const next = applyAttribution(null, incoming({
      utmSource: 'google',
      utmMedium: 'cpc',
      gclid: 'click-a',
      landingPath: '/?utm_source=google',
    }))

    expect(next.first).toEqual(next.last)
    expect(next.first.utmSource).toBe('google')
    expect(next.first.gclid).toBe('click-a')
    expect(next.first.touchedAt).toBe('2026-10-19T08:00:00.000Z')
  })

  it('derives referral when the first landing has no UTM', () => {
    const next = applyAttribution(null, incoming({
      referrer: 'https://news.example/story',
      landingPath: '/move',
    }))

    expect(next.first.utmSource).toBe('news.example')
    expect(next.first.utmMedium).toBe('referral')
  })

  it('derives direct when there is no referrer', () => {
    const next = applyAttribution(null, incoming())

    expect(next.first.utmSource).toBe('direct')
    expect(next.first.utmMedium).toBe('direct')
  })

  it('keeps a provided medium when utm_source is missing', () => {
    const next = applyAttribution(null, incoming({
      utmMedium: 'cpc',
      utmCampaign: 'spring',
      referrer: 'https://ads.example/',
    }))

    expect(next.first.utmSource).toBe('ads.example')
    expect(next.first.utmMedium).toBe('cpc')
    expect(next.first.utmCampaign).toBe('spring')
  })

  it('replaces last touch on a new tagged visit and drops the old click id', () => {
    const stored = applyAttribution(null, incoming({
      utmSource: 'google',
      utmCampaign: 'spring',
      gclid: 'click-a',
      landingPath: '/?gclid=click-a',
    }))

    const next = applyAttribution(stored, incoming({
      utmSource: 'facebook',
      utmCampaign: 'meta',
      fbclid: 'click-b',
      landingPath: '/?fbclid=click-b',
      touchedAt: '2026-10-19T09:00:00.000Z',
    }))

    expect(next.first.utmSource).toBe('google')
    expect(next.first.gclid).toBe('click-a')
    expect(next.last.utmSource).toBe('facebook')
    expect(next.last.fbclid).toBe('click-b')
    expect(next.last.gclid).toBeUndefined()
  })

  it('does not wipe last touch on a direct visit', () => {
    const stored = applyAttribution(null, incoming({
      utmSource: 'google',
      gclid: 'click-a',
    }))

    const next = applyAttribution(stored, incoming({
      landingPath: '/pricing',
      touchedAt: '2026-10-19T09:00:00.000Z',
    }))

    expect(next).toBe(stored)
  })

  it('keeps a legacy snapshot as first when a new campaign arrives', () => {
    const stored = normalizeAttribution({ utmSource: 'email', landingPath: '/old' })

    const next = applyAttribution(stored, incoming({
      utmSource: 'google',
      landingPath: '/?utm_source=google',
      touchedAt: '2026-10-19T09:00:00.000Z',
    }))

    expect(next.first.utmSource).toBe('email')
    expect(next.first.landingPath).toBe('/old')
    expect(next.last.utmSource).toBe('google')
  })

  it('does not rewrite last touch when the same tagged landing is captured again', () => {
    const stored: LeadAttribution = applyAttribution(null, incoming({
      utmSource: 'google',
      landingPath: '/?utm_source=google',
    }))

    const next = applyAttribution(stored, incoming({
      utmSource: 'google',
      landingPath: '/?utm_source=google',
      touchedAt: '2026-10-19T09:00:00.000Z',
    }))

    expect(next).toBe(stored)
    expect(next.last.touchedAt).toBe('2026-10-19T08:00:00.000Z')
  })
})
