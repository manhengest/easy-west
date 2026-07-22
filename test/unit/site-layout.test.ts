// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { getSiteHeaderScrollOffsetPx } from '~/shared/site-layout'

describe('getSiteHeaderScrollOffsetPx', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--site-header-scroll-offset')
  })

  it('reads CSS variable height from probe element', () => {
    document.documentElement.style.setProperty('--site-header-scroll-offset', '96px')
    expect(getSiteHeaderScrollOffsetPx()).toBeGreaterThan(0)
  })

  it('falls back to default when variable is unset', () => {
    expect(getSiteHeaderScrollOffsetPx()).toBe(81)
  })
})
