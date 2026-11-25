import { messengerLeadSchema } from '~/shared/lead-schema'
import type { MessengerLeadPayload } from '~/shared/lead-schema'
import { buildMessengerPipelineCard, createPipelineCard } from '../utils/keycrm'

interface MessengerLeadResult {
  ok: true
  leadId: string
  cardId: number | null
}

/** In-flight POSTs for the same lead id (double-click). Cleared when the job settles. */
const inflightByLeadId = new Map<string, Promise<MessengerLeadResult>>()
/** Successful card ids. Cap keeps memory bounded across a long-lived Node process. */
const createdCardByLeadId = new Map<string, number>()
const CREATED_CARD_CACHE_MAX = 500

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)
  const parsed = messengerLeadSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const payload = parsed.data
  const knownCardId = createdCardByLeadId.get(payload.leadId)
  if (knownCardId !== undefined) {
    return { ok: true as const, leadId: payload.leadId, cardId: knownCardId }
  }

  const existing = inflightByLeadId.get(payload.leadId)
  if (existing) {
    return existing
  }

  const job = createMessengerCard(config.keycrmApiKey, payload)
    .then((result) => {
      if (result.cardId) {
        rememberCreatedCard(payload.leadId, result.cardId)
      }
      return result
    })
    .finally(() => {
      inflightByLeadId.delete(payload.leadId)
    })

  inflightByLeadId.set(payload.leadId, job)
  return job
})

function rememberCreatedCard(leadId: string, cardId: number): void {
  if (createdCardByLeadId.has(leadId)) {
    createdCardByLeadId.delete(leadId)
  }
  createdCardByLeadId.set(leadId, cardId)
  while (createdCardByLeadId.size > CREATED_CARD_CACHE_MAX) {
    const oldest = createdCardByLeadId.keys().next().value
    if (oldest === undefined) {
      break
    }
    createdCardByLeadId.delete(oldest)
  }
}

async function createMessengerCard(
  apiKey: string | undefined,
  payload: MessengerLeadPayload,
): Promise<MessengerLeadResult> {
  if (!apiKey) {
    console.error('[messenger-leads] KeyCRM api key is missing', { leadId: payload.leadId })
    return { ok: true, leadId: payload.leadId, cardId: null }
  }

  try {
    const result = await createPipelineCard(apiKey, buildMessengerPipelineCard(payload))
    if (!result.ok) {
      console.error('[messenger-leads] KeyCRM card was not created', {
        leadId: payload.leadId,
        status: result.status,
      })
      return { ok: true, leadId: payload.leadId, cardId: null }
    }
    return { ok: true, leadId: payload.leadId, cardId: result.id }
  }
  catch (error) {
    console.error('[messenger-leads] KeyCRM card was not created', { leadId: payload.leadId, error })
    return { ok: true, leadId: payload.leadId, cardId: null }
  }
}
