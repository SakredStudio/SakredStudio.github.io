# Swaiyu — K-Pop Fan App (v2)

## Quick Start

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build → dist/
```

No env vars. All AI calls go through the Cloudflare Worker in `src/lib/ai.ts`
(origin allowlist, per-IP rate limit, model allowlist); no key ships in the bundle.

## Tech Stack
- Vite 5 + React 18 + TypeScript (strict). Node 26 on the dev PC, no Python (write scripts in Node).
- Single-page mobile-first PWA (max-width 430px), wrapped as a TWA for Play (`../swaiyu-twa`, never needs a rebuild for web changes).
- No router — tab state lives in `src/state/useSwaiyu.ts`. Inline styles + one injected `<style>` (`src/theme.ts`).
- Deploy: push to `main` → GitHub Actions → GitHub Pages at sakredstudio.github.io.

## Layout (Step 1 of BUILD-PLAN-V2.md)

| Path | Holds |
|---|---|
| `src/App.tsx` | 4-tab shell only |
| `src/state/useSwaiyu.ts` | every piece of state + handler; screens receive it as `app` |
| `src/screens/{Home,Concerts,Fani,Me,Onboard}.tsx` | one file per tab |
| `src/components/{Nav,Picker,ui}.tsx` | nav, group picker sheet, Lbl / IdolTag / ColorBar / Disclosure / Header |
| `src/data/*.ts` | idols, chants, kit, merch, glossary, tips (hand-maintained); `drops.ts` validates and re-exports `public/drops.json` |
| `src/lib/*.ts` | drops (live status), groups (resolver), storage, affiliate, ai |
| `src/kpopGroups.ts` | the 100-group catalog (ids = `slugify(name)`) |
| `src/theme.ts` | THEME tokens, global CSS, `inputStyle` |

Tabs: **Home** (hero, saved-concert countdown, drops) · **Concerts** (live ticket links, save-my-show, prep checklist, fanchants) · **FANI** (chat) · **Me** (Fan Card, my groups, merch, budget tips, glossary).

Removed in v2: Style AI, the Home quick-action grid, per-link AFFILIATE badges (one `<Disclosure/>` per screen instead).

## Data upkeep
`public/drops.json` is the only thing that goes stale (entries auto-hide 14 days after release). Refresh ≈ monthly; see ROADMAP.md. Everything else is static or a live deep-link.

**Drops refresh (for the scheduled task and for humans):** edit `public/drops.json` on `main`, not TSX. Merge, never replace: keep rows that still verify, drop rows you cannot source, add new ones. Every row needs `source` (the announcement URL on Korea Times, Soompi, sports.khan.co.kr, Korea Herald, Korea JoongAng Daily or kpopofficial.com), a real `date`, and an `idol` id the app knows or `null`. `yt` is an optional YouTube search hint. Bump `updated`. Run `npm run check:drops` before committing. No build is needed: the app fetches the JSON at runtime (3 s timeout, bundled copy as fallback) and the service worker serves it network-first.

## Persistence (localStorage, legacy `fandrop_` keys kept for existing installs)
`fandrop_idols`, `fandrop_checkedItems`, `fandrop_chants`, `fandrop_savedEvent`, `fandrop_customGroups`. Onboarding shows once (skipped when `fandrop_idols` exists). See `src/lib/storage.ts`.

## Rules
Nothing under 12px, test at 375px, one affiliate disclosure per screen, no accounts, no PII, no new paid services. Full scope: ROADMAP.md; build order: BUILD-PLAN-V2.md.
