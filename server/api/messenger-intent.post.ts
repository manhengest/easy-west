import { parseMessengerPipelineId, messengerIntentSchema } from '~/shared/messenger-intent'
import { buildMessengerIntentCard, createPipelineCard } from '../utils/keycrm'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)
  const parsed = messengerIntentSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const pipelineId = parseMessengerPipelineId(config.keycrmMessengerPipelineId)
  if (!pipelineId || !config.keycrmApiKey) {
    return { ok: true as const, enabled: false as const }
  }

  try {
    const result = await createPipelineCard(
      config.keycrmApiKey,
      buildMessengerIntentCard(pipelineId, parsed.data),
    )
    if (!result.ok) {
      console.error('[messenger-intent] KeyCRM card was not created', { status: result.status })
      return { ok: false as const, enabled: true as const }
    }
    return { ok: true as const, enabled: true as const, cardId: result.id }
  }
  catch (error) {
    console.error('[messenger-intent] KeyCRM card was not created', { error })
    return { ok: false as const, enabled: true as const }
  }
})
