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
