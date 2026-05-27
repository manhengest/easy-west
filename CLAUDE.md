# EASY WEST — Agent Guide

Nuxt 3 marketing landing for **EASY WEST** relocation services. Ukrainian and Russian locales (`/ua/`, `/ru/`), mobile-first UX, lead capture API, GTM/Consent Mode v2, VPS-first deploy (Nitro `node-server` + nginx).

## Before you run anything

**Switch Node version first.** The repo pins Node via `.nvmrc` (currently **24**; `package.json` requires `>=24`):

```bash
nvm use --lts
```

Then use **pnpm** (see `packageManager` in `package.json`):

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Production build:

```bash
pnpm build
NODE_ENV=production pnpm start
```

## Documentation & libraries

**Use [Context7](https://context7.com)** when working with framework or library code (Nuxt, Vue, Tailwind, i18n, VeeValidate, etc.) so API usage matches current versions — do not rely on stale training data alone.

## Stack

| Area | Choice |
|------|--------|
| Framework | Nuxt 3 + Vue 3 + TypeScript |
| Styling | Tailwind CSS v4 + SCSS (BEM blocks, split CSS entry) |
| i18n | `@nuxtjs/i18n` v9 — prefix routes `/ua/`, `/ru/` |
| Deploy | Nitro `node-server` (VPS + nginx); portable KV (Upstash) |
| Forms | VeeValidate + Zod; `libphonenumber-js` for phone |
| Fonts | Self-hosted Inter (`@nuxt/fonts`, `@fontsource/inter`) |

## Common scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build (runs env validation + brand assets) |
| `pnpm typecheck` | `vue-tsc` |
| `pnpm lint` / `pnpm lint:eslint` | Stylelint SCSS / ESLint |
| `pnpm validate:env` | Zod env check |
| `pnpm assets:brand` | Regenerate favicon/OG from `doc/logos/` |

## Project layout

```
components/     # ui/, layout/, sections/
composables/
i18n/locales/   # UA/RU copy
server/api/     # Nitro routes (e.g. leads)
assets/scss/    # BEM blocks
public/brand/   # Generated brand assets
scripts/        # validate-env, brand sync, sitemap checks
doc/            # Product/design spec (UA)
runbooks/       # Deploy ops
```

## Conventions

- **BEM:** block `hero`, element `hero__title`, modifier `ui-button_primary` (single underscore).
- **Locales:** files under `i18n/locales/`; browser language is not auto-applied on first visit — cookie set on explicit locale switch.
- **Env:** validated at build and Nitro cold start; see `.env.example` and `NUXT_*` keys in README.

## Further reading

- [README.md](README.md) — setup, env table, deploy pointers
- [.cursor/plans/easy_west_architecture_47acd201.plan.md](.cursor/plans/easy_west_architecture_47acd201.plan.md) — full architecture & delivery plan
- [runbooks/deploy-vps.md](runbooks/deploy-vps.md) — VPS deployment
