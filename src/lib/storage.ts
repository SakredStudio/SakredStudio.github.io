import { CHANT_LIBRARY, type Chant } from "../data/chants";

// localStorage keys keep the legacy "fandrop_" prefix so existing installs keep
// their groups, checklist, chants and saved concert across the v2 upgrade.
export const KEYS = {
  idols: "fandrop_idols",
  checked: "fandrop_checkedItems",
  chants: "fandrop_chants",
  savedEvent: "fandrop_savedEvent",
  customGroups: "fandrop_customGroups",
  fancard: "swaiyu_fancard",
  theme: "swaiyu_theme",
} as const;

// Writes never throw (private mode / blocked storage) — the in-memory state still updates.
export const save = (key: string, value: unknown): void => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
};
export const remove = (key: string): void => {
  try { localStorage.removeItem(key); } catch { /* storage blocked */ }
};
export const has = (key: string): boolean => {
  try { return localStorage.getItem(key) != null; } catch { return false; }
};

// A user-saved concert — fully self-contained, NOT a pointer into any list. The fan
// picks one of their followed groups, a date, and optionally a city/venue; we store
// exactly that, so the Home countdown renders from these fields alone (never stale).
export interface SavedConcert {
  idol: string; date: string; city?: string; venue?: string;
}

export const loadIdols = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEYS.idols) || '["bts","bp"]'); }
  catch { return ["bts", "bp"]; }
};
export const loadChecked = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(KEYS.checked) || "{}"); }
  catch { return {}; }
};
// The user's saved chant set. First run (key absent) → pre-seed with the curated
// library chants so "My Chants" isn't empty out of the box.
export const loadChants = (): Chant[] => {
  try {
    const raw = localStorage.getItem(KEYS.chants);
    if (raw == null) return CHANT_LIBRARY.slice();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Chant[]) : CHANT_LIBRARY.slice();
  } catch { return CHANT_LIBRARY.slice(); }
};
// Old installs stored a bare id (number/string); that shape can no longer resolve,
// so we clear it and treat it as "no saved concert" instead of crashing.
export const loadSavedEvent = (): SavedConcert | null => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEYS.savedEvent) || "null");
    const v = raw as SavedConcert;
    if (v && typeof v === "object" && typeof v.idol === "string" && typeof v.date === "string") {
      return v;
    }
    if (raw != null) remove(KEYS.savedEvent); // legacy id-pointer → drop
    return null;
  } catch { return null; }
};

// Fan Card fields (Step 4). `photo` is a downscaled JPEG data URL, so the whole record
// stays well under localStorage limits.
export interface FanCardRecord { name: string; bias: string; since: string; photo: string | null; }
export const loadFanCard = (): FanCardRecord | null => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEYS.fancard) || "null");
    const v = raw as FanCardRecord;
    if (v && typeof v === "object" && typeof v.name === "string" && typeof v.bias === "string") {
      return { name: v.name, bias: v.bias, since: typeof v.since === "string" ? v.since : "", photo: typeof v.photo === "string" ? v.photo : null };
    }
    return null;
  } catch { return null; }
};
