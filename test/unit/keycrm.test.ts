import { describe, expect, it, vi } from 'vitest'
import { buildPipelineCard, createPipelineCard } from '~/server/utils/keycrm'
import { KEYCRM_API_URL, KEYCRM_FIELDS } from '~/server/utils/keycrm-map'
import { validLeadSubmitBody, validPhoneLeadBody } from '../fixtures/leads'

describe('buildPipelineCard', () => {
  it('maps a messenger lead onto a pipeline card', () => {
    const card = buildPipelineCard({
      leadId: 'abc1234567',
      phoneE164: null,
      payload: validLeadSubmitBody({
        from: 'Kyiv',
        to: 'Warsaw',
        details: 'Two boxes',
        contactMethod: 'telegram',
        locale: 'ua',
        source: 'hero',
        device: 'desktop',
        utmSource: 'google',
        utmMedium: 'cpc',
        gclid: 'last-click',
        referrer: 'https://google.com',
        landingPath: '/?gclid=last-click',
        firstUtmSource: 'facebook',
        firstUtmMedium: 'paid',
        firstTouchedAt: '2026-10-01T00:00:00.000Z',
        firstLandingPath: '/start',
        firstGclid: 'first-click',
      }),
    })

    expect(card.title).toBe('Kyiv → Warsaw')
    expect(card.pipeline_id).toBe(1)
    expect(card.source_id).toBe(1)
    expect(card.contact).toEqual({ full_name: 'Заявка з сайту' })
    expect(card.utm_source).toBe('google')
    expect(card.utm_medium).toBe('cpc')
    expect(card.utm_campaign).toBeUndefined()
    expect(card.manager_comment).toContain('Two boxes')
    expect(card.manager_comment).toContain('Форма: Банер')
    expect(card.manager_comment).toContain('Пристрій: Десктоп')
    expect(card.manager_comment).toContain('Referrer: https://google.com')
    expect(card.custom_fields).toEqual(expect.arrayContaining([
      { uuid: KEYCRM_FIELDS.from, value: 'Kyiv' },
      { uuid: KEYCRM_FIELDS.to, value: 'Warsaw' },
      { uuid: KEYCRM_FIELDS.leadId, value: 'abc1234567' },
      { uuid: KEYCRM_FIELDS.channel, value: ['Telegram'] },
      { uuid: KEYCRM_FIELDS.locale, value: ['UA'] },
      { uuid: KEYCRM_FIELDS.firstSource, value: 'facebook' },
      { uuid: KEYCRM_FIELDS.firstMedium, value: 'paid' },
      { uuid: KEYCRM_FIELDS.firstVisit, value: '2026-10-01T00:00:00.000Z' },
      { uuid: KEYCRM_FIELDS.firstPage, value: '/start' },
      { uuid: KEYCRM_FIELDS.firstGclid, value: 'first-click' },
      { uuid: KEYCRM_FIELDS.gclid, value: 'last-click' },
    ]))
    expect(card.custom_fields?.some(field => field.uuid === KEYCRM_FIELDS.firstFbclid)).toBe(false)
  })

  it('sends the phone only when the contact method is phone', () => {
    const card = buildPipelineCard({
      leadId: 'abc1234567',
      phoneE164: '+380933218899',
      payload: validPhoneLeadBody({ locale: 'ru' }),
    })

    expect(card.contact.phone).toBe('+380933218899')
    expect(card.custom_fields).toEqual(expect.arrayContaining([
      { uuid: KEYCRM_FIELDS.channel, value: ['Телефон'] },
      { uuid: KEYCRM_FIELDS.locale, value: ['RU'] },
    ]))
  })
})

describe('createPipelineCard', () => {
  it('posts the card with a bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createPipelineCard('secret', {
      title: 'Kyiv → Warsaw',
      pipeline_id: 1,
      source_id: 1,
      contact: { full_name: 'Заявка з сайту' },
    })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(KEYCRM_API_URL, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
    }))

    vi.unstubAllGlobals()
  })

  it('returns the status when KeyCRM rejects the card', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }))

    const result = await createPipelineCard('secret', {
      title: 'Kyiv → Warsaw',
      pipeline_id: 1,
      source_id: 1,
      contact: { full_name: 'Заявка з сайту' },
    })

    expect(result).toEqual({ ok: false, status: 422 })
    vi.unstubAllGlobals()
  })
})
