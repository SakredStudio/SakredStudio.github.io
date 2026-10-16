# Swaiyu v2 — Build Plan (ordered by impact, approved scope from ROADMAP.md §2)

Rules for every step: buildable by Sonnet in one evening session or less, acceptance criteria checkable by Haiku from a diff plus a screenshot, `npm run build` green, tested at a 375px viewport, nothing under 12px, no new paid service, no accounts, no PII.

Working branch: `v2` off `main`. Each step is one commit with the prefix shown. `main` keeps receiving drops refreshes; rebase `v2` on `main` before release.

---

## Lane A — sequential UI work (one session at a time, same files)

### Step 1 — Split the file and land the 4-tab shell  `refactor(v2):`
Impact: foundation. Everything else lands on this, and the split is what lets later steps run in parallel without conflicts.

- Split `src/App.tsx` (1,800 lines) into: `src/data/{idols,drops,chants,kit,merch,glossary,tips}.ts`, `src/lib/{drops,groups,storage,affiliate}.ts`, `src/screens/{Home,Concerts,Fani,Me}.tsx`, `src/components/{Card,Pill,Lbl,IdolTag,Picker,Toast}.tsx`, `src/theme.ts`.
- Bottom nav becomes 4 tabs: Home ⚡, Concerts 🎟, FANI 🤖, Me 💜. `TabId` type updated.
- Move screens as-is first (no redesign yet): Drops content into Home; Fanchants into Concerts below the kit; Glossary, Budget, Merch, Fan Card, My Groups into Me as stacked sections.
- Delete: Style AI screen and its state, `STYLE_PRESETS`, `wrapAffiliate` and `SOVRN_KEY` (the parked stash becomes moot; drop it), the Home quick-action grid, the FANI promo card on Home, `AffTag` and the `.aff-tag` CSS.
- Keep the vglnk script in `index.html` (ticket and merch links still auto-affiliate).

Accept when: build green; all 4 tabs render; every v1 feature still reachable except Style AI; `grep -c "AFFILIATE" src` is 0; no file over 500 lines.
Effort: 2 evenings.

### Step 2 — Type and layout pass  `style(v2):`
Impact: perceived quality on every screen.

- `src/theme.ts`: one font (DM Sans), weights 500/700. Remove Syne and Space Mono imports. Scale: 12 caption, 14 body, 16 card title, 22 section, 32 hero number.
- Remove uppercase letter-spaced `.lbl`; section labels become 14px/700 sentence case.
- Text opacity floor 0.6 for secondary, 0.85 for body. Tap targets ≥ 44px.
- Nav labels 12px. Cards 16px radius, 16px padding.
- One disclosure line per screen that has outbound links, bottom of screen, 12px: "Some links are affiliate links. Swaiyu may earn a commission."

Accept when: screenshots of all 4 tabs at 375px show no text under 12px (Haiku checks the computed styles from a `getComputedStyle` dump in the PR body); only one disclosure per screen.
Effort: 1 evening.

### Step 3 — Pre-order on drops + countdown hero on Home  `feat(v2):`
Impact: the money moment plus the screenshot moment, for half an evening.

- `src/lib/affiliate.ts`: `preorderUrl(artist, title)` → Ktown4u search `https://www.ktown4u.com/search?keyword=<q>`; fallback YesStyle search. Only for `upcoming` rows.
- Drop card: primary button "Pre-order ↗" (upcoming) or "Listen ↗" (released, YouTube search). Secondary text link to the other.
- Home hero: the soonest upcoming drop for a followed group, or the saved concert if sooner. Big number (days), title, artist, group color. Tap → the drop card or Concerts. If nothing is upcoming, show "No comebacks on the radar. Follow more groups →".

Accept when: upcoming drops show Pre-order, released drops show Listen; hero shows the correct nearest item for a test user following IVE and TXT; beacon event names `preorder_click` and `hero_tap` are called (they no-op until Step 7).
Effort: 0.5 evening.

### Step 4 — Image Fan Card  `feat(v2):`
Impact: the growth loop.

- Persist `fanName`, `fanBias`, `fanSince`, `fanPhoto` to `localStorage` (`swaiyu_fancard`), keep reading the old `fandrop_*` keys for groups.
- `src/lib/fancard.ts`: render to an offscreen `<canvas>` at 1080×1920 (story) and 1080×1080 (square): bias-color gradient, name, bias group emoji + name, fandom chips, "stan since", optional photo (cover-fit, rounded), bottom watermark "swaiyu · sakredstudio.github.io".
- Share: `navigator.share({files:[png]})` when `navigator.canShare` supports files; else download the PNG; copy-text fallback stays. Fix the dead `fandrop.app` URL.
- Me tab: live preview of the card, "Share story" and "Share square" buttons.

Accept when: on Chrome Android the share sheet opens with a PNG attached; the PNG has no text under 28px at 1080 wide; fields survive a reload; no `fandrop.app` string remains.
Effort: 2 evenings.

### Step 5 — Birthdays on Home  `feat(v2):`
Impact: daily reason to open. Depends on Lane B item B1 (dataset).

- Home strip "Today 🎂" listing members with a birthday today across all catalog groups (not only followed), followed groups first. Below it "Next up" with the next 3 birthdays among followed groups.
- Group row in Me shows the next member birthday.

Accept when: with the system date set to a known birthday the strip shows that member; empty state reads "No birthdays today".
Effort: 0.5 evening (UI only).

### Step 6 — Theme picker  `feat(v2):`
Impact: self-expression; teens pick pastel.

- Three themes in `src/theme.ts`: Night (current palette), Pastel (background #FBF7FF, text #2A1B3D, soft group tints at 18% alpha), Bias (Night with the anchor color pushed into the nav and hero). Stored in `swaiyu_theme`.
- Picker in Me as three swatches. `theme-color` meta updated on change.

Accept when: all 4 tabs pass a contrast check of ≥ 4.5:1 for body text in all three themes (Haiku checks a dumped token table); the choice survives reload.
Effort: 1 evening.

### Step 8 — QA on a real phone + release candidate  `chore(v2):`
- Install the PWA from sakredstudio.github.io on an Android phone and open the Play build (TWA) pointing at a preview deploy if available, else at production after merge.
- Check: onboarding, every tab, share sheet, theme switch, pre-order link opens Ktown4u, FANI replies, offline reload.
- Rebase `v2` on `main`, squash-merge, push. Pages deploys. The TWA needs no rebuild (icon unchanged).
Effort: 1 evening.

---

## Lane B — independent work (can run in parallel sessions, different files)

### B1 — Birthdays dataset  (needed by Step 5)
- `src/data/birthdays.ts`: `{ groupId, member, date: "MM-DD" }` for every member of the 8 featured + 20 popular groups first, then the 80 "more" groups.
- Produce with a batch job (Haiku) from public profiles, then a Sonnet pass spot-checks 10% against two sources. Rows without two agreeing sources are omitted, never guessed.
- Also emit `src/data/members.ts` (group → member list) since the same lookup yields it; v3's photocard tracker reuses it.

Accept when: every featured group has all members with dates; a `node scripts/check-birthdays.cjs` script finds no duplicate member per group and no invalid dates.
Effort: 1.5 evenings of batch time, little hands-on.

### B2 — Drops as runtime JSON  (independent)
- Move `DROPS` to `public/drops.json`: `[{artist,title,type,date,idol,source}]`, `source` required (URL of the announcement).
- `src/lib/drops.ts`: fetch `./drops.json` with a 3s timeout, fall back to the bundled copy imported at build time. Same `liveDrops()` filtering.
- Update the scheduled refresh task's instructions: write JSON, one source per row, merge not replace, no build needed.

Accept when: deleting a row from the deployed JSON changes the app without a rebuild; a row without `source` fails `npm run check:drops`.
Effort: 1 evening.

### B3 — Anonymous beacon  (independent; must ship before release)
- New Worker `swaiyu-beacon` (Cloudflare, same account as fandrop-worker) with D1 table `events(day, event, country, n)`. `POST /e` with `{event}`; the Worker adds `day` (UTC) and `country` from `request.cf.country`, upserts `n+1`. No IP, no user agent, no ids stored. Origin allowlist same as fandrop-worker. Rate limit 60/min/IP.
- App: `src/lib/beacon.ts` `track(event)` using `navigator.sendBeacon`. Events: `open`, `hero_tap`, `preorder_click`, `listen_click`, `fancard_share`, `fancard_download`, `theme_set_<name>`, `fani_send`, `ticket_click`.
- `GET /summary?key=` returns the last 30 days as JSON for the gate review.

Accept when: a test POST from the allowed origin increments a row; a POST from another origin is 403; the D1 table has no column that could identify a person.
Effort: 1 evening.

### B4 — FANI daily global cap  (risk item from ROADMAP §4)
- In `fandrop-worker`: D1 or KV counter `fani_daily`, hard stop at 2,000 requests/day with a friendly 429 body the app renders as "FANI is resting, back tomorrow 💜".
Effort: 0.5 evening.

### B5 — Play listing refresh  (after Step 8 is on production)
- Six 1080×1920 screenshots captured from the live app in the browser pane at a 360×640 viewport scaled 3×, captions overlaid: "Count down to every comeback", "Your Fan Card, your story", "Never miss a birthday", "Tickets and prep in one place", "Ask FANI anything", "Pick your vibe".
- Feature graphic 1024×500 from the Fan Card art.
- Short description (≤80): "Comeback countdowns, your Fan Card, birthdays and concert prep — for every group you stan."
- Full description rewritten; keywords: comeback, countdown, fan card, bias, lightstick, fanchant, photocard, K-pop.
- Data safety: unchanged ("no data collected") because the beacon stores no identifiers. Target audience: 13+.
Effort: 1–2 evenings (Soul uploads; Claude prepares all assets and copy).

---

## Order of execution

| Week | Lane A (UI, sequential) | Lane B (parallel) |
|---|---|---|
| 1 | Step 1 split + shell → Step 2 type pass | B1 birthdays batch running; B2 drops.json |
| 2 | Step 3 pre-order + hero → Step 4 Fan Card | B3 beacon; B4 FANI cap |
| 3 | Step 5 birthdays UI → Step 6 themes → Step 8 QA + release | B5 listing assets prepared |
| 4–7 | Drops refresh mid-November; collect gate metrics | — |
| 8 | Gate review against ROADMAP §2.4 | — |

Total: about 12 evenings across both lanes, 3 calendar weeks at the evening cadence.

## Out of scope for v2 (do not drift)
Push notifications, photocard tracker, localization, FANI memory, any accounts, any new paid service, Play Billing, icon change.
