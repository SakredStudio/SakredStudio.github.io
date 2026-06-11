/* ═══════════════════════════════════════════════════════
   KPOP_GROUPS — static catalog (UI lives in App.tsx)

   The 8 "featured" groups stay in IDOLS inside App.tsx (their emoji/color/id
   are preserved exactly). This module adds the "popular" and "more" tiers.

   Resolver order in App.tsx is: featured (IDOLS) → catalog (this) → custom.
   Ids here are slugified from the name; they can never collide with the short
   featured ids (bts, bp, …) or the "c_"-prefixed custom ids.

   Fandom names flagged `// VERIFY` were not confidently known, so they ship as
   "FAN" (a wrong fandom name is worse than none).
═══════════════════════════════════════════════════════ */

export type GroupTier = "featured" | "popular" | "more";

export interface CatalogGroup {
  id: string;     // stable slug derived from name
  name: string;
  fandom: string;
  emoji: string;
  color: string;
  tier: GroupTier;
}

// "AMPERS&ONE" → "ampersandone", "(G)I-DLE" → "g-i-dle", "f(x)" → "f-x"
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type RawGroup = Omit<CatalogGroup, "id">;

const RAW: RawGroup[] = [
  // ── POPULAR ────────────────────────────────────────────────────────────────
  { name: "ENHYPEN",             fandom: "ENGENE",     emoji: "🧛", color: "#ef4444", tier: "popular" },
  { name: "TOMORROW X TOGETHER", fandom: "MOA",        emoji: "🐾", color: "#60a5fa", tier: "popular" },
  { name: "ATEEZ",               fandom: "ATINY",      emoji: "🏴‍☠️", color: "#f43f5e", tier: "popular" },
  { name: "LE SSERAFIM",         fandom: "FEARNOT",    emoji: "🦋", color: "#3b82f6", tier: "popular" },
  { name: "(G)I-DLE",            fandom: "NEVERLAND",  emoji: "🔥", color: "#ec4899", tier: "popular" },
  { name: "ITZY",                fandom: "MIDZY",      emoji: "💗", color: "#f43f5e", tier: "popular" },
  { name: "NCT DREAM",           fandom: "NCTzen",     emoji: "💚", color: "#22c55e", tier: "popular" },
  { name: "NCT 127",             fandom: "NCTzen",     emoji: "🌃", color: "#16a34a", tier: "popular" },
  { name: "EXO",                 fandom: "EXO-L",      emoji: "🐺", color: "#a78bfa", tier: "popular" },
  { name: "Red Velvet",          fandom: "ReVeluv",    emoji: "❤️", color: "#ef4444", tier: "popular" },
  { name: "ZEROBASEONE",         fandom: "ZEROSE",     emoji: "💙", color: "#38bdf8", tier: "popular" },
  { name: "RIIZE",               fandom: "BRIIZE",     emoji: "🌊", color: "#22d3ee", tier: "popular" },
  { name: "BABYMONSTER",         fandom: "MONSTIEZ",   emoji: "👹", color: "#f97316", tier: "popular" },
  { name: "ILLIT",               fandom: "GLLIT",      emoji: "🍒", color: "#fb7185", tier: "popular" },
  { name: "NMIXX",               fandom: "NSWER",      emoji: "🌀", color: "#3b82f6", tier: "popular" },
  { name: "BOYNEXTDOOR",         fandom: "ONEDOOR",    emoji: "🚪", color: "#f59e0b", tier: "popular" },
  { name: "TWS",                 fandom: "FAN",        emoji: "🐤", color: "#fbbf24", tier: "popular" }, // VERIFY
  { name: "KISS OF LIFE",        fandom: "KISSY",      emoji: "💋", color: "#f43f5e", tier: "popular" },
  { name: "TREASURE",            fandom: "Teume",      emoji: "💎", color: "#22d3ee", tier: "popular" },
  { name: "STAYC",               fandom: "SWITH",      emoji: "🫧", color: "#f472b6", tier: "popular" },

  // ── MORE (boy groups) ──────────────────────────────────────────────────────
  { name: "WayV",            fandom: "WayZenNi",   emoji: "🌌", color: "#7c3aed", tier: "more" },
  { name: "P1Harmony",       fandom: "P1ece",      emoji: "✨", color: "#38bdf8", tier: "more" },
  { name: "THE BOYZ",        fandom: "THE B",      emoji: "💫", color: "#ef4444", tier: "more" },
  { name: "MONSTA X",        fandom: "MONBEBE",    emoji: "🌙", color: "#dc2626", tier: "more" },
  { name: "GOT7",            fandom: "AHGASE",     emoji: "🐤", color: "#84cc16", tier: "more" },
  { name: "DAY6",            fandom: "MyDay",      emoji: "🎸", color: "#34d399", tier: "more" },
  { name: "iKON",            fandom: "iKONIC",     emoji: "🎈", color: "#ef4444", tier: "more" },
  { name: "WINNER",          fandom: "Inner Circle", emoji: "🌈", color: "#60a5fa", tier: "more" },
  { name: "BIGBANG",         fandom: "VIP",        emoji: "👑", color: "#fbbf24", tier: "more" },
  { name: "SHINee",          fandom: "Shawol",     emoji: "💠", color: "#22d3ee", tier: "more" },
  { name: "Super Junior",    fandom: "ELF",        emoji: "💙", color: "#3b82f6", tier: "more" },
  { name: "TVXQ",            fandom: "Cassiopeia", emoji: "🔴", color: "#dc2626", tier: "more" },
  { name: "2PM",             fandom: "Hottest",    emoji: "🐾", color: "#94a3b8", tier: "more" },
  { name: "INFINITE",        fandom: "Inspirit",   emoji: "♾️", color: "#f59e0b", tier: "more" },
  { name: "BTOB",            fandom: "Melody",     emoji: "🎵", color: "#3b82f6", tier: "more" },
  { name: "VIXX",            fandom: "Starlight",  emoji: "⭐", color: "#dc2626", tier: "more" },
  { name: "Highlight",       fandom: "Light",      emoji: "💡", color: "#f59e0b", tier: "more" },
  { name: "ASTRO",           fandom: "Aroha",      emoji: "🌟", color: "#fbbf24", tier: "more" },
  { name: "SF9",             fandom: "Fantasy",    emoji: "🎭", color: "#ef4444", tier: "more" },
  { name: "ONF",             fandom: "Fuse",       emoji: "🔆", color: "#38bdf8", tier: "more" },
  { name: "PENTAGON",        fandom: "Universe",   emoji: "🌐", color: "#7c3aed", tier: "more" },
  { name: "VICTON",          fandom: "Alice",      emoji: "🕯️", color: "#60a5fa", tier: "more" },
  { name: "Golden Child",    fandom: "Goldenness", emoji: "🥇", color: "#fbbf24", tier: "more" },
  { name: "AB6IX",           fandom: "ABNEW",      emoji: "🔷", color: "#3b82f6", tier: "more" },
  { name: "CIX",             fandom: "FIX",        emoji: "🦋", color: "#22d3ee", tier: "more" },
  { name: "VERIVERY",        fandom: "VERRER",     emoji: "🎯", color: "#f97316", tier: "more" },
  { name: "ONEUS",           fandom: "To Moon",    emoji: "🌑", color: "#a78bfa", tier: "more" },
  { name: "CRAVITY",         fandom: "LUVITY",     emoji: "⚡", color: "#f59e0b", tier: "more" },
  { name: "EPEX",            fandom: "ZENITH",     emoji: "🗻", color: "#34d399", tier: "more" },
  { name: "xikers",          fandom: "ROADY",      emoji: "🛼", color: "#fb7185", tier: "more" },
  { name: "NCT WISH",        fandom: "WISH",       emoji: "⭐", color: "#22c55e", tier: "more" },
  { name: "82MAJOR",         fandom: "MAJOR",      emoji: "🎙️", color: "#94a3b8", tier: "more" },
  { name: "Xdinary Heroes",  fandom: "XENO",       emoji: "🎸", color: "#ef4444", tier: "more" },
  { name: "n.SSign",         fandom: "FAN",        emoji: "✴️", color: "#38bdf8", tier: "more" }, // VERIFY
  { name: "AMPERS&ONE",      fandom: "FAN",        emoji: "🔣", color: "#a78bfa", tier: "more" }, // VERIFY
  { name: "TEMPEST",         fandom: "STORM",      emoji: "🌪️", color: "#22d3ee", tier: "more" },

  // ── MORE (girl groups) ─────────────────────────────────────────────────────
  { name: "Kep1er",          fandom: "Kep1ian",    emoji: "💎", color: "#f472b6", tier: "more" },
  { name: "fromis_9",        fandom: "flover",     emoji: "🌼", color: "#fbbf24", tier: "more" },
  { name: "VIVIZ",           fandom: "Na.V",       emoji: "🌹", color: "#fb7185", tier: "more" },
  { name: "MAMAMOO",         fandom: "Moomoo",     emoji: "🐮", color: "#f59e0b", tier: "more" },
  { name: "Oh My Girl",      fandom: "Miracle",    emoji: "🧚", color: "#f472b6", tier: "more" },
  { name: "Dreamcatcher",    fandom: "InSomnia",   emoji: "🦇", color: "#7c3aed", tier: "more" },
  { name: "EVERGLOW",        fandom: "FOREVER",    emoji: "🔆", color: "#ec4899", tier: "more" },
  { name: "LOONA",           fandom: "Orbit",      emoji: "🌙", color: "#60a5fa", tier: "more" },
  { name: "ARTMS",           fandom: "FAN",        emoji: "🌖", color: "#a78bfa", tier: "more" }, // VERIFY
  { name: "tripleS",         fandom: "FAN",        emoji: "🔺", color: "#22d3ee", tier: "more" }, // VERIFY
  { name: "Billlie",         fandom: "Belllie've", emoji: "🦋", color: "#818cf8", tier: "more" },
  { name: "PURPLE KISS",     fandom: "FAN",        emoji: "💜", color: "#7c3aed", tier: "more" }, // VERIFY
  { name: "Weeekly",         fandom: "Daileee",    emoji: "📅", color: "#34d399", tier: "more" },
  { name: "H1-KEY",          fandom: "FAN",        emoji: "🔑", color: "#f59e0b", tier: "more" }, // VERIFY
  { name: "FIFTY FIFTY",     fandom: "FAN",        emoji: "🪙", color: "#fb7185", tier: "more" }, // VERIFY
  { name: "CSR",             fandom: "FAN",        emoji: "🌸", color: "#f472b6", tier: "more" }, // VERIFY
  { name: "UNIS",            fandom: "UNIVERSE",   emoji: "🌐", color: "#38bdf8", tier: "more" },
  { name: "RESCENE",         fandom: "FAN",        emoji: "🎬", color: "#ec4899", tier: "more" }, // VERIFY
  { name: "MEOVV",           fandom: "FAN",        emoji: "🐱", color: "#a78bfa", tier: "more" }, // VERIFY
  { name: "izna",            fandom: "FAN",        emoji: "❄️", color: "#22d3ee", tier: "more" }, // VERIFY
  { name: "Hearts2Hearts",   fandom: "FAN",        emoji: "💞", color: "#fb7185", tier: "more" }, // VERIFY
  { name: "KiiiKiii",        fandom: "FAN",        emoji: "🐣", color: "#fbbf24", tier: "more" }, // VERIFY
  { name: "Girls' Generation", fandom: "SONE",     emoji: "👑", color: "#f472b6", tier: "more" },
  { name: "2NE1",            fandom: "Blackjack",  emoji: "🃏", color: "#ef4444", tier: "more" },
  { name: "Wonder Girls",    fandom: "Wonderful",  emoji: "💃", color: "#f59e0b", tier: "more" },
  { name: "KARA",            fandom: "Kamilia",    emoji: "🌟", color: "#fbbf24", tier: "more" },
  { name: "T-ARA",           fandom: "Queen's",    emoji: "👑", color: "#ec4899", tier: "more" },
  { name: "SISTAR",          fandom: "STAR1",      emoji: "☀️", color: "#f59e0b", tier: "more" },
  { name: "Apink",           fandom: "Pink Panda", emoji: "🐼", color: "#f472b6", tier: "more" },
  { name: "GFRIEND",         fandom: "Buddy",      emoji: "🌬️", color: "#60a5fa", tier: "more" },
  { name: "WJSN",            fandom: "Ujung",      emoji: "🌙", color: "#a78bfa", tier: "more" },
  { name: "EXID",            fandom: "LEGGO",      emoji: "🔥", color: "#ef4444", tier: "more" },
  { name: "AOA",             fandom: "Elvis",      emoji: "🎷", color: "#fb7185", tier: "more" },
  { name: "f(x)",            fandom: "MeU",        emoji: "🔮", color: "#22d3ee", tier: "more" },
  { name: "miss A",          fandom: "Say A",      emoji: "🅰️", color: "#ef4444", tier: "more" },
  { name: "IZ*ONE",          fandom: "WIZ*ONE",    emoji: "🌸", color: "#f472b6", tier: "more" },
];

export const KPOP_GROUPS: CatalogGroup[] = RAW.map((g) => ({ ...g, id: slugify(g.name) }));

// Palette used to assign a color to user-added custom groups (cycled by count).
export const CUSTOM_PALETTE: string[] = [
  "#7c3aed", "#ec4899", "#f97316", "#34d399", "#60a5fa",
  "#fb7185", "#22d3ee", "#f59e0b", "#c084fc", "#f472b6",
];
