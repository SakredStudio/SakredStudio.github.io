// Anonymous usage beacon (BUILD-PLAN-V2.md item B3). Until the Worker exists this is a
// no-op that logs in dev, so screens can already call track() with the final event names:
//   open · hero_tap · preorder_click · listen_click · fancard_share · fancard_download ·
//   theme_set_<name> · fani_send · ticket_click
// Never pass anything that could identify a person — the event name is the whole payload.
export function track(event: string): void {
  if (import.meta.env.DEV) console.debug("[beacon]", event);
}
