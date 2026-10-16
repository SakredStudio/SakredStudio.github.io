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
