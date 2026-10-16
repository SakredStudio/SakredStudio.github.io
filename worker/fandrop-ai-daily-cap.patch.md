# fandrop-ai — daily global cap (BUILD-PLAN-V2.md item B4)

The FANI proxy (`https://fandrop-ai.mihir86-mp.workers.dev`) lives outside this repo in the
`fandrop-worker` folder. This file is the complete change to apply there: a D1 counter on
the shared `swaiyu` database that refuses with **HTTP 429 `{"error":"daily_cap"}`** once
**2,000 requests** have been served in a UTC day. The app (`src/lib/ai.ts`) recognises that
exact body and shows "FANI is resting, back tomorrow 💜" instead of an error.

Why a hard cap: FANI is free for users and billed to the owner. 2,000 Haiku requests at
≤1,024 output tokens is a few dollars a day at most; without the cap a single viral day or a
scraper that finds the endpoint is an open-ended bill (ROADMAP.md §4).

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

Append these lines (keep the existing `[[ratelimits]]` block and everything else as is).
`database_id` is the id `wrangler d1 create swaiyu` printed; it is also in
`worker/beacon/wrangler.toml` after step 3 of the beacon README.

```toml
# Shared D1 (same database as swaiyu-beacon). Holds counters(day, n) for the daily cap.
[[d1_databases]]
binding = "DB"
database_name = "swaiyu"
database_id = "<paste the id from `wrangler d1 create swaiyu`>"

[vars]
DAILY_CAP = "2000"
```

## 3. `fandrop-worker/src/index.js` — complete replacement

This keeps everything the current Worker does — origin allowlist, native Rate Limiting
binding (`RL`), model allowlist, 1,024 `max_tokens` cap, `ANTHROPIC_API_KEY` secret — and
adds the daily counter in front of the upstream call. **Before overwriting, diff it against
the deployed copy**: if the live file has extra origins, models or headers, carry them into
the constants at the top.

```js
// fandrop-ai — FANI proxy for https://sakredstudio.github.io
// Browser → POST / {model, max_tokens, system, messages} → Anthropic Messages API.
// Guards, in order: origin allowlist → per-IP rate limit → body + model allowlist →
// DAILY GLOBAL CAP (D1) → max_tokens cap → upstream. The API key never leaves the Worker.

const ALLOWED_ORIGINS = new Set([
  "https://sakredstudio.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const ALLOWED_MODELS = new Set([
  "claude-haiku-4-5-20251001",   // what src/lib/ai.ts sends
]);

const MAX_TOKENS_CAP = 1024;
const MAX_BODY_BYTES = 64 * 1024;   // a FANI conversation is far smaller than this
const DEFAULT_DAILY_CAP = 2000;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});

const json = (body, status, cors) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
  });

const utcDay = () => new Date().toISOString().slice(0, 10);

// Reserve one slot for today. Returns true when the request may be served, false when the
// cap is reached. One D1 batch (insert-if-missing + conditional increment) so two requests
// racing at the limit cannot both get through. If D1 itself is down we fail OPEN: a broken
// counter must not take FANI down with it (the per-IP rate limit still applies).
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
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (!ALLOWED_ORIGINS.has(origin)) return new Response("forbidden", { status: 403 });
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

    // Per-IP rate limit (native binding). The IP is used as a key only, never stored.
    if (env.RL) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      try {
        const { success } = await env.RL.limit({ key: ip });
        if (!success) return json({ error: "rate_limited" }, 429, cors);
      } catch { /* limiter unavailable → continue */ }
    }

    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return json({ error: "too_large" }, 413, cors);
      body = JSON.parse(text);
    } catch {
      return json({ error: "bad_json" }, 400, cors);
    }
    if (!body || typeof body !== "object" || !Array.isArray(body.messages)) {
      return json({ error: "bad_request" }, 400, cors);
    }
    if (!ALLOWED_MODELS.has(body.model)) return json({ error: "model_not_allowed" }, 400, cors);

    // Daily global cap, taken only for a request that will actually reach upstream — the app
    // renders this exact body as "FANI is resting, back tomorrow 💜".
    if (!(await takeDailySlot(env))) return json({ error: "daily_cap" }, 429, cors);

    const maxTokens = Number.isInteger(body.max_tokens) ? body.max_tokens : MAX_TOKENS_CAP;
    const upstreamBody = {
      model: body.model,
      max_tokens: Math.max(1, Math.min(MAX_TOKENS_CAP, maxTokens)),
      messages: body.messages,
      ...(typeof body.system === "string" ? { system: body.system } : {}),
    };

    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(upstreamBody),
    });

    // Pass the Messages API response through unchanged (the app reads content[].text).
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
    });
  },
};
```

## 4. Owner commands

```sh
cd fandrop-worker          # the folder outside this repo that holds the FANI Worker

# (if not already logged in from the beacon setup)
npx wrangler login

# Table already created by worker/beacon/README.md step 4. If you skipped that:
npx wrangler d1 execute swaiyu --file ../SakredStudio.github.io/worker/beacon/schema.sql --remote

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
