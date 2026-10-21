# Scheduled task prompt — "Refresh Swaiyu drops"

This is the prompt for the weekly scheduled task (Mondays 13:13 UTC). It replaces the v1
prompt that rewrote the `DROPS` array in `src/App.tsx` and replaced every row. The task was
created outside Claude Code, so only the owner can edit it: paste everything below the rule
into https://claude.ai/code/routines/trig_01BfFqBbZ3ePrc1vRXtQZZwd. Keep this file and the
stored prompt identical; edit here first, then paste.

---

You are maintaining the Swaiyu K-pop fan app (Vite + React + TypeScript PWA). The repo is already checked out on `main` and is the GitHub Pages site SakredStudio/SakredStudio.github.io. Run this standing task end-to-end, and STOP if any guardrail fails.

GUARDRAIL 0: If `public/drops.json` does not exist, ABORT immediately and report "v2 not merged to main yet — nothing changed". Do NOT touch `src/App.tsx` or any other file.

GOAL: Refresh `public/drops.json` with currently confirmed K-pop releases. The app fetches this file at runtime, so a refresh is a JSON edit — no build is needed.

STEPS:
1. Read `public/drops.json` and the "Drops refresh" paragraph in `CLAUDE.md`.

2. Web-search for K-pop releases with an OFFICIALLY ANNOUNCED date in the next 45 days. Accept a row only when the date is reported by one of: koreatimes.co.kr, soompi.com, sports.khan.co.kr, koreaherald.com, koreajoongangdaily.joins.com, kpopofficial.com. Discard rumors, "TBA" dates, and anything you cannot source from that list. Favor well-known groups.

3. MERGE, never replace:
   - Keep every existing row whose date is in the future or within the past 14 days, unless a source from the list says it moved or was cancelled (then change `date`, or remove it, and cite that source).
   - Remove rows more than 14 days in the past (the app hides them anyway).
   - Add the new confirmed releases. Do not add a row that duplicates an existing artist + title + date.
   - Never change a row's `source` to a weaker one.

4. Each row is exactly `{"artist","title","type","date","idol","source","yt"}` (`yt` optional):
   - artist: display name. title: release title.
   - type: one of "Single", "Pre-release Single", "Digital Single", "Album", "Mini Album", "EP", "MV".
   - date: "YYYY-MM-DD".
   - idol: the catalog id if one CLEARLY exists, else null. Featured ids: bts, bp, skz, aespa, svt, nj, ive, twice. Catalog ids are slugify(name) of the groups in `src/kpopGroups.ts`: lowercase, "&" → "and", non-alphanumeric runs → "-", trimmed (e.g. "(G)I-DLE" → "g-i-dle", "TOMORROW X TOGETHER" → "tomorrow-x-together"). If unsure, null.
   - source: REQUIRED, the https announcement URL from the outlet list above.
   - yt: optional YouTube search hint, e.g. "ILLIT BREAK EVEN I Will Arrest You".
   Set the top-level "updated" to today's date (YYYY-MM-DD). Sort rows by date ascending. Keep the file valid JSON, 2-space indented.

5. Validate: run `npm ci` if `node_modules` is missing, then `npm run check:drops`. It MUST print "check-drops: OK". If it fails, fix ONLY the rows you wrote and re-run. If you cannot make it pass, ABORT: do NOT commit or push, and report the exact output.

6. Only if the check passes: stage ONLY the one file with `git add public/drops.json` (NEVER `git add -A`). Commit with message `chore: refresh drops <today's date YYYY-MM-DD>`. Push to `origin main`. Do not run a build; the Pages workflow builds on push.

7. Report: rows added, rows removed, rows kept, each with artist - title - type - date - idol - source, and the commit hash. If you aborted, report why.
