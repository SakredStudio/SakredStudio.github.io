import { useState, useCallback, useEffect } from "react";
import { slugify } from "../kpopGroups";
import { CUSTOM_PALETTE } from "../kpopGroups";
import { type Idol } from "../data/idols";
import { DROPS, type Drop } from "../data/drops";
import { CONCERT_KIT } from "../data/kit";
import { type Chant } from "../data/chants";
import { THEME, THEME_NAMES, type ThemeName } from "../theme";
import { track } from "../lib/beacon";
import { fetchDrops } from "../lib/drops";
import { FULL_CATALOG, CATALOG_BY_ID, customRegistry, registerCustom, getIdol, loadCustomGroups } from "../lib/groups";
import { KEYS, save, remove, has, loadIdols, loadChecked, loadChants, loadSavedEvent, loadFanCard, type SavedConcert } from "../lib/storage";
import { askWorker, FANI_SYSTEM, CHANT_SYSTEM, type ChatMessage } from "../lib/ai";

export type TabId = "home" | "concerts" | "fani" | "me";
export type AiMode = "idle" | "loading" | "done";
export interface Toast { id: number; msg: string; }

// All app state + handlers in one hook. Screens receive the returned object as `app`.
// Style AI was removed in v2 (ROADMAP.md §2.1); its state and handlers are gone.
export function useSwaiyu() {
  const [tab, setTab] = useState<TabId>("home");
  // Drops: start from the bundled copy, swap in public/drops.json once it arrives (B2).
  // A failed/slow fetch (null) keeps the bundled list, so Home always has data.
  const [drops, setDrops] = useState<Drop[]>(DROPS);
  useEffect(() => {
    let live = true;
    fetchDrops().then(fresh => { if (live && fresh) setDrops(fresh); });
    return () => { live = false; };
  }, []);
  const [myIdols, setMyIdols] = useState<string[]>(loadIdols);
  const [customGroups, setCustomGroups] = useState<Idol[]>(loadCustomGroups);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [savedEvent, setSavedEvent] = useState<SavedConcert | null>(loadSavedEvent);
  // "Save my concert" form state (group + date + optional city/venue).
  const [saveIdol, setSaveIdol] = useState<string>("");
  const [saveDate, setSaveDate] = useState<string>("");
  const [saveCity, setSaveCity] = useState<string>("");
  const [saveVenue, setSaveVenue] = useState<string>("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(loadChecked);
  // Fanchants: saved set (persisted) + UI state. Open/expand keyed by chant id (string)
  // so it survives a dynamic, reorderable set.
  const [myChants, setMyChants] = useState<Chant[]>(loadChants);
  const [openChant, setOpenChant] = useState<string | null>(null);
  const [showAllChants, setShowAllChants] = useState(false);
  const [chantLibGroup, setChantLibGroup] = useState<string>("all");
  const [chantFormGroup, setChantFormGroup] = useState<string>("");
  const [chantFormSong, setChantFormSong] = useState("");
  const [chantFormText, setChantFormText] = useState("");
  const [chantFormYt, setChantFormYt] = useState("");
  const [chantGenGroup, setChantGenGroup] = useState<string>("");
  const [chantGenSong, setChantGenSong] = useState("");
  const [chantMode, setChantMode] = useState<AiMode>("idle");
  const [glossSearch, setGlossSearch] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showOnboard, setShowOnboard] = useState(() => !has(KEYS.idols));
  const [aiMode, setAiMode] = useState<AiMode>("idle");
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  // Theme (Step 6): night | pastel | bias, persisted under swaiyu_theme.
  const [theme, setThemeState] = useState<ThemeName>(() => {
    try { const v = localStorage.getItem(KEYS.theme) as ThemeName | null; return v && THEME_NAMES.includes(v) ? v : "night"; }
    catch { return "night"; }
  });
  const setTheme = (name: ThemeName) => {
    setThemeState(name);
    try { localStorage.setItem(KEYS.theme, name); } catch { /* storage blocked */ }
    track(`theme_set_${name}`);
  };

  // Fan Card — persisted as one record (swaiyu_fancard) so the card survives a reload.
  const [fc] = useState(loadFanCard);
  const [fanName, setFanName] = useState(fc?.name ?? "");
  const [fanBias, setFanBias] = useState(fc?.bias ?? (loadIdols()[0] ?? "bts"));
  const [fanSince, setFanSince] = useState(fc?.since ?? "2020");
  const [fanPhoto, setFanPhoto] = useState<string | null>(fc?.photo ?? null);
  useEffect(() => {
    save(KEYS.fancard, { name: fanName, bias: fanBias, since: fanSince, photo: fanPhoto });
  }, [fanName, fanBias, fanSince, fanPhoto]);

  const pushToast = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, {id, msg}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  const toggleCheck = (key: string) => {
    setCheckedItems(c => {
      const next = {...c, [key]: !c[key]};
      save(KEYS.checked, next);
      return next;
    });
  };

  const toggleIdol = (id: string) => {
    setMyIdols(s => {
      const next = s.includes(id) ? s.filter(x => x !== id) : [...s, id];
      save(KEYS.idols, next);
      return next;
    });
  };

  // ── CHANTS: write-through persistence (mirrors toggleIdol) ──
  const persistChants = (next: Chant[]) => { save(KEYS.chants, next); return next; };
  const isChantSaved = (id: string) => myChants.some(c => c.id === id);
  const addChant = (chant: Chant) => setMyChants(s => persistChants(s.some(c => c.id === chant.id) ? s : [...s, chant]));
  const removeChant = (id: string) => {
    setMyChants(s => persistChants(s.filter(c => c.id !== id)));
    setOpenChant(o => (o === id ? null : o));
  };
  const toggleLibraryChant = (chant: Chant) => {
    if (isChantSaved(chant.id)) { removeChant(chant.id); pushToast("Removed from My Chants"); }
    else { addChant(chant); pushToast("✓ Added to My Chants"); }
  };
  const addCustomChant = () => {
    const song = chantFormSong.trim();
    const text = chantFormText.trim();
    if (!song || !text) { pushToast("Add a song title and chant text"); return; }
    const g = chantFormGroup ? getIdol(chantFormGroup) : undefined;
    const yt = chantFormYt.trim();
    addChant({
      id: crypto.randomUUID(),
      song,
      artist: g?.name ?? "Custom",
      idol: chantFormGroup || null,
      text,
      ytUrl: /^https?:\/\//i.test(yt) ? yt : null,
    });
    setChantFormSong(""); setChantFormText(""); setChantFormYt("");
    pushToast("🎤 Custom chant saved!");
  };

  // Add a free-text group. If the name matches a featured/catalog/custom entry
  // (case-insensitive) we toggle THAT entry on instead of creating a duplicate.
  const addCustomGroup = () => {
    const name = customInput.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name) return;
    const lc = name.toLowerCase();
    const existing = FULL_CATALOG.find(g => g.name.toLowerCase() === lc)
      ?? customGroups.find(g => g.name.toLowerCase() === lc);
    if (existing) {
      setCustomInput("");
      if (!myIdols.includes(existing.id)) { toggleIdol(existing.id); pushToast(`Added ${existing.name} 💜`); }
      else pushToast(`${existing.name} is already in your groups`);
      return;
    }
    let id = "c_" + slugify(name);
    if (CATALOG_BY_ID.has(id) || customRegistry.has(id)) id = `${id}-${customGroups.length}`;
    const color = CUSTOM_PALETTE[customGroups.length % CUSTOM_PALETTE.length];
    const group: Idol = { id, name, emoji: "🎤", color, era: "", fandom: "FAN", members: [], lightColor: color };
    registerCustom(group);
    setCustomGroups(prev => { const next = [...prev, group]; save(KEYS.customGroups, next); return next; });
    setMyIdols(prev => { const next = prev.includes(id) ? prev : [...prev, id]; save(KEYS.idols, next); return next; });
    setCustomInput("");
    pushToast(`Added ${name} 🎤`);
  };

  const myIdolData = myIdols.map(id => getIdol(id)).filter((x): x is Idol => !!x);

  // Save a self-contained concert ({idol,date,city?,venue?}) so the Home countdown can
  // render from these fields alone — no dependency on any event list.
  const saveConcert = () => {
    const idolId = saveIdol || myIdols[0];
    if (!idolId || !saveDate) { pushToast("Pick a group and a date"); return; }
    const sc: SavedConcert = {
      idol: idolId, date: saveDate,
      city: saveCity.trim() || undefined,
      venue: saveVenue.trim() || undefined,
    };
    setSavedEvent(sc);
    save(KEYS.savedEvent, sc);
    pushToast(`${getIdol(idolId)?.emoji ?? "🎵"} Concert saved!`);
  };
  const clearSavedConcert = () => {
    setSavedEvent(null);
    remove(KEYS.savedEvent);
    pushToast("Concert removed");
  };

  // Dynamic group theming: anchor = followed group's official color, else default violet.
  const anchor = myIdolData[0]?.color ?? THEME.primary;
  // Holographic hero gradient — first stop takes on the active group's color.
  const heroGradient = `linear-gradient(135deg,${anchor},${THEME.holoMid},${THEME.holoEnd})`;
  // Electric-pink emphasis for primary CTAs.
  const buyGradient = `linear-gradient(135deg,${THEME.accent},${THEME.holoMid})`;

  const sendAiMessage = async (override?: string) => {
    const userMsg = (override ?? aiInput).trim();
    if (!userMsg || aiMode === "loading") return;
    track("fani_send");
    setAiInput("");
    setAiMessages(m => [...m, {role: "user", content: userMsg}]);
    setAiMode("loading");
    try {
      const hist: ChatMessage[] = [...aiMessages, {role: "user", content: userMsg}];
      const reply = (await askWorker(FANI_SYSTEM(), hist)) || "Sorry, I couldn't find an answer — try rephrasing! 💜";
      setAiMessages(m => [...m, {role: "assistant", content: reply}]);
    } catch {
      setAiMessages(m => [...m, {role: "assistant", content: "Oops, something went wrong. Check your connection and try again! 💜"}]);
    }
    setAiMode("done");
  };

  // Generate a fanchant guide via FANI. Saved as an aiGenerated draft.
  const generateChant = async (groupId: string, song?: string) => {
    if (chantMode === "loading") return;
    const g = getIdol(groupId);
    if (!g) { pushToast("Pick a group first"); return; }
    setChantMode("loading");
    const songName = (song ?? "").trim();
    try {
      const text = await askWorker(CHANT_SYSTEM, [{role: "user", content: songName
        ? `Write a fanchant guide for ${g.name} — the song "${songName}".`
        : `Write a general fanchant guide for ${g.name} (member-name chant order + their most chant-heavy title track).`}]);
      if (!text.trim()) throw new Error("empty");
      addChant({
        id: crypto.randomUUID(),
        song: songName || `${g.name} fanchant`,
        artist: g.name,
        idol: groupId,
        text: text.trim(),
        ytUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${g.name} ${songName} fanchant`.trim())}`,
        aiGenerated: true,
      });
      setChantGenSong("");
      pushToast("✨ AI chant added — verify before the show");
    } catch {
      pushToast("Couldn't generate — try again!");
    }
    setChantMode("idle");
  };

  const completedChecks = Object.values(checkedItems).filter(Boolean).length;
  const totalChecks = CONCERT_KIT.reduce((a, p) => a + p.items.length, 0);

  return {
    tab, setTab,
    drops,
    myIdols, myIdolData, toggleIdol, customGroups, addCustomGroup,
    showPicker, setShowPicker, pickerSearch, setPickerSearch, customInput, setCustomInput,
    savedEvent, saveConcert, clearSavedConcert,
    saveIdol, setSaveIdol, saveDate, setSaveDate, saveCity, setSaveCity, saveVenue, setSaveVenue,
    checkedItems, toggleCheck, completedChecks, totalChecks,
    myChants, openChant, setOpenChant, showAllChants, setShowAllChants,
    chantLibGroup, setChantLibGroup, chantFormGroup, setChantFormGroup, chantFormSong, setChantFormSong,
    chantFormText, setChantFormText, chantFormYt, setChantFormYt, chantGenGroup, setChantGenGroup,
    chantGenSong, setChantGenSong, chantMode, isChantSaved, toggleLibraryChant, addCustomChant, removeChant, generateChant,
    glossSearch, setGlossSearch,
    toasts, pushToast,
    showOnboard, setShowOnboard,
    aiMode, aiMessages, aiInput, setAiInput, sendAiMessage,
    fanName, setFanName, fanBias, setFanBias, fanSince, setFanSince, fanPhoto, setFanPhoto,
    anchor, heroGradient, buyGradient,
    theme, setTheme,
  };
}

export type AppState = ReturnType<typeof useSwaiyu>;
