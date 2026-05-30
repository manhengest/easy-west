/** Mask E.164 phone for ops channels (e.g. Telegram). Keeps country code + last 3 digits. */
export function maskPhoneE164(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  if (digits.length <= 6) {
    return '***'
  }
  const visibleEnd = 3
  const visibleStart = Math.min(4, digits.length - visibleEnd)
  const maskedMiddle = '*'.repeat(Math.max(0, digits.length - visibleStart - visibleEnd))
  return `+${digits.slice(0, visibleStart)}${maskedMiddle}${digits.slice(-visibleEnd)}`
}
