-- swaiyu D1 schema. Apply once with:
--   wrangler d1 execute swaiyu --file schema.sql --remote
-- Both tables are counters only. Nothing in here can identify a person: no IP,
-- no user agent, no device or session id, no timestamp finer than a UTC day.

-- B3 — anonymous beacon: one row per UTC day × event name × ISO country code.
CREATE TABLE IF NOT EXISTS events (
  day     TEXT NOT NULL,                 -- 'yyyy-mm-dd' (UTC)
  event   TEXT NOT NULL,                 -- one of the allowlisted event names
  country TEXT NOT NULL,                 -- request.cf.country (2 letters) or 'XX'
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, country)
);

-- B4 — FANI daily global cap: requests served per UTC day by the fandrop-ai Worker.
CREATE TABLE IF NOT EXISTS counters (
  day TEXT PRIMARY KEY,                  -- 'yyyy-mm-dd' (UTC)
  n   INTEGER NOT NULL DEFAULT 0
);
