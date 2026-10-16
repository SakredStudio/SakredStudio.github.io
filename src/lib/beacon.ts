// Anonymous usage beacon (BUILD-PLAN-V2.md item B3). The event name is the WHOLE payload —
// never pass anything that could identify a person. The Worker (worker/beacon/) adds the
// UTC day and the country, upserts a counter, stores nothing else. Allowed names:
//   open · hero_tap · preorder_click · listen_click · fancard_share · fancard_download ·
//   theme_set_night · theme_set_pastel · theme_set_bias · fani_send · ticket_click
// Unknown names get a 400 from the Worker, so keep this list and the Worker's in sync.
const BEACON_URL = "https://swaiyu-beacon.mihir86-mp.workers.dev/e";

// Fire-and-forget. sendBeacon survives the page unloading (ticket / pre-order taps open a new
// tab); the fetch fallback uses keepalive for the same reason. A string body goes out as
// text/plain, which is a CORS "simple request" — no preflight, so it works from sendBeacon.
// Never throws and never blocks the UI: analytics must not be able to break the app.
export function track(event: string): void {
  if (import.meta.env.DEV) console.debug("[beacon]", event);
  try {
    const body = JSON.stringify({ event });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(BEACON_URL, body)) return;
    }
    if (typeof fetch === "function") {
      fetch(BEACON_URL, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } })
        .catch(() => { /* offline or blocked — nothing to do */ });
    }
  } catch { /* never let analytics throw */ }
}
