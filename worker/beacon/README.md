# swaiyu-beacon — anonymous usage beacon (B3) + shared D1 for the FANI cap (B4)

A Cloudflare Worker on the free plan that counts app events per **UTC day × event × country**
in a D1 table. It stores nothing that can identify a person: no IP, no user agent, no ids,
no fine-grained timestamps. The same D1 database (`swaiyu`) also holds the `counters`
table the FANI daily cap uses (see `../fandrop-ai-daily-cap.patch.md`), so one
`d1 execute` sets up both.

The app already sends events to `https://swaiyu-beacon.mihir86-mp.workers.dev/e`
(`src/lib/beacon.ts`) and never throws if the Worker is missing, so the app can ship before
this is deployed; the counters just stay at zero until it is.

## Owner commands — run from this folder, in this order

Needs Node 18+ and a Cloudflare account (the one that owns `fandrop-ai`). `npx wrangler`
avoids a global install; `wrangler` alone works if it is already installed.

```sh
cd worker/beacon

# 1. Log in once (opens the browser).
npx wrangler login

# 2. Create the D1 database. Copy the database_id the command prints.
npx wrangler d1 create swaiyu

# 3. Paste that id into wrangler.toml, replacing
#    REPLACE_WITH_DATABASE_ID_FROM_wrangler_d1_create  (keep the quotes).

# 4. Create both tables (events for the beacon, counters for the FANI cap).
npx wrangler d1 execute swaiyu --file schema.sql --remote

# 5. Set the key that protects GET /summary. Pick a long random string and keep it.
npx wrangler secret put SUMMARY_KEY

# 6. Deploy. The URL must come out as https://swaiyu-beacon.mihir86-mp.workers.dev
npx wrangler deploy
```

Then redeploy the FANI Worker with the D1 binding — commands are in
`../fandrop-ai-daily-cap.patch.md`.

## Verify after deploy

```sh
# Allowed origin → 204 and the row for today/open/<your country> goes up by one.
curl -i -X POST https://swaiyu-beacon.mihir86-mp.workers.dev/e \
  -H "Origin: https://sakredstudio.github.io" -H "Content-Type: text/plain" \
  --data '{"event":"open"}'

# Another origin → 403.
curl -i -X POST https://swaiyu-beacon.mihir86-mp.workers.dev/e \
  -H "Origin: https://example.com" --data '{"event":"open"}'

# Unknown event name → 400.
curl -i -X POST https://swaiyu-beacon.mihir86-mp.workers.dev/e \
  -H "Origin: https://sakredstudio.github.io" --data '{"event":"anything"}'

# Last 30 days as JSON (per-event totals + raw rows). Replace <SUMMARY_KEY>.
curl "https://swaiyu-beacon.mihir86-mp.workers.dev/summary?key=<SUMMARY_KEY>"

# Or straight from D1:
npx wrangler d1 execute swaiyu --remote --command "SELECT * FROM events ORDER BY day DESC LIMIT 50"
```

## What the Worker does

| Route | Behaviour |
|---|---|
| `POST /e` | Origin must be `https://sakredstudio.github.io` or a localhost dev origin, else 403. Per-IP rate limit 60 / 60 s (429). Body is `{"event":"name"}` or a bare `name` (text/plain, so `navigator.sendBeacon` needs no preflight). `event` must be one of: `open`, `hero_tap`, `preorder_click`, `listen_click`, `fancard_share`, `fancard_download`, `theme_set_night`, `theme_set_pastel`, `theme_set_bias`, `fani_send`, `ticket_click` (else 400). Upserts `n + 1` keyed by UTC day + event + `request.cf.country`. Returns 204. |
| `GET /summary?key=…` | `key` must equal the `SUMMARY_KEY` secret (403 otherwise). Returns `{since, until, days, totals: {event: n}, rows: [{day, event, country, n}]}` for the last 30 days. |
| anything else | 404 |

## Changing the event list

Add the name to `EVENTS` in `src/index.js` here **and** to the comment in the app's
`src/lib/beacon.ts`, then `npx wrangler deploy`. Unknown names are rejected with 400 so a typo
in the app cannot create junk rows.

## Cost

Free plan: 100k Worker requests/day and 5 GB / 5M D1 rows read per day; this table grows by
at most (events × countries) rows per day, so it stays in the free tier indefinitely.
