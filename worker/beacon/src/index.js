// swaiyu-beacon — anonymous usage beacon for https://sakredstudio.github.io (B3).
//
//   POST /e                 body: text/plain or JSON, {"event":"<name>"} or just "<name>"
//                           → upsert events(day=UTC today, event, country=request.cf.country) n+1
//                           → 204 on success, 400 unknown event, 403 bad origin, 429 rate limited
//   GET  /summary?key=…     → last 30 days as JSON (key must equal the SUMMARY_KEY secret)
//   anything else           → 404
//
// What is stored: the UTC day, the event name, the 2-letter country code, a count.
// What is NOT stored, ever: IP address, user agent, cookies, any id, any timestamp.
// The client IP is read only to key the per-IP rate limiter and never persisted.

const ALLOWED_ORIGINS = new Set([
  "https://sakredstudio.github.io",
  "http://localhost:5173",   // vite dev
  "http://127.0.0.1:5173",
  "http://localhost:4173",   // vite preview
  "http://127.0.0.1:4173",
]);

// Keep in sync with src/lib/beacon.ts in the app repo.
const EVENTS = new Set([
  "open",
  "hero_tap",
  "preorder_click",
  "listen_click",
  "fancard_share",
  "fancard_download",
  "theme_set_night",
  "theme_set_pastel",
  "theme_set_bias",
  "fani_send",
  "ticket_click",
]);

const SUMMARY_DAYS = 30;

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

// Parse "{"event":"open"}" or a bare "open". sendBeacon sends text/plain, so we never
// trust the Content-Type header and always read the body as text.
async function readEvent(request) {
  let text = "";
  try { text = (await request.text()).trim(); } catch { return null; }
  if (!text || text.length > 200) return null;
  if (text.startsWith("{")) {
    try { const o = JSON.parse(text); return typeof o?.event === "string" ? o.event.trim() : null; }
    catch { return null; }
  }
  return text;
}

// Constant-time string compare so the summary key cannot be probed byte by byte.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handleEvent(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return new Response("forbidden", { status: 403 });
  const cors = corsHeaders(origin);

  if (env.RL) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";   // used as a key only, never stored
    try {
      const { success } = await env.RL.limit({ key: ip });
      if (!success) return new Response("rate limited", { status: 429, headers: cors });
    } catch { /* limiter unavailable → let the request through rather than drop data */ }
  }

  const event = await readEvent(request);
  if (!event || !EVENTS.has(event)) return new Response("unknown event", { status: 400, headers: cors });

  const country = (request.cf && typeof request.cf.country === "string" && /^[A-Z]{2}$/.test(request.cf.country))
    ? request.cf.country : "XX";

  await env.DB.prepare(
    "INSERT INTO events (day, event, country, n) VALUES (?1, ?2, ?3, 1) " +
    "ON CONFLICT(day, event, country) DO UPDATE SET n = n + 1"
  ).bind(utcDay(), event, country).run();

  return new Response(null, { status: 204, headers: cors });
}

async function handleSummary(request, env) {
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!env.SUMMARY_KEY || !safeEqual(key, env.SUMMARY_KEY)) return new Response("forbidden", { status: 403 });

  const until = utcDay();
  const since = utcDay(new Date(Date.now() - (SUMMARY_DAYS - 1) * 86400000));
  const { results } = await env.DB.prepare(
    "SELECT day, event, country, n FROM events WHERE day >= ?1 AND day <= ?2 ORDER BY day DESC, event, country"
  ).bind(since, until).all();

  // Per-event totals over the window, so the gate review needs no spreadsheet.
  const totals = {};
  for (const r of results) totals[r.event] = (totals[r.event] || 0) + r.n;

  return json({ since, until, days: SUMMARY_DAYS, totals, rows: results });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/e") {
      if (request.method === "OPTIONS") {
        const origin = request.headers.get("Origin") || "";
        return ALLOWED_ORIGINS.has(origin)
          ? new Response(null, { status: 204, headers: corsHeaders(origin) })
          : new Response("forbidden", { status: 403 });
      }
      if (request.method === "POST") {
        try { return await handleEvent(request, env); }
        catch (err) { return new Response("error", { status: 500 }); }
      }
      return new Response("method not allowed", { status: 405 });
    }

    if (url.pathname === "/summary" && request.method === "GET") {
      try { return await handleSummary(request, env); }
      catch (err) { return new Response("error", { status: 500 }); }
    }

    return new Response("not found", { status: 404 });
  },
};
