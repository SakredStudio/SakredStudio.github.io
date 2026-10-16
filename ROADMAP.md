# Swaiyu — v2 / v3 Roadmap and Viability (2026-10-15)

Audience: female, 12–30. Markets in priority order: India, Indonesia, Brazil, Canada/US.
Constraints this roadmap obeys: $0 infra (Cloudflare Pages + Workers + D1, no new paid services), AI only through the existing token-gated Worker (Haiku live, Sonnet only where quality matters), no accounts and no PII, solo founder building in evenings, every task buildable by Sonnet.

---

## 0. Where v1 stands (what we keep)

v1 is a working PWA on sakredstudio.github.io wrapped as a TWA (Swaiyu 3, live on Play at 100%). What is worth keeping as-is:

- The group catalog (8 featured + 100 in `kpopGroups.ts`) and the custom-group flow.
- Bias-color theming (`anchor` drives gradients, glows, nav). This is the one thing that already fits the audience.
- The Worker AI gateway (origin allowlist, per-IP rate limit, model allowlist, 1024-token cap).
- Concert planner mechanics (live Ticketmaster/StubHub deep links, saved-concert countdown, checklist persistence).
- The chant library data model (stable ids, saved set, AI drafts flagged).
- The GitHub Actions deploy; the TWA never needs a rebuild for web changes.

What v1 gets wrong for this audience: six tabs plus six sub-sections plus six Home tiles; 8–10px monospace labels and 30%-opacity text; affiliate badges on every link; a text-only Fan Card that links to a dead domain; a text-only Style AI; nothing that changes day to day; no pre-order link where the buying intent actually is.

---

## 1. Design rules for v2 onward

1. Four tabs, never more. Each tab has one job.
2. Nothing under 12px. One sans typeface, two weights. No uppercase tracking labels.
3. Image before text. Every card has a visual anchor (group color block, emoji, or album art placeholder).
4. One affiliate disclosure line per screen, at the bottom. No per-link badges.
5. Something new every day without a server: birthdays, countdowns, "today in K-pop".
6. Every feature answers "would she screenshot this?" If not, it is a utility and belongs under Me.
7. No accounts, no UGC, no open chat between users. This keeps COPPA and Play Families out of scope.

---

## 2. v2 — "Simplify + Shareable" (the revamp)

Goal: turn v1 from a dashboard into something a fan opens because it looks like hers and shares because it looks good.

### 2.1 Information architecture

| Tab | Contains | Replaces |
|---|---|---|
| Home | Hero countdown (next comeback or saved concert), today's birthdays, upcoming drops (3), one FANI prompt chip | Home, Drops |
| Concerts | Group grid with live ticket links, save-my-show, prep checklist, fanchants (library + mine + AI draft) | Events, Fan Hub › Fanchants |
| FANI | Chat with quick prompts; "What's a POB?" style prompts absorb Glossary and Budget tips | FANI, Fan Hub › Glossary, Budget |
| Me | Fan Card (image), my groups, theme picker, merch shops list, privacy | Fan Hub › Fan Card, My Groups, Merch |

Cut outright: Style AI tab, Home quick-action grid, Fan Hub pill row, FANI promo card on Home, "AFFILIATE" badge component.

### 2.2 Features

| # | Feature | Why it matters for 12–30 F | Effort (evenings) |
|---|---|---|---|
| 1 | Pre-order button on every upcoming drop (Ktown4u search, YesStyle fallback) | Highest-intent click in the app; albums with photocard benefits are what this audience buys | 0.5 |
| 2 | Image Fan Card: canvas render, 9:16 and 1:1 PNG, `navigator.share({files})`, Swaiyu watermark, fields persisted | The growth loop. Stories and TikTok are image-first | 2 |
| 3 | Idol birthdays: static dataset for all catalog members, "today" strip on Home, group pages show next birthday | Daily reason to open at zero server cost | 1.5 (data) + 0.5 (UI) |
| 4 | Comeback countdown hero on Home, driven by DROPS filtered to followed groups | Big number, screenshot-able | 0.5 |
| 5 | Theme picker: Night (current), Pastel, and bias-color auto | Teens customize everything; pastel is the dominant aesthetic in this demo | 1 |
| 6 | Type and layout pass: 12px floor, 15–16px body, larger tap targets, 4-tab nav | Readability on cheap Android phones | 1 |
| 7 | Drops moved to `public/drops.json` with a `source` URL per row, fetched at runtime with the bundled copy as fallback | Refreshes stop needing a build; the scheduled task writes JSON, not TSX | 1 |
| 8 | Anonymous usage beacon to a D1 table (event name + day + country, no identifiers) | Without this we cannot judge v2 or gate v3 | 1 |

Total: roughly 9–10 evenings of build, plus 1 evening of QA on a real phone.

### 2.3 Play listing refresh (same release)

- New screenshots: 6 phone shots at 1080×1920 captured from the live app at the mobile viewport, each with a one-line caption overlay (Countdown, Fan Card, Birthdays, Concerts, FANI, Themes). Captured from the browser pane; no design tool needed.
- New feature graphic 1024×500 built from the Fan Card art.
- Short description (80 chars) and full description rewritten around "your groups, your card, your countdowns". Keywords: comeback, countdown, fan card, lightstick, fanchant, photocard, bias.
- Icon unchanged, so the TWA does not need a rebuild. If the icon changes, that is a bubblewrap rebuild and a new version code.
- Data safety stays "no data collected" only if the beacon stores no identifiers. Country and day are fine; IP must not be stored.
- Target audience declaration should be 13+ to keep the FANI chat outside the Families policy.

Effort: 1–2 evenings.

### 2.4 v2 success gate (30 days after release)

| Metric | Source | Go to v3 if |
|---|---|---|
| Installs / week | Play Console | up vs the 4 weeks before v2 |
| Day-7 retention | Play Console | ≥ 15% |
| Fan Card shares / week | beacon | ≥ 50 |
| Pre-order clicks / drop | beacon | ≥ 5 per upcoming drop |
| Affiliate revenue | Sovrn / Ktown4u | any non-zero, to prove the rail works |

If retention and shares both miss, stop at v2 and keep it as a maintained utility. Do not build v3 on hope.

---

## 3. v3 — "Daily habit" (only after the gate)

Goal: the app earns a home-screen slot.

| # | Feature | Why | Cost / notes |
|---|---|---|---|
| 1 | Web push: "comeback tomorrow", "it's Wonyoung's birthday", "your concert is in 3 days" | Push is the single biggest retention lever; the TWA supports web push | Worker + D1 subscriptions table + VAPID keys. $0. Data safety changes to "device identifiers collected". ~3 evenings |
| 2 | Photocard collection tracker: per-group member grid, owned / wanted toggles, local-first in IndexedDB, export as image | Collecting is the core hobby of this demo; a wishlist image is another share loop | Needs member lists for the catalog (same data effort as birthdays). ~4 evenings |
| 3 | Localization: Indonesian, Portuguese (BR), Hindi UI strings; FANI replies in the user's language | Matches the market order; Indonesia and Brazil are top K-pop markets | Static strings + a `lang` hint in the system prompt. ~2 evenings per language with Sonnet |
| 4 | FANI persona: remembers followed groups, bias, saved concert, chant list; local context only, nothing stored server-side | Makes the chat feel like hers; no backend | ~1 evening |
| 5 | Drops pipeline: scheduled task writes `drops.json` to a D1-backed Worker endpoint with a source per row; the app fetches it | Removes the stale-data failure we hit in October | ~2 evenings |
| 6 | Sticker and emoji packs per group as a theme extension | Cheap self-expression; pairs with the Fan Card | ~2 evenings |

Explicitly not in v3: accounts, user-to-user chat or comments, image generation, scraping ticket data, Play Billing. Each one either costs money, adds moderation risk with minors, or breaks the $0 rule.

### 3.1 v3 monetization reality

Affiliate stays the only rail. Realistic expectation for an organic app in this niche is tens of dollars a month until installs reach five figures. v3 is a retention and distribution play, not a revenue play. The honest revenue options later are a one-time theme pack sold outside Play (Gumroad link, adults only) or sponsorship by a merch shop, and both wait for an audience.

---

## 4. Viability verdict

**v2 is viable now.** It is a bounded 10–12 evening sprint, costs nothing, needs no TWA rebuild, and every item is buildable by Sonnet with Haiku-checkable tests. The two data tasks (birthdays, member lists) are the only grind, and they can be produced by a batch job and spot-checked.

**v3 is not a decision to make now.** It is gated on v2 numbers. The beacon in v2 is what makes that gate real, so it is not optional.

**Portfolio check.** Kilat, Sakred OS and the Play compliance work are all active. The v2 sprint competes with them for the same evenings. If Swaiyu is the third priority, the right move is still v2, because it is the cheapest way to find out whether this app has an audience, and the answer changes whether it deserves any more evenings at all.

**Risks**

- Competition: Weverse, Bubble and comeback-tracker apps own the category. Swaiyu's only defensible angle is the shareable identity layer plus multi-group countdowns in one place. v2 bets everything on that angle, on purpose.
- Data upkeep: drops still need a human-verified refresh roughly monthly until v3 item 5 lands.
- FANI cost exposure: rate limit is 20 requests per minute per IP. A viral moment could cost real money. Add a daily global cap in the Worker before the listing refresh goes live.
