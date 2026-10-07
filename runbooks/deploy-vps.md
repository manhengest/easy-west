# VPS deployment (primary)

Stack: **Nuxt 3 + Nitro `node-server`** behind nginx, Node 24+.

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
| `HOST` / `PORT` | Nitro listen (default `0.0.0.0:3000`) |
| `NUXT_*` | See `.env.example` |

## nginx

Use `deploy/nginx.conf.example`.

## Process manager (optional)

```bash
pm2 start .output/server/index.mjs --name easy-west --env production
```

## Production pull deploy

In Cursor chat, run `/deploy` from `main`. That command reviews the branch, pushes `origin/main`, then SSHs to the VPS. The server always checks out `origin/main` before install and build.

SSH-only (no review, no push): `pnpm deploy:prod`. Credentials live in gitignored `.env.deploy` (see `.env.deploy.example`).

On the server the script runs:

```bash
cd /var/www/easy-west
git fetch origin main
git checkout -f -B main origin/main
pnpm install
export NODE_OPTIONS="--max-old-space-size=3072"
export NUXT_OUTPUT_DIR="/var/www/easy-west/.output.next"

bring_back_easy_west() {
  if pm2 describe easy-west >/dev/null 2>&1; then
    pm2 restart easy-west --update-env && return 0
    pm2 start easy-west && return 0
  fi
  if [[ -f .output/server/index.mjs ]]; then
    pm2 start .output/server/index.mjs --name easy-west --env production
    return 0
  fi
  echo "easy-west is stopped and .output/server/index.mjs is missing" >&2
  return 1
}

rm -rf .output.next
pnpm build
rm -rf .output.prev
if [[ -d .output ]]; then
  mv .output .output.prev
fi
if ! mv .output.next .output; then
  if [[ -d .output.prev ]]; then
    mv .output.prev .output
  fi
  exit 1
fi
if pm2 describe easy-west >/dev/null 2>&1; then
  if pm2 restart easy-west --update-env; then
    rm -rf .output.prev
  else
    if [[ -d .output.prev ]]; then
      rm -rf .output
      mv .output.prev .output
    fi
    bring_back_easy_west
    exit 1
  fi
else
  pm2 start .output/server/index.mjs --name easy-west --env production
  rm -rf .output.prev
fi
```

A failed fetch or checkout of `main`, install, build, or a failed directory swap leaves the current process running. Restart runs only after `.output` is the new build. A failed restart restores the previous build and brings `easy-west` back (`pm2 restart`, then `pm2 start` by name, then `pm2 start` from `.output/server/index.mjs`).

## Static prerender

UA routes (`/`, `/privacy`, …) and `/ru/**` are prerendered at build time; API routes (`/api/**`) stay dynamic.

## Monitoring

- journald / PM2 logs for Nitro output
