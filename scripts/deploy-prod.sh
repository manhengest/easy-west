#!/usr/bin/env bash
# SSH deploy for /deploy. Reads gitignored .env.deploy. Does not print the password.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT/.env.deploy}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (copy .env.deploy.example)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DEPLOY_SSH_HOST:?DEPLOY_SSH_HOST is required}"
: "${DEPLOY_SSH_USER:?DEPLOY_SSH_USER is required}"
: "${DEPLOY_SSH_PASSWORD:?DEPLOY_SSH_PASSWORD is required}"

if [[ "${1:-}" == "--check" ]]; then
  REMOTE=$'echo deploy-ssh-ok\nhostname'
else
  REMOTE=$(cat << 'EOF'
set -euo pipefail
cd /var/www/easy-west
git fetch origin main
git checkout -f -B main origin/main
pnpm install
export NODE_OPTIONS="--max-old-space-size=3072"
# Build beside the live bundle. Pull, install, build, and a failed directory
# swap leave PM2 running. Restart runs only after .output is the new build.
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
EOF
)
fi

REMOTE_B64="$(printf '%s' "$REMOTE" | base64 | tr -d '\n')"
export REMOTE_B64

expect << 'EXPECT'
set timeout 1200
log_user 1
set password $env(DEPLOY_SSH_PASSWORD)
set remote_b64 $env(REMOTE_B64)
set target "$env(DEPLOY_SSH_USER)@$env(DEPLOY_SSH_HOST)"
set remote_cmd [format {echo %s | base64 -d | bash -l} $remote_b64]
spawn -noecho ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=keyboard-interactive,password -o PubkeyAuthentication=no -o NumberOfPasswordPrompts=1 $target $remote_cmd
expect {
  -re {(?i)are you sure you want to continue connecting} {
    send "yes\r"
    exp_continue
  }
  -re {(?i)password:} {
    send -- $password
    send "\r"
  }
  eof {
    catch wait result
    exit [lindex $result 3]
  }
  timeout {
    puts stderr "SSH timed out waiting for a password prompt"
    exit 2
  }
}
expect {
  -re {Permission denied} {
    puts stderr "SSH authentication failed"
    exit 1
  }
  eof
}
catch wait result
set code [lindex $result 3]
if {$code eq ""} {
  exit 1
}
exit $code
EXPECT
