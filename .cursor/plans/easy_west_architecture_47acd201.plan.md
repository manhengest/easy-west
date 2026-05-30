---
name: EASY WEST Architecture
overview: "Nuxt 3 + Tailwind v4 + SCSS (BEM) landing for EASY WEST relocation: UA/RU i18n, GTM/Consent Mode v2, Nitro lead API (E.164, zod, in-memory idempotency, Turnstile verify + Resend + Telegram notify). VPS-first (node-server + nginx). Prerendered locales, @nuxtjs/sitemap, security headers, brand asset script."
todos:
  - id: tailwind-spike
    content: Phase 0 — Tailwind v4 + SCSS split entry (`tailwind.css` + `main.scss` via @tailwindcss/postcss)
    status: completed
  - id: bootstrap-nuxt
    content: Nuxt 3, i18n v9, sitemap, sass, @nuxt/icon, motion, image, fonts, scripts; nitro preset node-server; pnpm lockfile
    status: completed
  - id: env-validation
    content: zod env-schema — prebuild + nuxt.config + Nitro plugin; staging guard for prod LEADS_TO_EMAIL
    status: completed
  - id: security-headers
    content: Nitro baseline headers (HSTS, XFO, XCTO, Referrer-Policy, Permissions-Policy); CSP Report-Only → enforce (GTM + Turnstile)
    status: completed
  - id: brand-assets
    content: scripts/generate-brand-assets.mjs — favicon, apple-touch, og-default; prebuild hook
    status: completed
  - id: bem-tailwind-foundation
    content: split-entry CSS; stylelint BEM single-underscore; tokens in _tokens.scss only
    status: completed
  - id: i18n-seo-shell
    content: prefix /ua/ /ru/; locale cookie on explicit switch only; useLocaleHead; legal + accessibility pages
    status: completed
  - id: layout-primitives
    content: SiteHeader/Footer/StickyMobileBar; UiButton/Input/Accordion; overlays with focus trap, inert, ESC
    status: completed
  - id: sections-mvp
    content: 8 sections; lazy europe.svg; PhotoSwipe/Embla ClientOnly; reduced-motion presets
    status: completed
  - id: fonts-cyrillic
    content: Self-hosted Inter (latin + cyrillic) via @nuxt/fonts + @fontsource/inter sync
    status: completed
  - id: gtm-consent
    content: GTM @nuxt/scripts manual trigger; Consent Mode v2; Accept/Reject parity; dataLayer events
    status: completed
  - id: accessibility-page
    content: pages/accessibility.vue per locale; footer link; sitemap
    status: completed
  - id: lead-validation
    content: libphonenumber-js E.164; vee-validate + zod; idempotencyKey; consentPolicyVersion; honeypot; attribution
    status: completed
  - id: leads-api
    content: POST /api/leads — Turnstile verify; Resend + Telegram notify; in-memory idempotency (single-process)
    status: completed
  - id: email-domain-auth
    content: Resend verified domain; SPF/DKIM/DMARC before go-live
    status: pending
  - id: sitemap-i18n
    content: CI asserts /ua/+/ru/ URLs and hreflang; x-default → /ua/
    status: in_progress
  - id: qa-ci
    content: lint, typecheck, build, Playwright form + sitemap; lighthouse warn-then-block
    status: pending
  - id: deploy-vps
    content: Production .env on VPS; nginx; pm2 optional; preview QA
    status: pending
isProject: true
---

# EASY WEST — Architecture & Delivery Plan

> **Stack status (2026-05):** Simplified from the original spec. Removed for now: Upstash Redis/KV, QStash, external consent DB, hash salts, Sentry, `wicg-inert`, `@tailwindcss/vite`. See git history / PR notes for rationale.

## Sources

- Product spec: [doc/ПОВНЕ ТЕХНІЧНЕ ЗАВДАННЯ ДЛЯ ДИЗАЙНУ LANDING PAGE EASY WEST.md](doc/ПОВНЕ ТЕХНІЧНЕ ЗАВДАННЯ ДЛЯ ДИЗАЙНУ LANDING PAGE EASY WEST.md)
- Brand: `doc/logos/` → `pnpm assets:brand` → `public/brand/`, favicon, OG
- **Deploy:** VPS-first — Nitro `node-server` + nginx ([runbooks/deploy-vps.md](runbooks/deploy-vps.md))
- **Package manager:** pnpm, Node ≥24

---

## 1. Stack (current)

| Area | Choice | Notes |
|------|--------|-------|
| Framework | Nuxt 3 + Vue 3 + TypeScript | |
| CSS | Tailwind v4 + SCSS BEM | `@tailwindcss/postcss` in `nuxt.config.ts`; split `assets/css/tailwind.css` + `assets/scss/main.scss` |
| i18n | `@nuxtjs/i18n` v9 | `strategy: 'prefix'`, `ua` + `ru` |
| Sitemap | `@nuxtjs/sitemap` v7 | `site.url` required; no manual `server/routes/sitemap.xml.ts` |
| Icons | `@nuxt/icon` | `lucide`, `simple-icons` |
| Motion | `@vueuse/motion` + `@vueuse/core` | `useMotionPresets` + `usePreferredReducedMotion` |
| Images | `@nuxt/image` | IPX default |
| Fonts | `@nuxt/fonts` + `@fontsource/inter` | Self-hosted; `scripts/sync-fonts.mjs` |
| Forms | `vee-validate` + `zod` + `libphonenumber-js` | |
| Analytics | `@nuxt/scripts` + GTM | `trigger: 'manual'` until consent |
| Bot defense | Cloudflare Turnstile | `UiTurnstile` widget + server verify (`server/utils/turnstile.ts`); prod rejects `stub-*` tokens |
| Lead notify | Resend + Telegram Bot API | Wired in `server/utils/lead-notify.ts`; fetch to Resend + Telegram Bot API; masked phone in TG |
| Gallery / reviews | `photoswipe`, `embla-carousel-vue` | ClientOnly / dynamic import |

**Explicitly not in scope (v1):**

- Upstash Redis rate limiting, KV lead log, QStash retry queue
- External consent proof database + `PHONE_HASH_SALT` / `LEAD_IP_SALT`
- `@sentry/nuxt` — use nginx/PM2 logs until needed

---

## 2. Runtime diagram

```mermaid
flowchart LR
  subgraph build [Build]
    Prerender["prerender /ua/, /ru/"]
    Sitemap["@nuxtjs/sitemap"]
  end
  subgraph runtime [Runtime]
    Page["Vue sections"]
    API["POST /api/leads"]
    TS["Turnstile verify"]
    Mail["Resend email"]
    TG["Telegram ops"]
  end
  Prerender --> Page
  Page --> API
  API --> TS
  API --> Mail
  API --> TG
```

- **Prerender:** `/ua/**`, `/ru/**` static pages (landing, legal, accessibility)
- **Dynamic:** `/api/**` only
- **Idempotency today:** in-process `Map` in `leads.post.ts` (fine for single Nitro worker; replace with Redis/file if you scale horizontally)

---

## 3. Folder structure (actual)

```
easy-west/
├── nuxt.config.ts
├── scripts/
│   ├── validate-env.ts
│   ├── generate-brand-assets.mjs
│   └── sync-fonts.mjs
├── assets/css/tailwind.css      # @import tailwindcss + @theme
├── assets/scss/main.scss        # BEM blocks
├── components/                  # layout/, ui/, sections/
├── composables/                 # useLeadForm, useTurnstile, useConsent, useGtm, …
├── i18n/locales/ua.json, ru.json
├── pages/                       # index, privacy, cookies, terms, accessibility
├── server/
│   ├── plugins/00-env.ts
│   ├── api/leads.post.ts
│   └── utils/env-schema.ts, env.ts, turnstile.ts, lead-notify.ts
├── shared/mask-phone.ts, lead-schema.ts, lead-constants.ts
├── components/ui/UiTurnstile.vue
├── plugins/gtm.client.ts
└── public/brand/, fonts/, maps/, images/
```

**BEM:** `block__element`, modifier `block_modifier` (single underscore). Templates use BEM classes only (+ `v-motion` where needed).

**Overlays:** native `inert` on `.site` with `aria-hidden` fallback (`useOverlayInert`) — no `wicg-inert` polyfill.

---

## 4. Tailwind + SCSS

- **Strategy A (locked):** `css: ['~/assets/css/tailwind.css', '~/assets/scss/main.scss']`
- **Postcss:** `@tailwindcss/postcss` in `vite.css.postcss.plugins` — not `@tailwindcss/vite`
- **`_tokens.scss`:** SCSS variables only; colors in `@theme` inside `tailwind.css`
- **stylelint:** BEM single-underscore pattern

---

## 5. SEO & i18n

- Locales: `/ua/`, `/ru/`; `defaultLocale: 'ua'`
- `detectBrowserLanguage.useCookie: false` — cookie set only on explicit `LocaleSwitcher` click
- `useLocaleHead({ seo: true })` + `useSeoMeta` per page
- `x-default` → `/ua/` (primary market)
- Sitemap: module auto-integrates with i18n when both installed
- CI: `pnpm verify:sitemap` / `verify:prerender`

---

## 6. Lead pipeline (simplified)

### Request flow

```mermaid
sequenceDiagram
  participant User
  participant Form as LeadForm
  participant API as POST_/api/leads
  participant TS as Turnstile
  participant Mail as Resend
  participant TG as Telegram

  User->>Form: submit + GDPR checkbox + Turnstile token
  Form->>API: JSON + idempotencyKey + attribution
  API->>API: zod + E.164 phone
  API->>TS: verify (prod; staging allows stub-*)
  API->>Mail: send lead email (Resend)
  API->>TG: masked ops message (Telegram)
  API->>Form: 200 (502 if both notify channels fail)
```

### Schema highlights (`shared/lead-schema.ts`)

| Field | Notes |
|-------|--------|
| `idempotencyKey` | UUID; server dedupes in memory |
| `phone` | National input per locale → E.164 |
| `consentAccepted` | must be `true` |
| `consentPolicyVersion` | e.g. `2026-05-27` (in payload, not external DB) |
| `turnstileToken` | required; prod rejects `stub-*`; staging skips verify for `stub-*` |
| `website` | honeypot, empty |

### Phase 4 — lead notify (done)

1. ~~Turnstile server verify~~ — `server/utils/turnstile.ts` (hostname, action `lead_submit`, token age)
2. ~~Resend email~~ — `server/utils/lead-notify.ts` → `NUXT_LEADS_TO_EMAIL` with full lead fields
3. ~~Telegram ops message~~ — masked phone via `shared/mask-phone.ts`, route, source, `leadId`
4. ~~Turnstile widget~~ — `UiTurnstile` + `useTurnstile` on `LeadForm`
5. In-memory idempotency retained; upgrade if running multiple Node workers

### GDPR (pragmatic v1)

| Topic | Approach |
|-------|----------|
| Lawful basis | Consent checkbox + privacy policy link |
| Proof | `consentPolicyVersion` + server `receivedAt` in email/logs |
| Processors | Disclose Resend, Telegram, Cloudflare Turnstile in privacy policy |
| Analytics cookies | Separate `CookieBanner` + GTM Consent Mode v2 |

---

## 7. Environment variables

Validated at build + Nitro boot (`server/utils/env-schema.ts`):

| Variable | Purpose |
|----------|---------|
| `NUXT_PUBLIC_SITE_URL` | Canonical / sitemap |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget |
| `NUXT_PUBLIC_GTM_ID` | Optional |
| `NUXT_PUBLIC_CONTACT_*` | Messenger / phone links |
| `NUXT_DEPLOY_ENV` | `staging` \| `production` |
| `NUXT_RESEND_API_KEY` | Email API |
| `NUXT_LEADS_FROM_EMAIL` / `NUXT_LEADS_TO_EMAIL` | Sender / recipient |
| `NUXT_PROD_LEADS_TO_EMAIL` | Staging guard vs prod inbox |
| `NUXT_TELEGRAM_BOT_TOKEN` / `NUXT_TELEGRAM_CHAT_ID` | Ops notifications |
| `NUXT_TURNSTILE_SECRET` | Server-side Turnstile verify |

See [.env.example](.env.example).

**Validation layers:** `nuxt.config.ts` top-level `parseServerEnv`, `scripts/validate-env.ts` (prebuild), `server/plugins/00-env.ts`.

---

## 8. Security

**Headers (live):** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` via `routeRules`.

**CSP (phased):** Report-Only on staging → enforce in prod. Allowlist:

- GTM: `googletagmanager.com`
- Turnstile: `challenges.cloudflare.com`

---

## 9. GTM & attribution

- `@nuxt/scripts` with `trigger: 'manual'` until `useConsent().grantAnalytics()`
- Banner: Accept all / Reject all equal prominence
- Events: `lead_submit_*`, messenger clicks, `locale_switch`, scroll depth (see composables)
- `useLeadAttribution`: UTM + referrer cookie → hidden form fields

---

## 10. Roadmap

| Phase | Status | Focus |
|-------|--------|--------|
| 0–4 | Done | Bootstrap, UI, sections, GTM, fonts, a11y, lead form + notify pipeline |
| 5 | **Next** | Sitemap CI, Playwright, Lighthouse budgets |
| 6 | Pending | VPS production deploy, Resend domain auth |

**Removed / deferred todos:** `kv-retention`, `error-monitoring` (Sentry), Upstash rate limits, QStash notify queue, DSAR script tied to external consent DB.

---

## 11. VPS deploy

- Build: `pnpm build` → `.output/server/index.mjs`
- Run behind nginx ([deploy/nginx.conf.example](deploy/nginx.conf.example))
- `NUXT_DEPLOY_ENV=production` + real Turnstile keys for prod
- Required for lead notify: `NUXT_RESEND_API_KEY`, `NUXT_LEADS_FROM_EMAIL`, `NUXT_LEADS_TO_EMAIL`, `NUXT_TELEGRAM_BOT_TOKEN`, `NUXT_TELEGRAM_CHAT_ID` (real chat ID, not placeholder)
- Logs: journald / PM2 — watch for `[leads] Resend failed`, `[leads] Telegram failed`, `[leads] Partial notification failure`

---

## 12. Testing & CI (target)

| Check | Tool |
|-------|------|
| Lint | eslint + stylelint |
| Types | `vue-tsc` |
| Env | `validate-env.ts` in prebuild |
| Build | `nuxt build` |
| E2E | Playwright — form happy path, idempotency double-submit, Turnstile 403, sitemap hreflang |
| A11y | axe on landing + overlays |

---

## 13. Open items

- Resend domain SPF/DKIM/DMARC (see `email-domain-auth` todo)
- Telegram bot + staging vs prod chat IDs on VPS
- GTM container ID
- Privacy policy copy (processors, retention)
- Turnstile staging + prod site keys verified on `easy-west.com`
- Legal copy for `accessibility.vue`
- CSP enforce after Report-Only review
- E2E: form happy path, idempotency double-submit, Turnstile 403, notify failure 502

---

## 14. Future enhancements (only if needed)

- **Rate limiting:** nginx `limit_req` or small Redis — if abuse appears
- **Durable idempotency / lead log:** SQLite on VPS or managed DB — if multi-instance or audit required
- **Sentry:** re-add `@sentry/nuxt` + `NUXT_SENTRY_DSN` when error volume justifies it
- **Async notify retries:** cron or queue if Resend/Telegram flakiness hurts ops
