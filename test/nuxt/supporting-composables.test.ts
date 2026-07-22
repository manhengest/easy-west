import { describe, expect, it, vi } from 'vitest'
import { mountComposable } from '../helpers/mountComposable'

describe('useTurnstile', () => {
  it('is disabled without site key', async () => {
    const containerRef = ref<HTMLElement | null>(null)
    const { enabled, token } = await mountComposable(() => useTurnstile(containerRef))
    expect(enabled.value).toBe(false)
    expect(token.value).toBe('')
  })

  it('renders widget when site key is set', async () => {
    const runtimeConfig = useRuntimeConfig()
    runtimeConfig.public.turnstileSiteKey = 'test-site-key'

    const render = vi.fn((_el: HTMLElement, opts: { callback: (t: string) => void }) => {
      opts.callback('widget-token')
      return 'widget-id'
    })
    const remove = vi.fn()
    vi.stubGlobal('turnstile', { render, remove, reset: vi.fn() })

    const el = document.createElement('div')
    const containerRef = ref<HTMLElement | null>(el)
    const { token, renderWidget } = await mountComposable(() => useTurnstile(containerRef))

    await renderWidget()
    expect(render).toHaveBeenCalled()
    expect(token.value).toBe('widget-token')

    vi.unstubAllGlobals()
  })
})

describe('useViberFallbackToast', () => {
  it('shows toast when Viber handoff stays', async () => {
    const { showViberFallbackToast } = await mountComposable(() => useViberFallbackToast())
    showViberFallbackToast()
    const { toast } = useToast()
    expect(toast.value?.message).toBeTruthy()
    expect(toast.value?.actions?.length).toBeGreaterThan(0)
  })
})

describe('useLandingContent', () => {
  it('maps translated landing content', async () => {
    const { segments, faqItems } = await mountComposable(() => useLandingContent())
    expect(segments.value.length).toBeGreaterThan(0)
    expect(faqItems.value.length).toBeGreaterThan(0)
    expect(segments.value[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
    })
  })
})

describe('useLeadHost', () => {
  it('opens lead overlay with source', async () => {
    const { leadOpen, leadSource, openLead } = await mountComposable(() => useLeadHost())
    openLead('cta')
    expect(leadOpen.value).toBe(true)
    expect(leadSource.value).toBe('cta')
  })
})
