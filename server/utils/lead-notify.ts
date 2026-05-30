import type { LeadSubmitPayload } from '~/shared/lead-schema'

export interface LeadNotificationContext {
  leadId: string
  receivedAt: string
  phoneE164: string
  payload: LeadSubmitPayload
}

export interface LeadNotifyConfig {
  resendApiKey: string
  leadsFromEmail: string
  leadsToEmail: string
  telegramBotToken: string
  telegramChatId: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function telegramTelLink(e164: string): string {
  const safe = escapeHtml(e164)
  return `<a href="tel:${safe}">${safe}</a>`
}

function optionalRow(label: string, value: string | undefined): string {
  if (!value) {
    return ''
  }
  return `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`
}

function buildLeadEmailHtml(ctx: LeadNotificationContext): string {
  const { leadId, receivedAt, phoneE164, payload } = ctx
  const rows = [
    optionalRow('Lead ID', leadId),
    optionalRow('Received', receivedAt),
    optionalRow('From', payload.from),
    optionalRow('To', payload.to),
    optionalRow('Phone', phoneE164),
    optionalRow('Locale', payload.locale),
    optionalRow('Source', payload.source),
    optionalRow('Consent policy', payload.consentPolicyVersion),
    optionalRow('UTM source', payload.utmSource),
    optionalRow('UTM medium', payload.utmMedium),
    optionalRow('UTM campaign', payload.utmCampaign),
    optionalRow('UTM content', payload.utmContent),
    optionalRow('UTM term', payload.utmTerm),
    optionalRow('Referrer', payload.referrer),
    optionalRow('Landing path', payload.landingPath),
  ].join('')

  return `<!DOCTYPE html><html><body><h2>EASY WEST — нова заявка</h2><table>${rows}</table></body></html>`
}

function buildTelegramMessage(ctx: LeadNotificationContext): string {
  const { leadId, phoneE164, payload } = ctx
  const lines = [
    '🚚 <b>EASY WEST</b> — нова заявка',
    `--------------------------------`,
    `<b>Маршрут:</b> ${escapeHtml(payload.from)} → ${escapeHtml(payload.to)}`,
    `<b>Телефон:</b> ${telegramTelLink(phoneE164)}`,
    `--------------------------------`,
    `<b>Мова:</b> ${escapeHtml(payload.locale)} · <b>Форма:</b> ${escapeHtml(payload.source)}`,
    `<b>ID:</b> ${escapeHtml(leadId)}`,
  ]
  return lines.join('\n')
}

async function sendLeadEmail(
  config: LeadNotifyConfig,
  ctx: LeadNotificationContext,
): Promise<{ ok: true } | { ok: false, error: string }> {
  const subject = `[EASY WEST] ${ctx.payload.from} → ${ctx.payload.to}`
  const html = buildLeadEmailHtml(ctx)

  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'easy-west/1.0',
        'Idempotency-Key': `lead-email/${ctx.payload.idempotencyKey}`,
      },
      body: JSON.stringify({
        from: config.leadsFromEmail,
        to: [config.leadsToEmail],
        subject,
        html,
      }),
    })
  }
  catch {
    return { ok: false, error: 'resend_unreachable' }
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('[leads] Resend failed', response.status, detail)
    return { ok: false, error: 'resend_failed' }
  }

  return { ok: true }
}

async function sendTelegramMessage(
  config: LeadNotifyConfig,
  ctx: LeadNotificationContext,
): Promise<{ ok: true } | { ok: false, error: string }> {
  const text = buildTelegramMessage(ctx)
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
  }
  catch {
    return { ok: false, error: 'telegram_unreachable' }
  }

  const data = await response.json().catch(() => null) as { ok?: boolean, description?: string } | null
  if (!response.ok || !data?.ok) {
    console.error('[leads] Telegram failed', response.status, data?.description)
    return { ok: false, error: 'telegram_failed' }
  }

  return { ok: true }
}

export async function notifyLeadChannels(
  config: LeadNotifyConfig,
  ctx: LeadNotificationContext,
): Promise<{ email: boolean, telegram: boolean }> {
  const [emailResult, telegramResult] = await Promise.all([
    sendLeadEmail(config, ctx),
    sendTelegramMessage(config, ctx),
  ])

  return {
    email: emailResult.ok,
    telegram: telegramResult.ok,
  }
}
