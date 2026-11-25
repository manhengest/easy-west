import { describe, expect, it, vi } from 'vitest'
import { buildLastTouchUpdate, buildMessengerPipelineCard, buildPipelineCard, createPipelineCard, leadCardTitle, readPipelineCardLeadId, updatePipelineCardLastTouch } from '~/server/utils/keycrm'
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
        gaClientId: '111.222',
        fbp: 'fb.1.10.999',
      }),
    })

    expect(card.title).toBe('Лід')
    expect(leadCardTitle(148)).toBe('Лід 148')
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
      { uuid: KEYCRM_FIELDS.gaClientId, value: '111.222' },
      { uuid: KEYCRM_FIELDS.fbp, value: 'fb.1.10.999' },
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

describe('buildMessengerPipelineCard', () => {
  it('maps a messenger click onto a pipeline card without a route or a phone', () => {
    const card = buildMessengerPipelineCard({
      leadId: 'abc1234567',
      channel: 'whatsapp',
      source: 'footer',
      locale: 'ru',
      device: 'mobile',
      utmSource: 'google',
      utmMedium: 'cpc',
      gclid: 'last-click',
      referrer: 'https://google.com',
      landingPath: '/?gclid=last-click',
      firstUtmSource: 'facebook',
      firstTouchedAt: '2026-10-01T00:00:00.000Z',
      firstLandingPath: '/start',
      gaClientId: '111.222',
      fbp: 'fb.1.10.999',
    })

    expect(card.title).toBe('Лід')
    expect(card.pipeline_id).toBe(1)
    expect(card.contact).toEqual({ full_name: 'Заявка з сайту' })
    expect(card.contact.phone).toBeUndefined()
    expect(card.utm_source).toBe('google')
    expect(card.manager_comment).toBe([
      'Кнопка: Футер',
      'Пристрій: Мобільний',
      'Referrer: https://google.com',
      'Сторінка: /?gclid=last-click',
    ].join('\n'))
    expect(card.custom_fields).toEqual(expect.arrayContaining([
      { uuid: KEYCRM_FIELDS.leadId, value: 'abc1234567' },
      { uuid: KEYCRM_FIELDS.channel, value: ['WhatsApp'] },
      { uuid: KEYCRM_FIELDS.locale, value: ['RU'] },
      { uuid: KEYCRM_FIELDS.firstSource, value: 'facebook' },
      { uuid: KEYCRM_FIELDS.firstVisit, value: '2026-10-01T00:00:00.000Z' },
      { uuid: KEYCRM_FIELDS.firstPage, value: '/start' },
      { uuid: KEYCRM_FIELDS.gclid, value: 'last-click' },
      { uuid: KEYCRM_FIELDS.gaClientId, value: '111.222' },
      { uuid: KEYCRM_FIELDS.fbp, value: 'fb.1.10.999' },
    ]))
    expect(card.custom_fields?.some(field => field.uuid === KEYCRM_FIELDS.from)).toBe(false)
    expect(card.custom_fields?.some(field => field.uuid === KEYCRM_FIELDS.to)).toBe(false)
  })
})

describe('buildLastTouchUpdate', () => {
  it('sends only the new last-touch utm and click ids', () => {
    const update = buildLastTouchUpdate({
      utmSource: 'facebook',
      utmMedium: 'cpc',
      fbclid: 'click-b',
      firstUtmSource: 'google',
      gclid: '',
    })

    expect(update).toEqual({
      utm_source: 'facebook',
      utm_medium: 'cpc',
      custom_fields: [
        { uuid: KEYCRM_FIELDS.fbclid, value: 'click-b' },
      ],
    })
    expect(JSON.stringify(update)).not.toContain(KEYCRM_FIELDS.firstSource)
    expect(JSON.stringify(update)).not.toContain(KEYCRM_FIELDS.gclid)
  })
})

describe('updatePipelineCardLastTouch', () => {
  it('puts the last touch on the existing card', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await updatePipelineCardLastTouch('secret', 15, {
      utmSource: 'facebook',
      fbclid: 'click-b',
    })

    expect(result).toEqual({ ok: true, id: 15 })
    expect(fetchMock).toHaveBeenCalledWith(`${KEYCRM_API_URL}/15`, expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      body: JSON.stringify({
        utm_source: 'facebook',
        custom_fields: [{ uuid: KEYCRM_FIELDS.fbclid, value: 'click-b' }],
      }),
    }))
    vi.unstubAllGlobals()
  })
})

describe('readPipelineCardLeadId', () => {
  it('reads LD_1003 from the card custom fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 15,
          custom_fields: [{ uuid: KEYCRM_FIELDS.leadId, value: 'abc1234567' }],
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(readPipelineCardLeadId('secret', 15)).resolves.toEqual({
      ok: true,
      leadId: 'abc1234567',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${KEYCRM_API_URL}/15?include=custom_fields`,
      expect.objectContaining({ method: 'GET' }),
    )
    vi.unstubAllGlobals()
  })
})

describe('createPipelineCard', () => {
  it('posts the card and renames it with the KeyCRM id', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 148 }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createPipelineCard('secret', {
      title: 'Лід',
      pipeline_id: 1,
      source_id: 1,
      contact: { full_name: 'Заявка з сайту' },
    })

    expect(result).toEqual({ ok: true, id: 148 })
    expect(fetchMock).toHaveBeenNthCalledWith(1, KEYCRM_API_URL, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${KEYCRM_API_URL}/148`, expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ title: 'Лід 148' }),
    }))

    vi.unstubAllGlobals()
  })

  it('retries the rename when the new card is not readable yet', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 148 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({ status: true }) }))

    const result = await createPipelineCard('secret', {
      title: 'Лід',
      pipeline_id: 1,
      source_id: 1,
      contact: { full_name: 'Заявка з сайту' },
    })

    expect(result).toEqual({ ok: true, id: 148 })
    expect(vi.mocked(fetch).mock.calls[2]?.[0]).toBe(`${KEYCRM_API_URL}/148`)
    vi.unstubAllGlobals()
  })

  it('keeps the created card when the rename fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 148 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({}) }))

    const result = await createPipelineCard('secret', {
      title: 'Лід',
      pipeline_id: 1,
      source_id: 1,
      contact: { full_name: 'Заявка з сайту' },
    })

    expect(result).toEqual({ ok: true, id: 148 })
    errorSpy.mockRestore()
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
