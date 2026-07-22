import { describe, expect, it } from 'vitest'
import { openBlankExternalTab, openExternalHref } from '~/shared/open-external'

describe('open-external (node)', () => {
  it('returns null when window is unavailable', () => {
    const original = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window
    expect(openBlankExternalTab()).toBeNull()
    openExternalHref('https://example.com')
    globalThis.window = original
  })
})
