# FanDrop — Interactive Element Audit

**Scope:** `src/App.tsx` (1203 lines). The file imports only React (`useState, useRef, useEffect, useCallback`) — there are **no local component imports**, so the entire UI lives in this one file. All findings below are grep-verified against the real file (line numbers cited). **Report only — no fixes applied.**

Verified counts: `onClick` ×33, `onChange` ×5, `href=` ×10, `window.open` ×1, `useState` ×23, `localStorage.setItem` ×2, `localStorage.getItem` ×3. No `TODO`/`FIXME`/`onPress`/`alert(`/`console.` found.

---

## 1. INVENTORY

### Onboarding (pre-tab gate, `showOnboard`)
| Label | Type | Handler |
|---|---|---|
| Group tile (×8) | toggle | `toggleIdol(idol.id)` — L430 |
| "Enter FanDrop" | button | `setShowOnboard(false)` (disabled when `myIdols.length===0`) — L440 |

### Home (`renderHome`)
| Label | Type | Handler |
|---|---|---|
| "+ Edit" chip | button/div | `setTab("fan")` — L469 |
| Saved-concert card | card/div | `setTab("events")` — L476 |
| Empty-concert prompt | card/div | `setTab("events")` — L488 |
| Drop card (×≤6) | card/div | `d.ytUrl && window.open(d.ytUrl,"_blank")` — L503 |
| FANI promo card | card/div | `setTab("fani")` — L518 |
| Quick-action grid (×6) | card/div | `setTab(item.tab); if(item.section) setFanSection(...)` — L541 |

### Events / Concert Kit (`renderEvents`)
| Label | Type | Handler |
|---|---|---|
| Event row (×6) | card/div | `setSavedEvent(ev.id); pushToast(...)` — L572 |
| "Buy Tickets" | link→button | `href={event.ticketUrl}` — L603 |
| "VividSeats" | link→button | `href="https://vividseats.com"` — L608 |
| "Weverse" / "Ktown4u" (×2) | link→button | `href` ternary — L620 |
| Checklist checkbox (×16) | toggle | `toggleCheck(key)` — L645 |
| Checklist affiliate tag | link | `href={item.url}` (only when `item.aff`) — L651 |

### Drops (`renderDrops`)
| Label | Type | Handler |
|---|---|---|
| "▶ YouTube" | link→button | `href={d.ytUrl}` (only when `!upcoming && d.ytUrl`) — L696 |
| (cards themselves are non-interactive here) | — | — |

### AI Style (`renderStyle`)
| Label | Type | Handler |
|---|---|---|
| Wishlist FAB ❤️ | button | `setShowWishlist(v=>!v)` (only when `wishlist.length>0`) — L714 |
| Wishlist overlay backdrop | div | `setShowWishlist(false)` — L720 |
| Wishlist sheet body | div | `e.stopPropagation()` — L721 |
| Wishlist close × | button | `setShowWishlist(false)` — L725 |
| Wishlist "Buy ↗" (×n) | link→button | `href={item.url}` — L735 |
| Wishlist remove × (×n) | button | `toggleWish(item)` — L736 |
| Group pill (×6) | toggle | `setStyleIdol(idol.id)` — L761 |
| Preset tile (×6) | button | `setStylePrompt(p.prompt)` — L770 |
| Prompt textarea | input | `setStylePrompt(e.target.value)` — L779 |
| "Generate Outfit" | button | `generateStyle()` (disabled while loading) — L782 |
| Wishlist heart toggle (×5 results) | button | `toggleWish(item)` — L818 |
| "Buy at {store} ↗" (×5) | link→button | `href={item.url}` — L823 |
| "💚 Dupe" (×5) | link→button | `href={budgetUrl}` (derived) — L830 |
| "Ask FANI" card | card/div | `setTab("fani")` — L841 |
| "← Generate another" | button | `setStyleResults(null); setStyleMode("idle"); setStylePrompt("")` — L854 |

### FANI (`renderFani`)
| Label | Type | Handler |
|---|---|---|
| Quick-question card (×6) | card/div | `sendAiMessage(q)` — L896 |
| Chat textarea | input | `setAiInput(e.target.value)` + Enter→`sendAiMessage()` — L925 |
| Send ↑ | button | `sendAiMessage()` (disabled when empty/loading) — L927 |

### Fan Hub (`renderFan`)
| Label | Type | Handler |
|---|---|---|
| Section pill (×6) | tab | `setFanSection(s.id)` — L956 |
| Hidden file input | input | reads file → `setFanPhoto(...)` — L963 |
| Fan-card photo box | div | `fileRef.current?.click()` — L978 |
| Fan-name input | input | `setFanName(e.target.value)` — L1001 |
| Bias group pill (×8) | toggle | `setFanBias(idol.id)` — L1007 |
| "Stan since" year (×8) | toggle | `setFanSince(yr)` — L1016 |
| "💜 Share Fan Card" | button | `shareFanCard()` — L1021 |
| 📸 button | button | `fileRef.current?.click()` — L1024 |
| Fanchant header (×4) | toggle | `setOpenFanchant(open?null:i)` — L1043 |
| "▶ Full Fanchant Video" | link→button | `href={fc.ytUrl}` — L1063 |
| "See Fanchant Lines →" | button | `setOpenFanchant(i)` — L1068 |
| Merch shop card (×5) | link | `href={s.url}` — L1079 |
| Glossary search | input | `setGlossSearch(e.target.value)` — L1127 |
| My-groups tile (×8) | toggle | `toggleIdol(idol.id); pushToast(...)` — L1152 |

### Global (`return`, bottom nav)
| Label | Type | Handler |
|---|---|---|
| Bottom tab (×6) | tab | `setTab(t.id)` — L1192 |

---

## 2. WIRING

**Every `onClick`/`onChange` has a defined handler.** No dangling handlers, no no-ops, no TODOs, no references to undefined functions or state (all setters/handlers — `toggleIdol`, `toggleCheck`, `toggleWish`, `sendAiMessage`, `generateStyle`, `shareFanCard`, `pushToast`, `setTab`, `setFanSection`, `setSavedEvent`, etc. — are declared). Confirmed clean:

- **No duplicate/conflicting handlers.** `fileRef.current?.click()` is wired twice (L978 photo box, L1024 📸 button) — intentional dual triggers for the same hidden input, not a conflict.
- **Fanchant open is wired two ways** (header toggle L1043 + "See Fanchant Lines" L1068). Not conflicting: the L1068 button only renders when `!open`, and it sets open=`i` (idempotent with the header). Fine.

**Minor wiring observations (not breakage):**
- **L721** wishlist sheet uses `onClick={e => e.stopPropagation()}` — correct pattern to stop backdrop-close bubbling. OK.
- **L440 onboarding "Enter":** relies on `disabled={myIdols.length===0}`. Because `loadIdols()` (L185) defaults to `["bts","bp"]` when no localStorage key exists, a brand-new user lands in onboarding with two groups **pre-selected** and the button already enabled. Cosmetic/UX, not a bug.

---

## 3. AI + AFFILIATE PATHS

### FANI — `sendAiMessage` (L273)
- ✅ POSTs to `https://fandrop-ai.mihir86-mp.workers.dev` (L282).
- ✅ Headers = `{ "Content-Type": "application/json" }` only (L269–271). No client key.
- ✅ Body valid: `model: "claude-haiku-4-5-20251001"`, `max_tokens: 1000`, `system`, `messages: hist` where `hist = [...aiMessages, {role:"user", content}]` — well-formed Anthropic message array (L285–290).
- ✅ Response parsed safely: `data.content?.find(b=>b.type==="text")?.text ?? "fallback"` (L293) — guarded against undefined `data`/`content`. Whole call wrapped in try/catch (L297) with a friendly error message.
- ✅ Re-entrancy guard: returns early if empty input or `aiMode==="loading"` (L275).

### AI Style — `generateStyle` (L342)
- ✅ POSTs to the same Worker URL (L350), same headers, same model.
- ✅ Body valid: `messages: [{role:"user", content}]` (L373).
- ✅ Response parsed safely: extracts text via `data.content?.find(...)?.text ?? ""`, then `raw.match(/\{[\s\S]*\}/)` and `JSON.parse`; throws→caught→toast on no-JSON/parse failure (L376–385).

> ⚠️ **Worker contract assumption (verify):** Both handlers assume the Worker returns the **raw Anthropic shape** `{ content: [{ type:"text", text }] }`. If the Worker reshapes the response (e.g. `{ reply }` or `{ text }`), the `?.` guards silently fall through to the fallback/empty string — FANI would always answer "Sorry, I couldn't find an answer" and Style would always toast "Couldn't generate." Cannot confirm from the repo; flagged for runtime check against the deployed Worker.

### Affiliate / external links
| Link | URL source | Valid? |
|---|---|---|
| Buy Tickets (L603) | `event.ticketUrl` | ✅ all 6 EVENTS have real URLs |
| VividSeats (L608) | hardcoded | ✅ |
| Weverse/Ktown4u (L620) | hardcoded ternary | ✅ |
| Checklist aff tag (L651) | `item.url` | ✅ only renders when `item.aff:true`; all 3 aff items have URLs |
| Drops YouTube (L696) | `d.ytUrl` | ✅ guarded by `!upcoming && d.ytUrl` |
| Home drop card (L503) | `window.open(d.ytUrl)` | ✅ guarded by `d.ytUrl &&` |
| Merch shops (L1079) | `s.url` | ✅ all 5 real |
| Fanchant video (L1063) | `fc.ytUrl` | ✅ all 4 present |
| Style "Buy at {store}" (L823, L735) | `item.url` (**AI-generated**) | ⚠️ not validated — see RUNTIME RISK |
| Style "Dupe" (L830) | derived `budgetUrl` | ✅ defaults to `yesstyle.com`; safe |

---

## 4. STATE / PERSISTENCE

**23 `useState` hooks.** Only **two** persist to `localStorage`:

| State | Persists? | Key |
|---|---|---|
| `myIdols` (L218) | ✅ | `fandrop_idols` (written in `toggleIdol` L261) |
| `checkedItems` (L220) | ✅ | `fandrop_checkedItems` (written in `toggleCheck` L253) |
| `showOnboard` (L225) | ✅ (derived) | reads `fandrop_idols` presence |

**Silently resets on refresh — flag if intended to persist:**

| State | Line | Concern |
|---|---|---|
| `wishlist` | L235 | **P1.** User taps the heart → toast says **"❤️ Saved to wishlist!"** (L339) implying durability, but it's in-memory only. A hard refresh empties the wishlist and the FAB disappears. Highest-impact mismatch between UX copy and behavior. |
| `savedEvent` | L219 | **P1.** Saving a concert drives the Home hero card and the entire Concert Kit. Toast says **"concert saved!"** (L572) but it's lost on refresh — Home reverts to the empty "Save a Concert" prompt. |
| `fanName`/`fanBias`/`fanSince`/`fanPhoto` | L238–241 | **P2.** The Fan Card is a "personalised identity" feature; all inputs reset to defaults (`""`, `"bts"`, `"2020"`, no photo) on refresh. |
| `aiMessages` | L227 | **P2/expected.** Chat history clears on refresh — usually acceptable for a chat, noting for completeness. |
| `stylePrompt`/`styleIdol`/`styleResults`, `glossSearch`, `tab`, `fanSection`, `openFanchant`, `aiInput`, `styleMode`, `aiMode`, `showWishlist`, `toasts` | various | Ephemeral by design — no concern. |

> Note: per project `CLAUDE.md`, only `fandrop_idols` and `fandrop_checkedItems` are *specified* as persisted, so the above is "spec-compliant." The audit flags them because the in-app copy ("Saved", "concert saved") promises persistence the build doesn't deliver. The CLAUDE.md remark that "the web build may have no localStorage" does **not** apply here — `localStorage` is used unconditionally and would throw in a truly storage-less context (see RUNTIME RISK).

---

## 5. RUNTIME RISK

| # | Risk | Line | Detail |
|---|---|---|---|
| R1 | `item.cat.toUpperCase()` on AI data | L809 | `styleResults.items` comes from `JSON.parse` of model output, cast `as StyleResult` with **no field validation**. If any item omits `cat`, `.toUpperCase()` throws and crashes the Style results render mid-list. `item.cat===...` at L806 is safe (comparison), but L809 dereferences. Same class of risk for `item.name`/`item.url`/`item.price` rendering blank if missing (non-throwing). |
| R2 | AI `item.url` opens unverified link | L823, L735 | Worker/model returns the URL. If empty/`undefined`, `<a href={undefined} target="_blank">` navigates the current tab or no-ops; if relative, it resolves against the app origin. No `try`/validation. Functional + affiliate-revenue risk. |
| R3 | `localStorage` unconditional access | L186, L190, L225, L253, L261 | Reads at module load (`loadIdols`/`loadChecked`) and in `useState` initializer. Reads are `try/catch`-wrapped; **writes in `toggleIdol`/`toggleCheck` are not.** In a context where `localStorage` is blocked (private mode quota, sandboxed iframe), the setItem calls throw inside the setState updater → unhandled. Low likelihood, real. |
| R4 | List keys use array index | many (L498 `key={i}`, L683, L727, L799, L895, L903, L1037, L1078, L1107, L1129) | Acceptable for static/append-only lists, but `wishlist` (L727) and `styleResults.items` (L799) are mutable/regenerated; index keys can cause React to mis-reconcile on removal. Low severity. No **missing** keys found — every `.map` returns a keyed element. |
| R5 | Worker response-shape coupling | L293, L377 | If the deployed Worker doesn't return `{content:[{type:"text",...}]}`, both AI features fail silently (always fallback). Not a throw, but a "looks-wired-but-dead" risk. Verify against the live Worker. |
| R6 | `getDays` / `Date.now()` | L174–175 | Fine in-browser. `new Date(d.date)` on the hardcoded ISO strings is valid; no risk with current data, but no guard if a future malformed date is added (would yield `NaN` day counts, rendered as `NaN`). Cosmetic. |

**Not at risk (checked):** `data.content?.find(...)` both guarded (L293/L377); `getIdol(...)` results always accessed with `?.`/`?? fallback`; `primary = myIdolData[0] ?? IDOLS[0]` (L267) never undefined; `styleResults.items ?? []` (L799) guards the map; `item.budget.split` guarded by `item.budget &&` (L826); `d.ytUrl` guarded before use everywhere.

---

## 6. FIX LIST (prioritized)

### P0 — broken / dead
*(none found)* — every interactive element is wired to a real, functioning handler; both AI calls and all affiliate links point at valid endpoints. The only way an AI path is "dead" is R5 (Worker returns a non-Anthropic shape), which is environmental, not a code defect — **verify the Worker response shape before closing this out.**

### P1 — risky
1. **R1 — Validate AI Style items before render** (L799–809): guard `item.cat` (and `name`/`url`/`price`) or filter malformed items after `JSON.parse`, so one bad field can't throw and blank the whole result list.
2. **R2 — Validate `item.url`** (L823, L735): fall back to a known store URL (or hide the Buy button) when the AI returns an empty/relative/invalid URL — protects UX and affiliate attribution.
3. **Persist `wishlist`** (L235): the "❤️ Saved to wishlist!" copy promises durability; back it with `localStorage` (e.g. `fandrop_wishlist`) or soften the copy.
4. **Persist `savedEvent`** (L219): Home hero + Concert Kit depend on it and the toast says "saved"; persist (e.g. `fandrop_savedEvent`) or adjust expectation.

### P2 — polish
5. **R3 — Wrap `localStorage.setItem`** in `toggleIdol`/`toggleCheck` (L253, L261) in try/catch for storage-blocked contexts.
6. **Persist Fan Card fields** (`fanName`/`fanBias`/`fanSince`/`fanPhoto`, L238–241) so the "identity card" survives refresh.
7. **R4 — Use stable keys** for `wishlist` (L727) and Style items (L799) — e.g. `item.name`/`item.url` instead of array index.
8. **R5 — Add a Worker-shape fallback/log** so a contract mismatch is visible rather than silently returning the generic fallback text.
9. **R6 — Guard `getDays`** against `NaN` if non-ISO dates are ever added.
10. **Onboarding pre-selection** (L185 default `["bts","bp"]` vs. fresh onboarding): decide whether new users should start with zero selected.
