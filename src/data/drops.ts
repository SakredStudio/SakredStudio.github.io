import bundled from "../../public/drops.json";

export interface Drop {
  artist: string;
  title: string;
  type: string;
  date: string;          // ISO yyyy-mm-dd
  idol: string | null;   // FULL_CATALOG id where the group exists, else null
  source: string;        // announcement URL (required — see scripts/check-drops.cjs)
  ytUrl: string | null;  // live YouTube search built from the `yt` hint, else artist + title
}

// Shape of public/drops.json: {"updated":"yyyy-mm-dd","drops":[{artist,title,type,date,idol,source,yt?}]}.
// The same file is bundled at build time (fallback) and fetched at runtime (lib/drops.ts
// fetchDrops) so a refresh is a JSON edit on main — no build needed. BUILD-PLAN-V2.md B2.
const yt = (q: string): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

// One row → Drop, or null when it is malformed (missing/empty required field, bad date,
// non-http source). `idol` must be a string or null; `yt` is optional.
export function parseDrop(row: unknown): Drop | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (!str(r.artist) || !str(r.title) || !str(r.type) || !str(r.date) || !str(r.source)) return null;
  if (!ISO_DATE.test(r.date) || Number.isNaN(new Date(r.date).getTime())) return null;
  if (!/^https?:\/\//i.test(r.source)) return null;
  if (!(r.idol === null || str(r.idol))) return null;
  if (!(r.yt === undefined || r.yt === null || typeof r.yt === "string")) return null;
  const hint = typeof r.yt === "string" && r.yt.trim() ? r.yt.trim() : `${r.artist} ${r.title}`;
  return {
    artist: r.artist.trim(), title: r.title.trim(), type: r.type.trim(), date: r.date,
    idol: r.idol === null ? null : r.idol.trim(),
    source: r.source.trim(),
    ytUrl: yt(hint),
  };
}

// Whole payload → Drop[]; malformed rows are dropped, a malformed payload yields null.
export function parseDrops(payload: unknown): Drop[] | null {
  if (!payload || typeof payload !== "object") return null;
  const list = (payload as { drops?: unknown }).drops;
  if (!Array.isArray(list)) return null;
  return list.map(parseDrop).filter((d): d is Drop => d !== null);
}

export const DROPS_UPDATED: string = typeof bundled.updated === "string" ? bundled.updated : "";
export const DROPS: Drop[] = parseDrops(bundled) ?? [];
