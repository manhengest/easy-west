import { leadSubmitSchema, parseLeadPhoneE164 } from '~/shared/lead-schema'

const idempotencyCache = new Map<string, { status: number, body: unknown }>()

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  const parsed = leadSubmitSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const payload = parsed.data
  const idemKey = payload.idempotencyKey

  const cached = idempotencyCache.get(idemKey)
  if (cached) {
    return cached.body
  }

  let phoneE164: string
  try {
    phoneE164 = parseLeadPhoneE164(payload)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid phone number' })
  }

  // Phase 4: Turnstile verify, rate limit, consent DB, KV, QStash
  if (config.deployEnv === 'production' && payload.turnstileToken.startsWith('stub-')) {
    throw createError({ statusCode: 403, statusMessage: 'Turnstile verification required' })
  }

  const receivedAt = new Date().toISOString()
  const leadId = crypto.randomUUID()

  const response = {
    ok: true as const,
    leadId,
    receivedAt,
    phoneE164,
    locale: payload.locale,
    source: payload.source,
  }

  idempotencyCache.set(idemKey, { status: 200, body: response })

  return response
})
