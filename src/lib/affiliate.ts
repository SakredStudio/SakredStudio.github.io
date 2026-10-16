// Outbound commerce links. The global vglnk.js script (index.html) rewrites these at
// click time for affiliate credit; nothing here needs a key.

// Ticket provider (case-insensitive) → that provider's search-results URL for the
// given artist, so "Check resale" lands on the artist's listings.
const TICKET_SEARCH_TEMPLATES: Record<string, string> = {
  "vivid seats": "https://www.vividseats.com/search?searchTerm={q}",
  "stubhub": "https://www.stubhub.com/secure/Search?q={q}",
};
export function buildTicketSearchUrl(provider: string, query: string): string | null {
  if (typeof provider !== "string" || typeof query !== "string") return null;
  const tpl = TICKET_SEARCH_TEMPLATES[provider.trim().toLowerCase()];
  if (!tpl) return null;
  return tpl.replace("{q}", encodeURIComponent(query));
}

// Live, never-stale concert lookup: deep-link straight into Ticketmaster's search for a
// followed group. Every current date (incl. ones a static list would miss) shows there.
export const concertSearchUrl = (group: string): string =>
  `https://www.ticketmaster.com/search?q=${encodeURIComponent(group)}`;

export const isHttpUrl = (u: unknown): u is string =>
  typeof u === "string" && /^https?:\/\//i.test(u);

// Album pre-order / purchase search. Ktown4u is the pre-order shop fans already use (POB
// photocards, group orders) and its search page answers 200 for `?keyword=`; YesStyle is
// the fallback for the "Buy album" link on released titles. Both are in the Sovrn network.
// Titles like "Looks Can Kill (pre-release)" or "Prologue Single (title TBA)" would poison a
// shop search, so parentheticals are dropped and a TBA title falls back to the artist alone.
const searchTerm = (artist: string, title: string): string =>
  /tba/i.test(title) ? artist : `${artist} ${title.replace(/\(.*?\)/g, "")}`.replace(/\s+/g, " ").trim();
export const preorderUrl = (artist: string, title: string): string =>
  `https://www.ktown4u.com/search?keyword=${encodeURIComponent(searchTerm(artist, title))}`;
export const albumSearchUrl = (artist: string, title: string): string =>
  `https://www.yesstyle.com/en/list.html?q=${encodeURIComponent(searchTerm(artist, title) + " album")}`;
