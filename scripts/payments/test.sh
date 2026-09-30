#!/bin/bash
# Lance les tests de paiement : copie du projet dans un dossier temporaire, compilation, faux HelloAsso + faux Resend, site sur :3199, tests.
# Usage : bash scripts/payments/test.sh   (depuis la racine du projet ; nécessite node_modules installés)
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
V=/tmp/ddp-pay-test
pkill -f "next start -p 3199" 2>/dev/null || true
pkill -f "scripts/payments/mock-services.mjs" 2>/dev/null || true
mkdir -p $V
rsync -a --delete --exclude .next --exclude node_modules --exclude .data --exclude .git --exclude '.env*' "$ROOT/" $V/
[ -d $V/node_modules ] || cp -cR "$ROOT/node_modules" $V/node_modules 2>/dev/null || cp -R "$ROOT/node_modules" $V/node_modules
cd $V && rm -rf .data && npm run build > /tmp/ddp-pay-build.log 2>&1 || { tail -20 /tmp/ddp-pay-build.log; exit 1; }
node "$V/scripts/payments/mock-services.mjs" > /tmp/ddp-pay-mocks.log 2>&1 &
env SESSION_INSECURE_COOKIE=1 CRON_SECRET=cron-secret-1234567890 \
  HELLOASSO_ENV=sandbox HELLOASSO_CLIENT_ID=id HELLOASSO_CLIENT_SECRET=secret HELLOASSO_ORGANIZATION_SLUG=lesdames HELLOASSO_API_BASE=http://127.0.0.1:4599 \
  HELLOASSO_WEBHOOK_SECRET=webhook-secret-1234567890 HELLOASSO_SIGNATURE_KEY=sigkey-abc \
  RESEND_API_KEY=re_test RESEND_API_URL=http://127.0.0.1:4598 \
  NEXT_PUBLIC_SITE_URL=http://localhost:3199 npx next start -p 3199 > /tmp/ddp-pay-site.log 2>&1 &
sleep 5
set +e
DATA_DIR=$V/.data SITE=http://localhost:3199 node "$V/scripts/payments/run-tests.mjs"
CODE=$?
pkill -f "next start -p 3199" 2>/dev/null; pkill -f "scripts/payments/mock-services.mjs" 2>/dev/null
exit $CODE
