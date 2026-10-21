import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KEYCRM_FIELDS } from '~/server/utils/keycrm-map'

const createPipelineCard = vi.fn()
const readBody = vi.fn()
const useRuntimeConfig = vi.fn()

vi.mock('~/server/utils/keycrm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/server/utils/keycrm')>()
  return {
    ...actual,
    createPipelineCard: (...args: unknown[]) => createPipelineCard(...args),
  }
})

vi.stubGlobal('readBody', readBody)
vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)
vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string, data?: unknown }) => {
  return Object.assign(new Error(opts.statusMessage), opts)
})

const { default: handler } = await import('~/server/api/messenger-intent.post')

function intentBody(overrides: Record<string, unknown> = {}) {
  return {
    channel: 'whatsapp',
    locale: 'ua',
    gclid: 'click-1',
    landingPath: '/?gclid=click-1',
    gaClientId: '111.222',
    website: '',
    ...overrides,
  }
}

async function callHandler(body: unknown, config: Record<string, unknown> = {}) {
  readBody.mockResolvedValue(body)
  useRuntimeConfig.mockReturnValue({
    keycrmApiKey: 'crm-key',
    keycrmMessengerPipelineId: '7',
    ...config,
  })
  return handler({} as never)
}

describe('POST /api/messenger-intent', () => {
  beforeEach(() => {
    createPipelineCard.mockReset()
    createPipelineCard.mockResolvedValue({ ok: true, id: 148 })
  })

  it('returns 400 for an invalid click', async () => {
    await expect(callHandler({ channel: 'phone' })).rejects.toMatchObject({ statusCode: 400 })
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('stays off until a messenger pipeline id is configured', async () => {
    const res = await callHandler(intentBody(), { keycrmMessengerPipelineId: '' })
    expect(res).toEqual({ ok: true, enabled: false })
    expect(createPipelineCard).not.toHaveBeenCalled()
  })

  it('creates one click card and returns its KeyCRM id', async () => {
    const res = await callHandler(intentBody())

    expect(res).toEqual({ ok: true, enabled: true, cardId: 148 })
    expect(createPipelineCard).toHaveBeenCalledTimes(1)
    const card = createPipelineCard.mock.calls[0]?.[1] as {
      title: string
      pipeline_id: number
      contact: { full_name: string, phone?: string }
      manager_comment: string
      custom_fields: { uuid: string, value: string | string[] }[]
    }
    expect(card.title).toBe('Лід')
    expect(card.pipeline_id).toBe(7)
    expect(card.contact).toEqual({ full_name: 'WhatsApp з сайту' })
    expect(card.manager_comment).toContain('Клік з кнопки, діалогу ще немає')
    expect(card.custom_fields).toEqual(expect.arrayContaining([
      { uuid: KEYCRM_FIELDS.gclid, value: 'click-1' },
      { uuid: KEYCRM_FIELDS.gaClientId, value: '111.222' },
    ]))
  })

  it('reports a failed card without throwing', async () => {
    createPipelineCard.mockResolvedValue({ ok: false, status: 500 })
    const res = await callHandler(intentBody())
    expect(res).toEqual({ ok: false, enabled: true })
  })
})
