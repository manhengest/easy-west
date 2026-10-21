export function readCookieValue(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      continue
    }
    if (trimmed.slice(0, eq) !== name) {
      continue
    }
    const value = trimmed.slice(eq + 1)
    if (!value) {
      return undefined
    }
    try {
      return decodeURIComponent(value)
    }
    catch {
      return value
    }
  }
  return undefined
}

/** GA4 client id is the part of `_ga` after `GA1.<depth>.`. */
export function gaClientIdFromCookie(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined
  }
  const match = /^GA\d+\.\d+\.(.+)$/.exec(raw.trim())
  const id = match?.[1]
  if (!id || !id.includes('.')) {
    return undefined
  }
  return id
}

/** Meta browser id is the raw `_fbp` cookie. */
export function fbpFromCookie(raw: string | undefined): string | undefined {
  const value = raw?.trim()
  if (!value || !value.startsWith('fb.')) {
    return undefined
  }
  return value
}
