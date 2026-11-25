import { messengerLeadTouchSchema } from '~/shared/lead-schema'
import { readPipelineCardLeadId, updatePipelineCardLastTouch } from '../utils/keycrm'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)
  const parsed = messengerLeadTouchSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const apiKey = config.keycrmApiKey
  if (!apiKey) {
    console.error('[messenger-leads] KeyCRM api key is missing', { cardId: parsed.data.cardId })
    throw createError({ statusCode: 502, statusMessage: 'KeyCRM update failed' })
  }

  const owned = await readPipelineCardLeadId(apiKey, parsed.data.cardId)
  if (!owned.ok) {
    console.error('[messenger-leads] KeyCRM card could not be verified', {
      cardId: parsed.data.cardId,
      status: owned.status,
    })
    throw createError({
      statusCode: owned.status === 404 ? 404 : 502,
      statusMessage: owned.status === 404 ? 'Card not found' : 'KeyCRM update failed',
    })
  }
  if (owned.leadId !== parsed.data.leadId) {
    console.error('[messenger-leads] last touch refused: lead id mismatch', {
      cardId: parsed.data.cardId,
    })
    throw createError({ statusCode: 403, statusMessage: 'Card does not match lead' })
  }

  try {
    const result = await updatePipelineCardLastTouch(apiKey, parsed.data.cardId, parsed.data)
    if (!result.ok) {
      console.error('[messenger-leads] KeyCRM last touch was not updated', {
        cardId: parsed.data.cardId,
        status: result.status,
      })
      throw createError({ statusCode: 502, statusMessage: 'KeyCRM update failed' })
    }
  }
  catch (error) {
    if (isHttpError(error)) {
      throw error
    }
    console.error('[messenger-leads] KeyCRM last touch was not updated', {
      cardId: parsed.data.cardId,
      error,
    })
    throw createError({ statusCode: 502, statusMessage: 'KeyCRM update failed' })
  }

  return { ok: true as const }
})

function isHttpError(error: unknown): error is { statusCode: number } {
  return Boolean(error && typeof error === 'object' && 'statusCode' in error)
}
