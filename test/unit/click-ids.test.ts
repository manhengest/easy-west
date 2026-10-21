import { describe, expect, it } from 'vitest'
import { fbpFromCookie, gaClientIdFromCookie, readCookieValue } from '~/shared/click-ids'

describe('readCookieValue', () => {
  it('reads one cookie from a header', () => {
    expect(readCookieValue('_ga=GA1.1.111.222; _fbp=fb.1.10.999', '_fbp')).toBe('fb.1.10.999')
  })

  it('returns undefined when the cookie is missing', () => {
    expect(readCookieValue('_ga=GA1.1.111.222', '_fbp')).toBeUndefined()
  })
})

describe('gaClientIdFromCookie', () => {
  it('keeps the client id after the GA prefix', () => {
    expect(gaClientIdFromCookie('GA1.1.111.222')).toBe('111.222')
  })

  it('returns undefined for a cookie without a client id', () => {
    expect(gaClientIdFromCookie('GA1.1')).toBeUndefined()
    expect(gaClientIdFromCookie(undefined)).toBeUndefined()
  })
})

describe('fbpFromCookie', () => {
  it('keeps the Meta browser id', () => {
    expect(fbpFromCookie('fb.1.10.999')).toBe('fb.1.10.999')
  })

  it('returns undefined for a different cookie', () => {
    expect(fbpFromCookie('GA1.1.111.222')).toBeUndefined()
  })
})
