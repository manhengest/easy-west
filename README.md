# EASY WEST

Nuxt 3 landing for EASY WEST relocation services (UA/RU i18n).

## Stack

- Nuxt 3 + Nitro **`node-server`** (VPS-first — nginx reverse proxy)
- Tailwind CSS v4 + SCSS BEM blocks (split CSS entry)
- `@nuxtjs/i18n` v9 (UA at `/`, RU at `/ru/`)
- Self-hosted **Inter** via `@nuxt/fonts` local provider + `@fontsource/inter`

## Setup

Requires **Node.js 22+**.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Production:

```bash
pnpm build
NODE_ENV=production pnpm start
```

See [runbooks/deploy-vps.md](runbooks/deploy-vps.md) and [deploy/nginx.conf.example](deploy/nginx.conf.example).

## Environment highlights

| Variable | Purpose |
|----------|---------|
| `NUXT_DEPLOY_ENV` | `staging` \| `production` |
| `NUXT_PUBLIC_SITE_URL` | Canonical / sitemap base URL |

Locale files: `i18n/locales/` (`langDir: 'locales'` under the i18n module root).

## BEM convention

- Block: `hero`, `ui-button`
- Element: `hero__title`
- Modifier: `ui-button_primary` (single underscore)

## Docs

- Architecture plan: `.cursor/plans/easy_west_architecture_47acd201.plan.md`
