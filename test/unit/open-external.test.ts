// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  closeExternalTab,
  openBlankExternalTab,
  openExternalHref,
} from '~/shared/open-external'

describe('open-external', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens HTTPS links in a new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    openExternalHref('https://example.com')
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('navigates an existing tab when provided', () => {
    const tab = { closed: false, location: { href: '' } } as unknown as Window
    openExternalHref('https://example.com', tab)
    expect(tab.location.href).toBe('https://example.com')
  })

  it('uses anchor click for custom schemes', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    openExternalHref('viber://chat?number=123')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('closes blank tab before custom scheme handoff', () => {
    const tab = { closed: false, close: vi.fn() } as unknown as Window
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    openExternalHref('tel:+380933218899', tab)
    expect(tab.close).toHaveBeenCalled()
  })

  it('openBlankExternalTab returns a window handle', () => {
    const mockTab = { opener: window } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(mockTab)
    const tab = openBlankExternalTab()
    expect(tab).toBe(mockTab)
    expect(mockTab.opener).toBeNull()
  })

  it('closeExternalTab closes open tabs', () => {
    const tab = { closed: false, close: vi.fn() } as unknown as Window
    closeExternalTab(tab)
    expect(tab.close).toHaveBeenCalled()
  })
})
