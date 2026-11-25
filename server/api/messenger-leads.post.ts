import type { MessengerLeadPayload } from '~/shared/lead-schema'
import { messengerLeadSchema } from '~/shared/lead-schema'
import { updatePipelineCardLastTouch } from '../utils/keycrm'
import { pendingLeadBucket, upsertClickLead } from '../utils/pending-leads'

interface MessengerLeadResult {
  ok: true
  leadId: string
}

const inflightByLeadId = new Map<string, Promise<MessengerLeadResult>>()

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
  const previous = inflightByLeadId.get(payload.leadId) ?? Promise.resolve({ ok: true as const, leadId: payload.leadId })
  // Keep the queue moving if a prior click failed; this request still must save.
  const job = previous
    .catch(() => ({ ok: true as const, leadId: payload.leadId }))
    .then(() => storeMessengerClick(config.keycrmApiKey, payload))

  inflightByLeadId.set(payload.leadId, job)
  try {
    return await job
  }
  finally {
    if (inflightByLeadId.get(payload.leadId) === job) {
      inflightByLeadId.delete(payload.leadId)
    }
  }
})

async function storeMessengerClick(
  apiKey: string | undefined,
  payload: MessengerLeadPayload,
): Promise<MessengerLeadResult> {
  let applied: Awaited<ReturnType<typeof upsertClickLead>>
  try {
    applied = await upsertClickLead(pendingLeadBucket(), payload)
  }
  catch (error) {
    console.error('[messenger-leads] pending lead was not saved', { leadId: payload.leadId, error })
    throw createError({ statusCode: 502, statusMessage: 'Pending lead was not saved' })
  }

  if (applied.pushLastTouch && applied.record.matchedCardId && apiKey) {
    try {
      const result = await updatePipelineCardLastTouch(apiKey, applied.record.matchedCardId, applied.record)
      if (!result.ok) {
        console.error('[messenger-leads] KeyCRM last touch was not updated', {
          cardId: applied.record.matchedCardId,
          status: result.status,
        })
      }
    }
    catch (error) {
      console.error('[messenger-leads] KeyCRM last touch was not updated', {
        cardId: applied.record.matchedCardId,
        error,
      })
    }
  }

  return { ok: true, leadId: payload.leadId }
}
