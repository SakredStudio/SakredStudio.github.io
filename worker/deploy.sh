#!/usr/bin/env sh
# One-shot deploy of both Workers. Run from anywhere after `npx wrangler login`:
#     sh worker/deploy.sh
# Idempotent except the SUMMARY_KEY prompt; re-run with SKIP_SECRET=1 to skip that step.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"

echo "── 1/4  D1 schema (events + counters) on database swaiyu"
cd "$here/beacon"
npx wrangler d1 execute swaiyu --file schema.sql --remote

if [ -z "${SKIP_SECRET:-}" ]; then
  echo "── 2/4  SUMMARY_KEY secret — paste a long random string (protects GET /summary)"
  npx wrangler secret put SUMMARY_KEY
else
  echo "── 2/4  SUMMARY_KEY skipped (SKIP_SECRET set)"
fi

echo "── 3/4  deploy swaiyu-beacon"
npx wrangler deploy

echo "── 4/4  deploy fandrop-ai with the daily cap (ANTHROPIC_API_KEY secret is kept)"
cd "$here/fandrop-ai"
npx wrangler deploy

echo
echo "Done. Verify:"
echo "  curl -i -X POST https://swaiyu-beacon.mihir86-mp.workers.dev/e -H 'Origin: https://sakredstudio.github.io' --data '{\"event\":\"open\"}'   # expect 204"
echo "  npx wrangler d1 execute swaiyu --remote --command 'SELECT * FROM events'"
