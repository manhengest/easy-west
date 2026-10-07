# Deploy to production

Ship `main` to the EASY WEST VPS. Review first. Never print, log, or commit SSH credentials. The VPS always checks out `origin/main` before install and build.

Credentials file: `.env.deploy` (gitignored). Deploy script: `scripts/deploy-prod.sh`.

## Stop

Do not commit, push, or SSH when any of these is true:

- Current branch is not `main`
- Bugbot reports a Critical or High finding
- The review subagent fails
- `git push` is rejected
- `bash scripts/deploy-prod.sh` exits non-zero

## Steps

1. Read `/Users/admin/.cursor/skills-cursor/review-bugbot/SKILL.md` and follow it. Launch one Bugbot subagent (`run_in_background: false`, description `Bugbot`) before any git write or SSH. Prompt:

```text
Full Repository Path: /Users/admin/Projects/easy-west
Diff: branch changes
```

2. Show the review (table, "Bugbot found no bugs", or no diff). Stop on Critical or High.
3. If the working tree has deployable changes, commit them. Match recent `git log` style. Never stage `.env`, `.env.deploy`, or other secrets. Skip this step when the tree is clean.
4. Push `main`: `git push origin main`. No force push. Skip when `main` already matches `origin/main`.
5. Run `bash scripts/deploy-prod.sh` with full permissions. Allow 20 minutes. The script reads `.env.deploy` and on the VPS runs:

```bash
cd /var/www/easy-west
git fetch origin main
git checkout -f -B main origin/main
pnpm install
export NODE_OPTIONS="--max-old-space-size=3072"
export NUXT_OUTPUT_DIR="/var/www/easy-west/.output.next"
rm -rf .output.next
pnpm build
pm2 stop easy-west || true
rm -rf .output.prev
if [[ -d .output ]]; then
  mv .output .output.prev
fi
if ! mv .output.next .output; then
  if [[ -d .output.prev ]]; then
    mv .output.prev .output
  fi
  pm2 restart easy-west --update-env || true
  exit 1
fi
if pm2 restart easy-west --update-env; then
  rm -rf .output.prev
else
  rm -rf .output
  if [[ -d .output.prev ]]; then
    mv .output.prev .output
  fi
  pm2 restart easy-west --update-env || true
  exit 1
fi
```

A failed fetch or checkout of `main`, install, or build failure leaves the current process running. PM2 stops only after the new build is ready to swap in. A failed restart restores the previous build.

6. Report the script exit code and the last 30 lines of output. Do not include secrets.
