# fandrop-ai — daily global cap (BUILD-PLAN-V2.md item B4)

The FANI proxy (`https://fandrop-ai.mihir86-mp.workers.dev`) lives outside this repo in the
`fandrop-worker` folder. This file is the complete change to apply there: a D1 counter on
the shared `swaiyu` database that refuses with **HTTP 429 `{"error":"daily_cap"}`** once
**2,000 requests** have been served in a UTC day. The app (`src/lib/ai.ts`) recognises that
exact body and shows "FANI is resting, back tomorrow 💜" instead of an error.

Why a hard cap: FANI is free for users and billed to the owner. 2,000 Haiku requests at
≤1,024 output tokens is a few dollars a day at most; without the cap a single viral day or a
scraper that finds the endpoint is an open-ended bill (ROADMAP.md §4).

> **Shortcut:** the same code and config are checked in as a deployable folder at
> `worker/fandrop-ai/` (`wrangler.toml` + `src/index.js`). `sh worker/deploy.sh` deploys both
> Workers in one go. The sections below are the same change spelled out for applying to the
> external `fandrop-worker` folder instead; use one or the other, not both.

## 1. Prerequisite — the D1 database and table already exist

`worker/beacon/README.md` steps 2–4 create the `swaiyu` database and run `schema.sql`, which
contains the `counters` table this Worker needs:

```sql
CREATE TABLE IF NOT EXISTS counters (
  day TEXT PRIMARY KEY,                  -- 'yyyy-mm-dd' (UTC)
  n   INTEGER NOT NULL DEFAULT 0
);
```

Do the beacon setup first. Both Workers bind the same `database_id`.

## 2. `fandrop-worker/wrangler.toml` — add the D1 binding

Append these lines (keep the existing `[[ratelimits]]` block named `RATE_LIMITER` and everything else as is).
The `database_id` below is the real id of the `swaiyu` database (created 2026-10-16); it
matches `worker/beacon/wrangler.toml`.

```toml
# Shared D1 (same database as swaiyu-beacon). Holds counters(day, n) for the daily cap.
[[d1_databases]]
binding = "DB"
database_name = "swaiyu"
database_id = "74abedb6-5c46-4018-a026-a47639b806f2"

[vars]
DAILY_CAP = "2000"
```

## 3. `fandrop-worker/src/index.js` — complete replacement

This is the Worker code that was live on 2026-08-14 (read back from the deployed script)
with one addition: `takeDailySlot()` and the `daily_cap` check between the body check and
the upstream call. Origin allowlist, the `RATE_LIMITER` binding, the model allowlist
(Haiku 4.5 + Sonnet 4.6, unknown → Haiku), the 1,024 `max_tokens` cap and the
`ANTHROPIC_API_KEY` secret are untouched. Overwrite `src/index.js` with it.

```js
// fandrop-ai — FANI proxy for https://sakredstudio.github.io
// Browser → POST / {model, max_tokens, system, messages} → Anthropic Messages API.
// Guards, in order: origin allowlist → per-IP rate limit (RATE_LIMITER) → body check →
// DAILY GLOBAL CAP (D1 `counters`) → model allowlist + max_tokens cap → upstream.
// Everything except the cap is the code that was live on 2026-08-14, unchanged.

const ALLOWED_MODELS = new Set([
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
]);
const MAX_TOKENS_CAP = 1024;
const ALLOWED_ORIGINS = new Set([
  "https://sakredstudio.github.io",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
]);
const DEFAULT_DAILY_CAP = 2000;

const utcDay = () => new Date().toISOString().slice(0, 10);

// Reserve one slot for today. true → serve; false → cap reached. One D1 batch (insert-if-
// missing + conditional increment) so two requests racing at the limit cannot both pass.
// If D1 itself is down we fail OPEN: a broken counter must not take FANI down with it
// (the per-IP rate limit still applies).
async function takeDailySlot(env) {
  if (!env.DB) return true;
  const cap = Number.parseInt(env.DAILY_CAP, 10) || DEFAULT_DAILY_CAP;
  const day = utcDay();
  try {
    const [, upd] = await env.DB.batch([
      env.DB.prepare("INSERT INTO counters (day, n) VALUES (?1, 0) ON CONFLICT(day) DO NOTHING").bind(day),
      env.DB.prepare("UPDATE counters SET n = n + 1 WHERE day = ?1 AND n < ?2 RETURNING n").bind(day, cap),
    ]);
    return (upd.results || []).length > 0;
  } catch (err) {
    console.error("daily cap check failed", err);
    return true;
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const originAllowed = ALLOWED_ORIGINS.has(origin);

    if (request.method === "OPTIONS") {
      if (!originAllowed) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (!originAllowed) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const headers = cors(origin);
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...headers } });

    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Per-IP rate limit (native binding). The IP is a key only, never stored.
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return json({ error: "rate_limited" }, 429);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: "messages required" }, 400);
    }

    // Daily global cap, taken only for a request that will actually reach upstream — the app
    // renders this exact body as "FANI is resting, back tomorrow 💜".
    if (!(await takeDailySlot(env))) return json({ error: "daily_cap" }, 429);

    const model = ALLOWED_MODELS.has(body.model) ? body.model : "claude-haiku-4-5-20251001";
    const max_tokens = Math.min(body.max_tokens || 1024, MAX_TOKENS_CAP);
    const payload = { model, max_tokens, messages: body.messages };
    if (body.system) payload.system = body.system;

    let upstream;
    try {
      upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return json({ error: "Upstream request failed" }, 502);
    }
    const data = await upstream.text();
    return new Response(data, { status: upstream.status, headers: { "content-type": "application/json", ...headers } });
  },
};

function cors(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}
```

## 4. Owner commands

```sh
cd fandrop-worker          # the folder outside this repo that holds the FANI Worker

# (if not already logged in from the beacon setup)
npx wrangler login

# The counters table is created by worker/beacon/README.md step 4 (schema.sql has both
# tables). If you skipped that, run it from the app repo's worker/beacon folder:
#   npx wrangler d1 execute swaiyu --file schema.sql --remote

# The API key secret is unchanged; only set it again if it was never set:
# npx wrangler secret put ANTHROPIC_API_KEY

npx wrangler deploy
```

## 5. Verify

```sh
# Today's count so far (one row per UTC day):
npx wrangler d1 execute swaiyu --remote --command "SELECT * FROM counters ORDER BY day DESC LIMIT 7"

# Force the cap for a test, then undo it:
npx wrangler d1 execute swaiyu --remote --command "UPDATE counters SET n = 2000 WHERE day = date('now')"
#   → FANI in the app now shows "FANI is resting, back tomorrow 💜"; the chant generator toasts the same.
npx wrangler d1 execute swaiyu --remote --command "UPDATE counters SET n = 0 WHERE day = date('now')"

# Change the cap without a redeploy of code: edit DAILY_CAP under [vars] and `npx wrangler deploy`.
```

Counter semantics: a slot is taken before the upstream call, so a request that then fails
upstream still counts. That errs on the side of the bill, which is the point. Rows are one
per day and never need cleanup.
