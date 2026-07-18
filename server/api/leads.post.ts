import { leadSubmitSchema, parseLeadPhoneE164 } from '~/shared/lead-schema'
import { notifyLeadChannels } from '../utils/lead-notify'
import { LEAD_TURNSTILE_ACTION } from '~/shared/lead-constants'
import { isStubTurnstileToken, verifyTurnstileToken } from '../utils/turnstile'

const idempotencyCache = new Map<string, { status: number, body: unknown }>()

function expectedTurnstileHostname(siteUrl: string): string {
  return new URL(siteUrl).hostname
}

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

  let phoneE164: string | null
  try {
    phoneE164 = parseLeadPhoneE164(payload)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid phone number' })
  }

  const isProduction = config.deployEnv === 'production'
  const stubToken = isStubTurnstileToken(payload.turnstileToken)

  if (isProduction && stubToken) {
    throw createError({ statusCode: 403, statusMessage: 'Turnstile verification required' })
  }

  if (!stubToken || isProduction) {
    const verifyResult = await verifyTurnstileToken({
      secret: config.turnstileSecret,
      token: payload.turnstileToken,
      remoteIp: getRequestIP(event, { xForwardedFor: true }) ?? undefined,
      expectedHostname: expectedTurnstileHostname(config.public.siteUrl),
      expectedAction: LEAD_TURNSTILE_ACTION,
    })

    if (!verifyResult.ok) {
      console.error('[leads] Turnstile verify failed:', verifyResult.reason)
      throw createError({ statusCode: 403, statusMessage: 'Turnstile verification failed' })
    }
  }

  const receivedAt = new Date().toISOString()
  const leadId = crypto.randomUUID().replace(/-/g, '').slice(0, 10)

  const notifyResult = await notifyLeadChannels(
    {
      resendApiKey: config.resendApiKey,
      leadsFromEmail: config.leadsFromEmail,
      leadsToEmail: config.leadsToEmail,
      telegramBotToken: config.telegramBotToken,
      telegramChatId: config.telegramChatId,
    },
    { leadId, receivedAt, phoneE164, payload },
  )

  if (!notifyResult.email && !notifyResult.telegram) {
    console.error('[leads] All notification channels failed', { leadId, idemKey })
    throw createError({ statusCode: 502, statusMessage: 'Lead notification failed' })
  }

  if (!notifyResult.email || !notifyResult.telegram) {
    console.error('[leads] Partial notification failure', { leadId, ...notifyResult })
  }

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
