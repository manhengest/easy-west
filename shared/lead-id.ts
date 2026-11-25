export const LEAD_ID_PATTERN = /^[0-9a-f]{10}$/

export function mintLeadId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}
