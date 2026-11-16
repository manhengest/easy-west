import type { LeadSubmitPayload } from '~/shared/lead-schema'

export interface StapeLeadInput {
  leadId: string
  phoneE164: string | null
  payload: LeadSubmitPayload
  clientIp?: string
  userAgent?: string
}

export function stapeLeadEndpoint(taggingUrl: string | undefined): string | null {
  const base = taggingUrl?.trim().replace(/\/+$/, '')
  if (!base) {
    return null
  }
  return `${base}/lead`
}

export function stapeLeadBody(input: StapeLeadInput): Record<string, string> {
  const { payload } = input
  const fields: Record<string, string | undefined> = {
    event_name: 'generate_lead',
    event_id: input.leadId,
    client_id: filled(payload.gaClientId),
    gclid: filled(payload.gclid),
    gbraid: filled(payload.gbraid),
    wbraid: filled(payload.wbraid),
    fbclid: filled(payload.fbclid),
    fbc: fbcFrom(payload.fbclid),
    ga_client_id: filled(payload.gaClientId),
    fbp: filled(payload.fbp),
    phone: filled(input.phoneE164),
    client_ip_address: filled(input.clientIp),
    ip_override: filled(input.clientIp),
    client_user_agent: filled(input.userAgent),
    user_agent: filled(input.userAgent),
    landing_path: filled(payload.landingPath),
  }

  return Object.fromEntries(
    Object.entries(fields).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

export async function postStapeLead(
  taggingUrl: string | undefined,
  input: StapeLeadInput,
): Promise<void> {
  const endpoint = stapeLeadEndpoint(taggingUrl)
  if (!endpoint) {
    return
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(stapeLeadBody(input)),
    })
    if (!response.ok) {
      console.error('[leads] Stape lead was not accepted', {
        leadId: input.leadId,
        status: response.status,
      })
    }
  }
  catch (error) {
    console.error('[leads] Stape lead was not accepted', { leadId: input.leadId, error })
  }
}

function filled(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function fbcFrom(fbclid: string | null | undefined): string | undefined {
  const id = filled(fbclid)
  if (!id) {
    return undefined
  }
  return `fb.1.${Date.now()}.${id}`
}
