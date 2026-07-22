import { expect, test, type Page } from '@playwright/test'

const baseOrigin = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole('button', { name: /Прийняти всі|Accept all/i })
  try {
    await accept.waitFor({ state: 'visible', timeout: 5000 })
    await accept.click()
    await expect(accept).toBeHidden({ timeout: 5000 })
  }
  catch {
    // Banner already dismissed or not shown.
  }
}

function readCookie(page: Page, name: string) {
  return page.evaluate((cookieName) => {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`))
    return match?.[1]
  }, name)
}

test.describe('locale switch', () => {
  test('UA home loads at /', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)
    await expect(page).toHaveURL('/')
    await expect(page.locator('html')).toHaveAttribute('lang', /uk|ua/i)
  })

  test('switches to RU and sets ew_locale cookie', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)
    const ruLink = page.locator('.locale-switcher__link').filter({ hasText: /RU|РУ/i })
    await ruLink.click()
    await expect(page).toHaveURL(/\/ru\/?/)

    await expect.poll(() => readCookie(page, 'ew_locale'), { timeout: 10_000 }).toBe('ru')
  })

  test('respects locale cookie on revisit', async ({ page, context }) => {
    const { hostname } = new URL(baseOrigin)
    await context.addCookies([{
      name: 'ew_locale',
      value: 'ru',
      domain: hostname,
      path: '/',
    }])
    await page.goto('/')
    await dismissCookieBanner(page)
    await expect(page).toHaveURL(/\/ru\/?/)
  })
})

test.describe('lead form', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.turnstile = {
        render: (_el: HTMLElement, opts: { callback: (token: string) => void }) => {
          opts.callback('stub-e2e-turnstile')
          return 'widget-id'
        },
        reset: () => {},
        remove: () => {},
      }
    })
  })

  async function openLeadForm(page: Page) {
    await page.goto('/')
    await dismissCookieBanner(page)
    await page.getByRole('button', { name: /Розрахувати вартість переїзду/i }).click()
    const form = page.locator('form.lead-form')
    await expect(form).toBeVisible({ timeout: 10_000 })
    return form
  }

  test('shows validation errors on empty submit', async ({ page }) => {
    const form = await openLeadForm(page)
    await form.getByRole('button', { type: 'submit' }).click()
    await expect(page.locator('.lead-form__summary, .lead-form__error, [aria-invalid="true"]').first()).toBeVisible()
  })

  test('submits happy path with stub turnstile', async ({ page }) => {
    await page.route('**/api/leads', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          leadId: 'e2elead01',
          receivedAt: new Date().toISOString(),
          phoneE164: null,
          locale: 'ua',
          source: 'hero',
        }),
      })
    })

    const form = await openLeadForm(page)
    await form.locator('#lead-from').fill('Kyiv')
    await form.locator('#lead-to').fill('Warsaw')
    await form.locator('#lead-consent').check()
    await form.getByRole('button', { type: 'submit' }).click()

    await expect(page.locator('.lead-thank-you')).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('messenger CTA', () => {
  test('hero messenger buttons do not crash page', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)
    const messenger = page.locator('.hero__messengers .ui-messenger-link').first()
    await expect(messenger).toBeVisible()
    await messenger.click()
    await expect(page.locator('body')).toBeVisible()
  })
})
