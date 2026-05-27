# VPS deployment (primary)

Stack: **Nuxt 3 + Nitro `node-server`** behind nginx, Upstash Redis/KV, Node 24+.

## Build & run

```bash
cp .env.example .env   # fill production values
pnpm install
pnpm build
NODE_ENV=production node .output/server/index.mjs
```

Or Docker:

```bash
docker build -t easy-west .
docker run --env-file .env -p 3000:3000 easy-west
```

## Environment

| Variable | Purpose |
|----------|---------|
| `NUXT_DEPLOY_ENV` | `staging` \| `production` — staging guard for leads email |
| `NUXT_TRUSTED_PROXY` | `true` when behind nginx — use `X-Real-IP` for rate limits |
| `HOST` / `PORT` | Nitro listen (default `0.0.0.0:3000`) |
| `NUXT_*` | See `.env.example` |

## nginx

Use `deploy/nginx.conf.example`. **Must** set `X-Real-IP` (or trusted `X-Forwarded-For` chain).

## Process manager (optional)

```bash
pm2 start .output/server/index.mjs --name easy-west --env production
```

## Static prerender

Locale routes under `/ua/**` and `/ru/**` are prerendered at build time; API routes (`/api/**`) stay dynamic.

## Monitoring

- Sentry: `NUXT_SENTRY_DSN`
- journald / PM2 logs for Nitro output
