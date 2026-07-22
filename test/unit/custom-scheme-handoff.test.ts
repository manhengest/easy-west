// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { watchCustomSchemeHandoff } from '~/shared/custom-scheme-handoff'

describe('watchCustomSchemeHandoff', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves handed_off on server without window', async () => {
    const original = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window
    await expect(watchCustomSchemeHandoff()).resolves.toBe('handed_off')
    globalThis.window = original
  })

  it('resolves stayed after timeout', async () => {
    vi.useFakeTimers()
    const promise = watchCustomSchemeHandoff({ timeoutMs: 1000 })
    vi.advanceTimersByTime(1000)
    await expect(promise).resolves.toBe('stayed')
  })

  it('resolves handed_off on visibility hidden', async () => {
    vi.useFakeTimers()
    const promise = watchCustomSchemeHandoff({ timeoutMs: 5000 })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await expect(promise).resolves.toBe('handed_off')
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('resolves handed_off on blur', async () => {
    vi.useFakeTimers()
    const promise = watchCustomSchemeHandoff({ timeoutMs: 5000 })
    window.dispatchEvent(new Event('blur'))
    await expect(promise).resolves.toBe('handed_off')
  })
})
