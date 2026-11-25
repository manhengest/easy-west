import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KEYCRM_FIELDS } from '~/server/utils/keycrm-map'

const createPipelineCard = vi.fn()
const updatePipelineCardLastTouch = vi.fn()
const readPipelineCardLeadId = vi.fn()
const readBody = vi.fn()
const useRuntimeConfig = vi.fn()
const fetchMock = vi.fn()

vi.mock('~/server/utils/keycrm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/server/utils/keycrm')>()
  return {
    ...actual,
    createPipelineCard: (...args: unknown[]) => createPipelineCard(...args),
    updatePipelineCardLastTouch: (...args: unknown[]) => updatePipelineCardLastTouch(...args),
    readPipelineCardLeadId: (...args: unknown[]) => readPipelineCardLeadId(...args),
  }
})

vi.stubGlobal('readBody', readBody)
vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)
vi.stubGlobal('fetch', fetchMock)
vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string, data?: unknown }) => {
  const error = Object.assign(new Error(opts.statusMessage), opts)
  return error
})

const { default: postLead } = await import('~/server/api/messenger-leads.post')
const { default: putTouch } = await import('~/server/api/messenger-leads.put')

function clickBody(overrides: Record<string, unknown> = {}) {
  return {
    leadId: 'abc1234567',
    channel: 'whatsapp',
    source: 'footer',
    locale: 'ua',
    device: 'desktop',
    utmSource: 'google',
    utmMedium: 'cpc',
    gclid: 'last-click',
    referrer: 'https://google.com',
    landingPath: '/?gclid=last-click',
    firstUtmSource: 'facebook',
    gaClientId: '111.222',
    fbp: 'fb.1.10.999',
    ...overrides,
  }
}

async function post(body: unknown, apiKey: string | undefined = 'secret') {
  readBody.mockResolvedValue(body)
  useRuntimeConfig.mockReturnValue({ keycrmApiKey: apiKey })
  return postLead({} as never)
}

async function put(body: unknown, apiKey: string | undefined = 'secret') {
  readBody.mockResolvedValue(body)
  useRuntimeConfig.mockReturnValue({ keycrmApiKey: apiKey })
  return putTouch({} as never)
}

describe('POST /api/messenger-leads', () => {
  beforeEach(() => {
    createPipelineCard.mockReset()
    fetchMock.mockReset()
    createPipelineCard.mockResolvedValue({ ok: true, id: 148 })
  })

  it('returns 400 for a phone click', async () => {
    await expect(post(clickBody({ channel: 'phone', leadId: 'bbbbbbbbbb' }))).rejects.toMatchObject({
      statusCode: 400,
    })
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('creates one card for a lead id and returns that card id', async () => {
    const body = clickBody({ leadId: 'cccccccccc' })
    let resolveCard: (value: { ok: true, id: number }) => void = () => {}
    createPipelineCard.mockReturnValue(new Promise((resolve) => {
      resolveCard = resolve
    }))

    const first = post(body)
    const second = post(body)
    resolveCard({ ok: true, id: 148 })

    await expect(first).resolves.toEqual({ ok: true, leadId: 'cccccccccc', cardId: 148 })
    await expect(second).resolves.toEqual({ ok: true, leadId: 'cccccccccc', cardId: 148 })
    await expect(post(body)).resolves.toEqual({ ok: true, leadId: 'cccccccccc', cardId: 148 })
    expect(createPipelineCard).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()

    const card = createPipelineCard.mock.calls[0]?.[1] as {
      contact: { phone?: string }
      manager_comment: string
      custom_fields: { uuid: string, value: string | string[] }[]
    }
    expect(createPipelineCard.mock.calls[0]?.[0]).toBe('secret')
    expect(card.contact).toEqual({ full_name: 'Заявка з сайту' })
    expect(card.contact.phone).toBeUndefined()
    expect(card.manager_comment).toContain('Кнопка: Футер')
    expect(card.custom_fields).toEqual(expect.arrayContaining([
      { uuid: KEYCRM_FIELDS.leadId, value: 'cccccccccc' },
      { uuid: KEYCRM_FIELDS.channel, value: ['WhatsApp'] },
      { uuid: KEYCRM_FIELDS.gclid, value: 'last-click' },
      { uuid: KEYCRM_FIELDS.gaClientId, value: '111.222' },
    ]))
    expect(card.custom_fields.some(field => field.uuid === KEYCRM_FIELDS.from)).toBe(false)
    expect(card.custom_fields.some(field => field.uuid === KEYCRM_FIELDS.to)).toBe(false)
  })

  it('retries KeyCRM when the first create failed', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    createPipelineCard
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, id: 201 })

    const body = clickBody({ leadId: 'dddddddddd' })
    await expect(post(body)).resolves.toEqual({ ok: true, leadId: 'dddddddddd', cardId: null })
    await expect(post(body)).resolves.toEqual({ ok: true, leadId: 'dddddddddd', cardId: 201 })
    expect(createPipelineCard).toHaveBeenCalledTimes(2)
    errorSpy.mockRestore()
  })
})

describe('PUT /api/messenger-leads', () => {
  beforeEach(() => {
    updatePipelineCardLastTouch.mockReset()
    readPipelineCardLeadId.mockReset()
    updatePipelineCardLastTouch.mockResolvedValue({ ok: true, id: 15 })
    readPipelineCardLeadId.mockResolvedValue({ ok: true, leadId: 'abc1234567' })
  })

  it('rejects a direct visit before it can overwrite the card', async () => {
    await expect(put({
      cardId: 15,
      leadId: 'abc1234567',
      utmSource: 'direct',
      utmMedium: 'direct',
    })).rejects.toMatchObject({ statusCode: 400 })
    expect(readPipelineCardLeadId).not.toHaveBeenCalled()
    expect(updatePipelineCardLastTouch).not.toHaveBeenCalled()
  })

  it('rejects a put without the lead id', async () => {
    await expect(put({
      cardId: 15,
      utmSource: 'facebook',
      utmMedium: 'cpc',
      fbclid: 'click-b',
    })).rejects.toMatchObject({ statusCode: 400 })
    expect(updatePipelineCardLastTouch).not.toHaveBeenCalled()
  })

  it('refuses a card that belongs to another lead', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    readPipelineCardLeadId.mockResolvedValue({ ok: true, leadId: 'otherlead00' })

    await expect(put({
      cardId: 15,
      leadId: 'abc1234567',
      utmSource: 'facebook',
      utmMedium: 'cpc',
      fbclid: 'click-b',
    })).rejects.toMatchObject({ statusCode: 403 })
    expect(updatePipelineCardLastTouch).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('puts the tagged last touch onto the card', async () => {
    await expect(put({
      cardId: 15,
      leadId: 'abc1234567',
      utmSource: 'facebook',
      utmMedium: 'cpc',
      fbclid: 'click-b',
      firstUtmSource: 'google',
    })).resolves.toEqual({ ok: true })

    expect(readPipelineCardLeadId).toHaveBeenCalledWith('secret', 15)
    expect(updatePipelineCardLastTouch).toHaveBeenCalledWith('secret', 15, {
      cardId: 15,
      leadId: 'abc1234567',
      utmSource: 'facebook',
      utmMedium: 'cpc',
      fbclid: 'click-b',
    })
  })

  it('logs a KeyCRM failure and returns 502', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    updatePipelineCardLastTouch.mockResolvedValue({ ok: false, status: 422 })

    await expect(put({
      cardId: 15,
      leadId: 'abc1234567',
      gclid: 'click-c',
    })).rejects.toMatchObject({ statusCode: 502 })
    errorSpy.mockRestore()
  })
})
