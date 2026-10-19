const UTM_KEYS = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'utmTerm',
] as const

const CLICK_ID_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
] as const

const TOUCH_KEYS = [
  ...UTM_KEYS,
  ...CLICK_ID_KEYS,
  'referrer',
  'landingPath',
  'touchedAt',
] as const

export interface AttributionTouch {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
  referrer?: string
  landingPath?: string
  touchedAt?: string
}

export interface LeadAttribution {
  first: AttributionTouch
  last: AttributionTouch
}

export interface AttributionIncoming {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
  referrer?: string
  landingPath?: string
  touchedAt: string
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function touchFromRecord(data: Record<string, unknown>): AttributionTouch | null {
  const touch: AttributionTouch = {}

  for (const key of TOUCH_KEYS) {
    const value = nonEmptyString(data[key])
    if (value) {
      touch[key] = value
    }
  }

  return Object.keys(touch).length > 0 ? touch : null
}

function isTouchRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isTaggedIncoming(incoming: AttributionIncoming): boolean {
  return UTM_KEYS.some(key => incoming[key] !== undefined)
    || CLICK_ID_KEYS.some(key => incoming[key] !== undefined)
}

function referrerHostname(referrer: string | undefined): string | undefined {
  if (!referrer) {
    return undefined
  }

  try {
    return new URL(referrer).hostname || undefined
  }
  catch {
    return undefined
  }
}

function buildTouch(incoming: AttributionIncoming): AttributionTouch {
  const touch: AttributionTouch = { touchedAt: incoming.touchedAt }

  for (const key of UTM_KEYS) {
    if (incoming[key]) {
      touch[key] = incoming[key]
    }
  }

  for (const key of CLICK_ID_KEYS) {
    if (incoming[key]) {
      touch[key] = incoming[key]
    }
  }

  if (incoming.referrer) {
    touch.referrer = incoming.referrer
  }
  if (incoming.landingPath) {
    touch.landingPath = incoming.landingPath
  }

  if (!touch.utmSource) {
    const hostname = referrerHostname(incoming.referrer)
    if (hostname) {
      touch.utmSource = hostname
      if (!touch.utmMedium) {
        touch.utmMedium = 'referral'
      }
    }
    else {
      touch.utmSource = 'direct'
      if (!touch.utmMedium) {
        touch.utmMedium = 'direct'
      }
    }
  }

  return touch
}

function visitKey(touch: AttributionTouch): string {
  return [
    touch.landingPath ?? '',
    ...UTM_KEYS.map(key => touch[key] ?? ''),
    ...CLICK_ID_KEYS.map(key => touch[key] ?? ''),
  ].join('\0')
}

function cloneTouch(touch: AttributionTouch): AttributionTouch {
  return { ...touch }
}

export function normalizeAttribution(raw: unknown): LeadAttribution | null {
  if (!raw) {
    return null
  }

  if (typeof raw === 'string') {
    try {
      return normalizeAttribution(JSON.parse(raw))
    }
    catch {
      return null
    }
  }

  if (!isTouchRecord(raw)) {
    return null
  }

  if (isTouchRecord(raw.first) || isTouchRecord(raw.last)) {
    const first = isTouchRecord(raw.first) ? touchFromRecord(raw.first) : null
    const last = isTouchRecord(raw.last) ? touchFromRecord(raw.last) : null
    if (!first && !last) {
      return null
    }
    const snapshot = first ?? last
    if (!snapshot) {
      return null
    }
    return {
      first: cloneTouch(first ?? snapshot),
      last: cloneTouch(last ?? snapshot),
    }
  }

  const legacy = touchFromRecord(raw)
  if (!legacy) {
    return null
  }

  return {
    first: cloneTouch(legacy),
    last: cloneTouch(legacy),
  }
}

export function applyAttribution(
  stored: LeadAttribution | null,
  incoming: AttributionIncoming,
): LeadAttribution {
  const touch = buildTouch(incoming)

  if (!stored) {
    return {
      first: cloneTouch(touch),
      last: cloneTouch(touch),
    }
  }

  if (!isTaggedIncoming(incoming) || visitKey(stored.last) === visitKey(touch)) {
    return stored
  }

  return {
    first: stored.first,
    last: touch,
  }
}
