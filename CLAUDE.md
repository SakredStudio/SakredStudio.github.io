# FanDrop — K-Pop Fan App

## Quick Start

```bash
npm install
cp .env.example .env.local   # add your Anthropic API key
npm run dev                  # opens at http://localhost:5173
```

## Tech Stack
- **Vite 5 + React 18 + TypeScript** (strict mode)
- Single-page mobile-first PWA (max-width 430px)
- No router — tab state is in-memory (`useState`)
- All styling: inline styles + injected `<style>` tag (no CSS modules / Tailwind)
- Google Fonts loaded via `@import` in the global CSS string

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_ANTHROPIC_API_KEY` | Yes | Claude API key from console.anthropic.com — used by FANI chat and Style AI |

> **Security note:** The API key is exposed in the browser bundle. Use a restricted key scoped to `claude-sonnet-*` only, with low token limits, and rotate regularly.

## Key Features

| Feature | Tab | Description |
|---|---|---|
| **FANI** | `fani` | AI chat powered by Claude — answers any K-pop question |
| **Style AI** | `style` | Generates outfit recommendations with affiliate shop links |
| **Concert Kit** | `events` | Concert picker + phased prep checklist with affiliate ticket/merch links |
| **Fan Card** | `fan → fancard` | Personalised shareable fan identity card |
| **Fanchants** | `fan → fanchant` | Song-by-song chant guides with lyrics and YouTube links |
| **Drops** | `drops` | Recent and upcoming K-pop music releases |
| **Fan Hub** | `fan` | Merch shops, budget tips, glossary, group management |

## Data

All data is hardcoded in `src/App.tsx`:
- `IDOLS` — 8 groups with colours, eras, fandom names
- `EVENTS` — 6 upcoming concerts (2026 dates)
- `DROPS` — 7 recent/upcoming releases
- `FANCHANTS` — 4 song guides
- `CONCERT_KIT` — 4 checklist phases (16 items total)
- `MERCH_SHOPS` — 5 stores
- `GLOSSARY` — 16 K-pop terms
- `BUDGET_TIPS` — 5 saving strategies

To add a new group: append to `IDOLS` with `{id, name, emoji, color, era, fandom, members[], lightColor}`.

## Affiliate Architecture

All external purchase links are affiliate links. Disclosure banners are present on:
- Style AI results
- Concert Kit ticket/merch section
- Merch Shops tab

The `AffTag` component renders the yellow "AFFILIATE" badge inline on any affiliate link.

## Persistence

User preferences persisted to `localStorage`:
- `fandrop_idols` — array of followed group IDs (JSON)
- `fandrop_checkedItems` — concert checklist state (JSON)

Onboarding screen is shown once (skipped if `fandrop_idols` exists in localStorage).

## API Calls

Both FANI and Style AI POST to `https://api.anthropic.com/v1/messages` directly from the browser.
Required headers: `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-client-side-origin-policy: allow`.

## Commands

```bash
npm run dev       # dev server with HMR
npm run build     # type-check + bundle to dist/
npm run preview   # serve dist/ locally
npm run typecheck # tsc --noEmit only
```
