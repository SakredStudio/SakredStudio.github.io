import { useState, useRef, useEffect, useCallback } from "react";
import { KPOP_GROUPS, CUSTOM_PALETTE, slugify, type CatalogGroup, type GroupTier } from "./kpopGroups";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
type TabId = "home" | "events" | "drops" | "style" | "fani" | "fan";
type FanSection = "fanchant" | "merch" | "budget" | "glossary" | "mygroups" | "fancard";
type AiMode = "idle" | "loading" | "done";

interface Toast { id: number; msg: string; }
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface StyleItem {
  cat: string; name: string; store: string; price: string;
  budget: string; url: string; why: string;
  searchQuery?: string; // short generic merchant-search term; falls back to name if absent
}
interface StyleResult { look: string; vibe: string; items: StyleItem[]; }

// A fanchant. Curated library entries carry structured `lines`; custom + AI-generated
// chants carry freeform `text`. `id` is stable (deterministic for library items,
// crypto.randomUUID() for user/AI ones) so the saved set survives add/remove/reorder.
interface ChantLine { lyric: string; chant: string; note: string; }
interface Chant {
  id: string;
  song: string;
  artist: string;
  idol: string | null;
  guide?: string;
  lines?: ChantLine[];
  text?: string;
  ytUrl?: string | null;
  aiGenerated?: boolean;
}

// A user-saved concert — fully self-contained, NOT a pointer into any list. The fan
// picks one of their followed groups, a date, and optionally a city/venue; we store
// exactly that, so the Home countdown renders from these fields alone (never stale).
interface SavedConcert {
  idol: string; date: string; city?: string; venue?: string;
}

// Maps a merchant name (case-insensitive) → that store's search-results URL for the
// given item, so "Buy" links land users on the actual product instead of the bare
// homepage. Sovrn affiliates these the same way (same merchant domain). Unknown
// stores return null so callers fall back to the existing homepage link (no breakage).
const STORE_SEARCH_TEMPLATES: Record<string, string> = {
  "asos": "https://www.asos.com/search/?q={q}",
  "zara": "https://www.zara.com/us/en/search?searchTerm={q}",
  "h&m": "https://www2.hm.com/en_us/search-results.html?q={q}",
  "shein": "https://www.shein.com/pdsearch/{q}",
  "urban outfitters": "https://www.urbanoutfitters.com/search?q={q}",
  "& other stories": "https://www.stories.com/en-ww/search/?q={q}",
  "mango": "https://shop.mango.com/us/en/search/women?q={q}",
  "yesstyle": "https://www.yesstyle.com/en/list.html?q={q}&bpt=48",
  "uniqlo": "https://www.uniqlo.com/us/en/search?q={q}",
};
function buildStoreSearchUrl(store: string, itemName: string): string | null {
  if (typeof store !== "string" || typeof itemName !== "string") return null;
  const tpl = STORE_SEARCH_TEMPLATES[store.trim().toLowerCase()];
  if (!tpl) return null;
  return tpl.replace("{q}", encodeURIComponent(itemName));
}

// Maps a ticket provider (case-insensitive) → that provider's search-results URL for the
// given artist, so Concert Kit "Get Tickets" links land on the artist's listings. Both
// providers are in our Sovrn network, so plain outbound links auto-affiliate at click
// time (same as the fashion Buy links). Unknown provider → null (caller skips the button).
const TICKET_SEARCH_TEMPLATES: Record<string, string> = {
  "vivid seats": "https://www.vividseats.com/search?searchTerm={q}",
  "stubhub": "https://www.stubhub.com/secure/Search?q={q}",
};
function buildTicketSearchUrl(provider: string, query: string): string | null {
  if (typeof provider !== "string" || typeof query !== "string") return null;
  const tpl = TICKET_SEARCH_TEMPLATES[provider.trim().toLowerCase()];
  if (!tpl) return null;
  return tpl.replace("{q}", encodeURIComponent(query));
}

// Live, never-stale concert lookup: deep-link straight into Ticketmaster's search for a
// followed group. Every current date (incl. ones a static list would miss) shows there,
// and Sovrn/VigLink rewrites this outbound link at click time for affiliate credit.
const concertSearchUrl = (group: string): string =>
  `https://www.ticketmaster.com/search?q=${encodeURIComponent(group)}`;
interface Idol {
  id: string; name: string; emoji: string; color: string;
  era: string; fandom: string; members: string[]; lightColor: string;
}

/* ═══════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════ */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html,body{height:100%;overscroll-behavior:none}
  ::-webkit-scrollbar{display:none}
  a{text-decoration:none;color:inherit}
  input,button,textarea{font-family:inherit}
  .tap{transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .12s;cursor:pointer;user-select:none}
  .tap:active{transform:scale(.94);opacity:.75}
  .fade{animation:fu .38s cubic-bezier(.22,1,.36,1) both}
  @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .s1{animation-delay:.05s}.s2{animation-delay:.10s}.s3{animation-delay:.15s}
  .s4{animation-delay:.20s}.s5{animation-delay:.25s}.s6{animation-delay:.30s}
  .card{border-radius:24px;background:rgba(139,63,255,.06);border:1px solid rgba(180,140,255,.14);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
  .pill{border-radius:50px;padding:6px 16px;font-size:11px;font-weight:700;border:none;cursor:pointer;white-space:nowrap;font-family:'Space Mono',monospace;transition:all .18s}
  .hrow{display:flex;gap:10px;overflow-x:auto;padding-bottom:2px}
  .spin{animation:sp .9s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
  .glow{box-shadow:0 0 22px rgba(var(--gc),0.38)}
  .h1{font-family:'Syne',sans-serif;font-weight:900;line-height:1.04;letter-spacing:-.025em}
  .mono{font-family:'Space Mono',monospace}
  .sans{font-family:'DM Sans',sans-serif}
  .lbl{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.28);font-family:'Space Mono',monospace;margin-bottom:7px}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:20px;font-size:9px;font-weight:700;font-family:'Space Mono'}
  .toast-wrap{position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px}
  .toast{background:rgba(12,6,28,.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:30px;padding:9px 20px;font-size:12px;font-weight:600;white-space:nowrap;animation:fu .3s cubic-bezier(.22,1,.36,1)}
  .shimmer{background:linear-gradient(90deg,transparent,rgba(255,255,255,.04) 50%,transparent);background-size:200% 100%;animation:sh 2.2s infinite}
  @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .aff-tag{display:inline-flex;align-items:center;padding:1px 7px;border-radius:10px;background:rgba(251,191,36,.12);color:#fbbf24;font-size:9px;font-weight:700;font-family:'Space Mono';letter-spacing:.04em}
  .live-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;animation:pulse 1.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
  .neon-border{border:1px solid;border-image:linear-gradient(135deg,var(--a1),var(--a2)) 1}
  .gradient-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .progress{height:3px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}
  .progress-fill{height:100%;border-radius:2px;transition:width .6s cubic-bezier(.22,1,.36,1)}
  .check-box{width:22px;height:22px;border-radius:7px;border:1.5px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .2s}
  .fc-card{border-radius:24px;overflow:hidden;position:relative;padding:24px 20px 20px;color:#fff}
`;

/* ═══════════════════════════════════════════════════════
   BRAND + THEME TOKENS  (single source of truth)
═══════════════════════════════════════════════════════ */
const APP_NAME = "Swaiyu";

const THEME = {
  bg:        "#0E0A1A", // concert-night base (near-black, purple undertone)
  text:      "#F5F0FF", // soft off-white
  textMuted: "#A89CC4", // low-saturation lilac-gray (derived from the violet)
  primary:   "#8B3FFF", // K-pop violet — default anchor
  accent:    "#FF3DAE", // electric pink — used sparingly (Buy emphasis)
  holoMid:   "#FF6EC7", // holographic gradient mid stop
  holoEnd:   "#4DD0FF", // holographic gradient end stop
};

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const IDOLS: Idol[] = [
  {id:"bts",name:"BTS",emoji:"💜",color:"#7c3aed",era:"Grand Chapter",fandom:"ARMY",members:["Jin","Suga","J-Hope","RM","Jimin","V","Jungkook"],lightColor:"#7c3aed"},
  {id:"bp",name:"BLACKPINK",emoji:"🌸",color:"#ec4899",era:"BORN PINK",fandom:"BLINK",members:["Jisoo","Jennie","Rosé","Lisa"],lightColor:"#ec4899"},
  {id:"skz",name:"Stray Kids",emoji:"⚡",color:"#f97316",era:"DOMINATE",fandom:"STAY",members:["Chan","Lee Know","Changbin","Hyunjin","Han","Felix","Seungmin","I.N"],lightColor:"#f97316"},
  {id:"aespa",name:"aespa",emoji:"❄️",color:"#a78bfa",era:"Armageddon",fandom:"MY",members:["Karina","Giselle","Winter","NingNing"],lightColor:"#a78bfa"},
  {id:"svt",name:"SEVENTEEN",emoji:"💎",color:"#34d399",era:"SPILL THE FEELS",fandom:"CARAT",members:["S.Coups","Jeonghan","Joshua","Jun","Hoshi","Wonwoo","Woozi","DK","Mingyu","The8","Seungkwan","Vernon","Dino"],lightColor:"#34d399"},
  {id:"nj",name:"NewJeans",emoji:"🐰",color:"#60a5fa",era:"How Sweet",fandom:"Bunnies",members:["Minji","Hanni","Danielle","Haerin","Hyein"],lightColor:"#60a5fa"},
  {id:"ive",name:"IVE",emoji:"🌊",color:"#fb7185",era:"WAVE",fandom:"DIVE",members:["Gaeul","Yujin","Rei","Wonyoung","Liz","Leeseo"],lightColor:"#fb7185"},
  {id:"twice",name:"TWICE",emoji:"💋",color:"#f43f5e",era:"Ready to Be",fandom:"ONCE",members:["Nayeon","Jeongyeon","Momo","Sana","Jihyo","Mina","Dahyun","Chaeyoung","Tzuyu"],lightColor:"#f43f5e"},
];

// Real upcoming comebacks (ISO `date`). `idol` resolves to a FULL_CATALOG id where the
// group clearly exists, else null. ytUrl is a live YouTube search built from artist+title.
const DROPS = [
  {artist:"(G)I-DLE",title:"We Made",type:"Mini Album",date:"2026-07-06",idol:"g-i-dle" as string|null,ytUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent("(G)I-DLE We Made")}` as string|null},
  {artist:"TXT (YEONJUN)",title:"NO LABELS: PART 02",type:"Mini Album",date:"2026-07-10",idol:"tomorrow-x-together" as string|null,ytUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent("TXT (YEONJUN) NO LABELS: PART 02")}` as string|null},
  {artist:"Dreamcatcher (UAU)",title:"Playlist #Your Youth",type:"Mini Album",date:"2026-07-01",idol:"dreamcatcher" as string|null,ytUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent("Dreamcatcher (UAU) Playlist #Your Youth")}` as string|null},
  {artist:"VAYONN",title:"Youth Today",type:"EP",date:"2026-07-06",idol:null as string|null,ytUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent("VAYONN Youth Today")}` as string|null},
  {artist:"ASCENDER",title:"Debut Single",type:"Single",date:"2026-07-02",idol:null as string|null,ytUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent("ASCENDER Debut Single")}` as string|null},
];

// Curated, browsable fanchant catalog. Stable `lib-${idol}-${slug(song)}` ids let these
// toggle in/out of the user's saved set (fandrop_chants) without collisions.
const CHANT_LIBRARY: Chant[] = [
  {id:`lib-bts-${slugify("Dynamite")}`,song:"Dynamite",artist:"BTS",idol:"bts",guide:"During the chorus, fans shout member names in order: Jin · Suga · J-Hope · RM · Jimin · V · Jungkook on the 'da-da-da-da' break.",
    lines:[{lyric:"'Cause I, I, I'm in the stars tonight",chant:"[clap clap]",note:"Double clap on downbeat"},{lyric:"So watch me bring the fire and set the night alight",chant:"JIN! SUGA! J-HOPE! RM!",note:"One name per beat"},{lyric:"Shining through the city",chant:"JIMIN! V! JUNGKOOK!",note:"End strong"}],
    ytUrl:"https://youtube.com/results?search_query=BTS+Dynamite+fanchant+guide"},
  {id:`lib-bp-${slugify("How You Like That")}`,song:"How You Like That",artist:"BLACKPINK",idol:"bp",guide:"Shout 'BLACKPINK!' before the first beat drops. During chorus, chant 'JISOO! JENNIE! ROSÉ! LISA!' in rapid succession.",
    lines:[{lyric:"Look at you, now look at me",chant:"BLACKPINK!",note:"Shout before the drop"},{lyric:"How you like that? How you like that?",chant:"JISOO! JENNIE!",note:"Sharp, punchy"},{lyric:"How you like that?",chant:"ROSÉ! LISA!",note:"Finish the quad"}],
    ytUrl:"https://youtube.com/results?search_query=BLACKPINK+How+You+Like+That+fanchant"},
  {id:`lib-skz-${slugify("MIROH")}`,song:"MIROH",artist:"Stray Kids",idol:"skz",guide:"Fast and intense. Shout all 8 members during the rap break. Crowd goes silent on the bridge for dramatic effect.",
    lines:[{lyric:"We go! Miroh!",chant:"[stomp stomp clap]",note:"Match the stomp"},{lyric:"[rap break]",chant:"CHAN! LEE KNOW! CHANGBIN! HYUNJIN!",note:"Loud and fast"},{lyric:"[continues]",chant:"HAN! FELIX! SEUNGMIN! I.N!",note:"Equal energy"}],
    ytUrl:"https://youtube.com/results?search_query=Stray+Kids+MIROH+fanchant"},
  {id:`lib-twice-${slugify("FANCY")}`,song:"FANCY",artist:"TWICE",idol:"twice",guide:"ONCE fans chant all 9 names. The chorus chant is iconic — practice it slowly first.",
    lines:[{lyric:"I just wanna make you fancy",chant:"NAYEON! JEONGYEON! MOMO!",note:"3 names, 3 beats"},{lyric:"Make you fancy me",chant:"SANA! JIHYO! MINA!",note:"Smooth and clear"},{lyric:"Fancy you, fancy you",chant:"DAHYUN! CHAEYOUNG! TZUYU!",note:"End triumphant"}],
    ytUrl:"https://youtube.com/results?search_query=TWICE+FANCY+fanchant"},
];

const CONCERT_KIT = [
  {phase:"30 Days Before",color:"#a78bfa",icon:"📅",items:[
    {t:"Secure your ticket",aff:true,url:"https://seatgeek.com",tag:"SeatGeek"},
    {t:"Order official lightstick (2-3 wk shipping from Korea)",aff:true,url:"https://weverse.io",tag:"Weverse"},
    {t:"Join official fan club for presale access next time",aff:false,url:"",tag:""},
    {t:"Start planning your concert outfit",aff:false,url:"",tag:""},
  ]},
  {phase:"14 Days Before",color:"#f97316",icon:"👗",items:[
    {t:"Order outfit pieces",aff:true,url:"https://yesstyle.com",tag:"YesStyle"},
    {t:"Learn fanchants for top 3 songs",aff:false,url:"",tag:""},
    {t:"Download Weverse — artists post updates here",aff:false,url:"",tag:""},
    {t:"Check venue bag policy (clear bags usually required)",aff:false,url:"",tag:""},
  ]},
  {phase:"3 Days Before",color:"#22d3ee",icon:"✅",items:[
    {t:"Practise fanchants one final time",aff:false,url:"",tag:""},
    {t:"Screenshot your ticket QR — no signal at venue",aff:false,url:"",tag:""},
    {t:"Prepare fan banner or slogan if making one",aff:false,url:"",tag:""},
    {t:"Check weather, plan layers",aff:false,url:"",tag:""},
  ]},
  {phase:"Day Of Concert",color:"#22c55e",icon:"🎤",items:[
    {t:"Arrive 90 min early for lightstick Bluetooth sync",aff:false,url:"",tag:""},
    {t:"Grab fan-made slogans outside venue (usually free!)",aff:false,url:"",tag:""},
    {t:"Check Weverse for last-minute artist posts",aff:false,url:"",tag:""},
    {t:"Charge phone to 100% — it's your backup lightstick",aff:false,url:"",tag:""},
  ]},
];

const MERCH_SHOPS = [
  {name:"Weverse Shop",tag:"Official",desc:"Direct from labels. Albums, lightsticks, official photo books.",color:"#7c3aed",price:"$15–$120",url:"https://weverse.io"},
  {name:"YesStyle",tag:"Best Value",desc:"K-fashion + K-pop. Often cheaper than Weverse with fast global shipping.",color:"#22d3ee",price:"$12–$80",url:"https://yesstyle.com"},
  {name:"Ktown4u",tag:"Pre-Orders",desc:"Pre-orders with POB benefits, group orders, idol birthday events.",color:"#34d399",price:"$15–$60",url:"https://ktown4u.com"},
  {name:"Cokodive",tag:"Budget Pick",desc:"Frequent sales, bundle deals. Great for budget collectors.",color:"#f59e0b",price:"$10–$45",url:"https://cokodive.com"},
  {name:"Pocamarket",tag:"Photocards",desc:"Biggest photocard marketplace. Buyer protection, worldwide shipping.",color:"#f43f5e",price:"$2–$50+",url:"https://pocamarket.com"},
];

const GLOSSARY = [
  {t:"Bias",d:"Your absolute favourite member. Your #1."},
  {t:"Bias Wrecker",d:"A member who keeps threatening to become your new #1."},
  {t:"Comeback",d:"When a group releases new music after a break. Always a major event."},
  {t:"Fanchant",d:"Scripted crowd cheers tied to specific song moments. Fans chant in unison."},
  {t:"Stan",d:"An intensely dedicated fan. Also a verb: 'I stan BTS.'"},
  {t:"Multistan",d:"A fan who actively follows multiple groups at once."},
  {t:"OT (n)",d:"'One True (n) members.' e.g. 'OT7' = you stan all 7 BTS members equally."},
  {t:"POB",d:"Pre-Order Benefit. Exclusive extras (photocards, posters) for pre-orders only."},
  {t:"Lightstick",d:"Official fandom merch — Bluetooth glowing stick used at concerts. $50–$90."},
  {t:"MV",d:"Music Video. K-pop MVs are cinematic productions on YouTube."},
  {t:"Hiatus",d:"When an idol takes a break from activities, often for mandatory military service."},
  {t:"Weverse",d:"HYBE's fan platform. Artists post here directly. Essential app for fans."},
  {t:"Line Distribution",d:"How much each member sings in a song. Debated endlessly online."},
  {t:"Sasaeng",d:"Extreme invasive fan who violates idols' privacy. Universally condemned."},
  {t:"Daesang",d:"Korea's highest music award. Equivalent of Album/Artist of the Year."},
  {t:"Disbandment",d:"When a group officially ends. One of the most dreaded events in fandom."},
];

const BUDGET_TIPS = [
  {icon:"💿",tip:"Buy albums without photocards",detail:"Fans sell albums for $5–8 after keeping the PC. Search #albumsale on Instagram or Twitter/X.",save:"Save 60–80% vs retail"},
  {icon:"⏳",tip:"Wait 3–4 weeks after release",detail:"PC prices spike on release day then crash. A $40 card often becomes $12 within a month.",save:"Save 50–70% on PCs"},
  {icon:"👥",tip:"Join group orders (GOs)",detail:"Fan pools for international shipping. Find GOs on r/kpop, Twitter, or Discord fandom servers.",save:"Save $15–30 per order"},
  {icon:"📦",tip:"Pre-order for POB benefits",detail:"Pre-ordering unlocks exclusive photocards (POBs) that sell for 3–5x more later.",save:"Get $15–40 in free extras"},
  {icon:"💡",tip:"Lightstick alternatives",detail:"Phone flashlight works fine. Or buy the previous gen lightstick for 50% less on Mercari.",save:"Save $30–60"},
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getDays = (d: string): number =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

// Live release status, derived from the date every call — NO stored countdown strings.
// future → "In N days" ("Tomorrow"/"Today 🎉" at 1/0); past ≤14d → "New"/"Released N
// days ago"; past >14d → hidden:true so the feed auto-expires stale releases.
interface DropStatus { label: string; upcoming: boolean; hidden: boolean; days: number; }
const dropStatus = (date: string): DropStatus => {
  const days = getDays(date);
  if (days > 1)  return { label: `In ${days} days`, upcoming: true, hidden: false, days };
  if (days === 1) return { label: "Tomorrow", upcoming: true, hidden: false, days };
  if (days === 0) return { label: "Today 🎉", upcoming: true, hidden: false, days };
  const ago = Math.abs(days);
  if (ago <= 14) return { label: ago <= 2 ? "New" : `Released ${ago} days ago`, upcoming: false, hidden: false, days };
  return { label: "", upcoming: false, hidden: true, days };
};
// Drop a generic-typed list to non-expired entries, sorted upcoming-soonest-first then
// most-recent past. Generic so both DROPS and the Home subset reuse it.
function liveDrops<T extends { date: string }>(list: T[]): { item: T; status: DropStatus }[] {
  return list
    .map(item => ({ item, status: dropStatus(item.date) }))
    .filter(x => !x.status.hidden)
    .sort((a, b) => {
      if (a.status.upcoming !== b.status.upcoming) return a.status.upcoming ? -1 : 1;
      return a.status.upcoming ? a.status.days - b.status.days : b.status.days - a.status.days;
    });
}

/* ── GROUP RESOLVER ───────────────────────────────────────────────────────────
   One lookup across featured (IDOLS) → catalog (KPOP_GROUPS) → custom (user-added).
   Catalog/custom groups are normalised into the Idol shape (era/members/lightColor
   are never rendered, so empty defaults are safe), so every existing consumer keeps
   working through the same getIdol() call site. */
const toIdol = (g: CatalogGroup): Idol => ({
  id: g.id, name: g.name, emoji: g.emoji, color: g.color,
  era: "", fandom: g.fandom, members: [], lightColor: g.color,
});

// Featured tier mirrored from IDOLS so the picker can show all tiers in one list.
const FEATURED_CATALOG: CatalogGroup[] = IDOLS.map(i => ({
  id: i.id, name: i.name, fandom: i.fandom, emoji: i.emoji, color: i.color, tier: "featured" as GroupTier,
}));
// Full browsable catalog (featured first, then popular, then more).
const FULL_CATALOG: CatalogGroup[] = [...FEATURED_CATALOG, ...KPOP_GROUPS];

const CATALOG_BY_ID = new Map<string, Idol>();
IDOLS.forEach(i => CATALOG_BY_ID.set(i.id, i));
KPOP_GROUPS.forEach(g => CATALOG_BY_ID.set(g.id, toIdol(g)));

// Registry for user-added custom groups, kept in sync with fandrop_customGroups so
// getIdol() can resolve them even when called during render.
const customRegistry = new Map<string, Idol>();
const registerCustom = (g: Idol) => customRegistry.set(g.id, g);

const getIdol = (id: string): Idol | undefined =>
  CATALOG_BY_ID.get(id) ?? customRegistry.get(id);

const loadCustomGroups = (): Idol[] => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem("fandrop_customGroups") || "[]");
    if (!Array.isArray(raw)) return [];
    const groups = raw
      .filter((g): g is Idol => !!g && typeof g.id === "string" && typeof g.name === "string")
      .map(g => ({ ...g, era: "", members: [], lightColor: g.color || THEME.primary }));
    groups.forEach(registerCustom);
    return groups;
  } catch { return []; }
};

const hexToRgb = (hex: string): string => {
  const parts = hex.replace("#", "").match(/../g);
  if (!parts || parts.length < 3) return "124,58,237";
  return parts.map(x => parseInt(x, 16)).join(",");
};

const loadIdols = (): string[] => {
  try { return JSON.parse(localStorage.getItem("fandrop_idols") || '["bts","bp"]'); }
  catch { return ["bts", "bp"]; }
};
const loadChecked = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem("fandrop_checkedItems") || "{}"); }
  catch { return {}; }
};
const loadWishlist = (): StyleItem[] => {
  try { return JSON.parse(localStorage.getItem("fandrop_wishlist") || "[]"); }
  catch { return []; }
};
// The user's saved chant set (NEW key, mirrors loadIdols). First run (key absent) →
// pre-seed with the 4 curated library chants so "My Chants" isn't empty out of the box.
const loadChants = (): Chant[] => {
  try {
    const raw = localStorage.getItem("fandrop_chants");
    if (raw == null) return CHANT_LIBRARY.slice();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Chant[]) : CHANT_LIBRARY.slice();
  } catch { return CHANT_LIBRARY.slice(); }
};
// A saved concert is now a self-contained {idol,date,city?,venue?} object — never a
// pointer into a list. Old installs stored a bare id (number/string); that shape can no
// longer resolve, so we clear it and treat it as "no saved concert" instead of crashing.
const loadSavedEvent = (): SavedConcert | null => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem("fandrop_savedEvent") || "null");
    const v = raw as SavedConcert;
    if (v && typeof v === "object" && typeof v.idol === "string" && typeof v.date === "string") {
      return v;
    }
    if (raw != null) localStorage.removeItem("fandrop_savedEvent"); // legacy id-pointer → drop
    return null;
  } catch { return null; }
};

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
const Lbl = ({children, style}: {children: React.ReactNode; style?: React.CSSProperties}) =>
  <div className="lbl" style={style}>{children}</div>;

const AffTag = () => <span className="aff-tag">AFFILIATE</span>;

const IdolTag = ({idol, size = 10}: {idol: string | Idol; size?: number}) => {
  const d: Idol | undefined = typeof idol === "string" ? getIdol(idol) : idol;
  if (!d) return null;
  return (
    <span style={{fontSize:size,padding:"2px 8px",borderRadius:14,background:`${d.color}22`,color:d.color,fontFamily:"'Space Mono'",fontWeight:700}}>
      {d.emoji} {d.name}
    </span>
  );
};

const ColorBar = ({color}: {color: string}) =>
  <div style={{height:2.5,background:`linear-gradient(90deg,${color},${color}44)`}}/>;

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
export default function FanDrop() {
  const [tab, setTab] = useState<TabId>("home");
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
  const [fanSection, setFanSection] = useState<FanSection>("fanchant");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem("fandrop_idols"));
  const [aiMode, setAiMode] = useState<AiMode>("idle");
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const aiEndRef = useRef<HTMLDivElement>(null);
  // Style AI
  const [stylePrompt, setStylePrompt] = useState("");
  const [styleIdol, setStyleIdol] = useState(() => loadIdols()[0] ?? "bts");
  const [styleMode, setStyleMode] = useState<AiMode>("idle");
  const [styleResults, setStyleResults] = useState<StyleResult | null>(null);
  const [wishlist, setWishlist] = useState<StyleItem[]>(loadWishlist);
  const [showWishlist, setShowWishlist] = useState(false);
  // Fan Card
  const [fanName, setFanName] = useState("");
  const [fanBias, setFanBias] = useState(() => loadIdols()[0] ?? "bts");
  const [fanSince, setFanSince] = useState("2020");
  const [fanPhoto, setFanPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pushToast = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, {id, msg}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  const toggleCheck = (key: string) => {
    setCheckedItems(c => {
      const next = {...c, [key]: !c[key]};
      localStorage.setItem("fandrop_checkedItems", JSON.stringify(next));
      return next;
    });
  };

  const toggleIdol = (id: string) => {
    setMyIdols(s => {
      const next = s.includes(id) ? s.filter(x => x !== id) : [...s, id];
      localStorage.setItem("fandrop_idols", JSON.stringify(next));
      return next;
    });
  };

  // ── CHANTS: write-through persistence to fandrop_chants (mirrors toggleIdol) ──
  const persistChants = (next: Chant[]) => {
    localStorage.setItem("fandrop_chants", JSON.stringify(next));
    return next;
  };
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
    setCustomGroups(prev => {
      const next = [...prev, group];
      localStorage.setItem("fandrop_customGroups", JSON.stringify(next));
      return next;
    });
    setMyIdols(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem("fandrop_idols", JSON.stringify(next));
      return next;
    });
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
    localStorage.setItem("fandrop_savedEvent", JSON.stringify(sc));
    pushToast(`${getIdol(idolId)?.emoji ?? "🎵"} Concert saved!`);
  };
  const clearSavedConcert = () => {
    setSavedEvent(null);
    localStorage.removeItem("fandrop_savedEvent");
    pushToast("Concert removed");
  };

  // Dynamic group theming: anchor = followed group's official color, else default violet.
  const anchor = myIdolData[0]?.color ?? THEME.primary;
  // Holographic hero gradient — first stop takes on the active group's color.
  const heroGradient = `linear-gradient(135deg,${anchor},${THEME.holoMid},${THEME.holoEnd})`;
  // Electric-pink emphasis for primary "Buy" CTAs.
  const buyGradient = `linear-gradient(135deg,${THEME.accent},${THEME.holoMid})`;

  const ANTHROPIC_HEADERS = {
    "Content-Type": "application/json",
  };

  const sendAiMessage = async (override?: string) => {
    const userMsg = (override ?? aiInput).trim();
    if (!userMsg || aiMode === "loading") return;
    setAiInput("");
    setAiMessages(m => [...m, {role: "user", content: userMsg}]);
    setAiMode("loading");

    try {
      const hist: ChatMessage[] = [...aiMessages, {role: "user", content: userMsg}];
      const response = await fetch("https://fandrop-ai.mihir86-mp.workers.dev", {
        method: "POST",
        headers: ANTHROPIC_HEADERS,
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: `You are a knowledgeable, enthusiastic K-pop fan assistant named FANI. You know everything about K-pop — groups, members, songs, albums, concerts, photocards, fan culture, Korean idol industry, merchandise, fanchants, and fan communities. You're warm, relatable, and talk like a fellow fan. Keep responses concise (2–4 sentences max unless listing things). Use relevant emoji sparingly. You help fans solve real problems: finding merch, learning fanchants, understanding K-pop culture, planning concerts, budgeting for fan activities, and staying up to date on releases. Current date: May 2026.`,
          messages: hist,
        }),
      });
      const data = await response.json();
      const reply: string = data.content?.find((b: {type: string}) => b.type === "text")?.text
        ?? "Sorry, I couldn't find an answer — try rephrasing! 💜";
      setAiMessages(m => [...m, {role: "assistant", content: reply}]);
      setAiMode("done");
    } catch {
      setAiMessages(m => [...m, {role: "assistant", content: "Oops, something went wrong. Check your connection and try again! 💜"}]);
      setAiMode("done");
    }
  };

  useEffect(() => {
    if (aiEndRef.current) aiEndRef.current.scrollIntoView({behavior: "smooth"});
  }, [aiMessages]);

  const completedChecks = Object.values(checkedItems).filter(Boolean).length;
  const totalChecks = CONCERT_KIT.reduce((a, p) => a + p.items.length, 0);

  const TABS: {id: TabId; icon: string; label: string}[] = [
    {id:"home",icon:"⚡",label:"Home"},
    {id:"events",icon:"🎟",label:"Events"},
    {id:"drops",icon:"🎵",label:"Drops"},
    {id:"style",icon:"👗",label:"AI Style"},
    {id:"fani",icon:"🤖",label:"FANI"},
    {id:"fan",icon:"💜",label:"Fan Hub"},
  ];

  const css = `
    ${G}
    :root{
      --bg:${THEME.bg};
      --s1:rgba(139,63,255,.07);
      --b1:rgba(180,140,255,.13);
      --t1:${THEME.text};
      --t2:${THEME.textMuted};
      --t3:rgba(168,156,196,.5);
      --a1:${anchor};
      --a2:${THEME.holoMid};
      --grad:${heroGradient};
      --gc:${hexToRgb(anchor)};
    }
  `;

  // Style AI helpers
  const toggleWish = (item: StyleItem) => {
    const has = wishlist.find(x => x.name === item.name);
    setWishlist(w => {
      const next = has ? w.filter(x => x.name !== item.name) : [...w, item];
      localStorage.setItem("fandrop_wishlist", JSON.stringify(next));
      return next;
    });
    pushToast(has ? "Removed from wishlist" : "❤️ Saved to wishlist!");
  };

  const generateStyle = async () => {
    if (styleMode === "loading") return;
    setStyleMode("loading");
    setStyleResults(null);
    const idol = getIdol(styleIdol);
    const prompt = stylePrompt.trim() || `${idol?.name ?? ""} ${idol?.era ?? ""} era fan outfit`;

    try {
      const res = await fetch("https://fandrop-ai.mihir86-mp.workers.dev", {
        method: "POST",
        headers: ANTHROPIC_HEADERS,
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: `You are a K-pop fashion stylist expert. Given a style request, return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
  "look": "Short look name",
  "vibe": "2-sentence description of the aesthetic",
  "items": [
    {
      "cat": "Category (Top/Bottom/Shoes/Outer/Bag/Accessory)",
      "name": "Specific product name",
      "searchQuery": "Short 2-4 word generic search term: core garment type + ONE key descriptor (e.g. 'silver chain necklace', 'oversized blazer', 'platform boots'). Broad enough to return results on a mainstream fashion retailer. NO brand names, NO 5+ word phrases, NO niche styling adjectives that over-constrain.",
      "store": "Store name (choose from: ASOS, YesStyle, Zara, H&M, Urban Outfitters, & Other Stories, Mango, SHEIN)",
      "price": "$XX",
      "budget": "Budget dupe store + price (e.g. SHEIN $9)",
      "url": "https://[store].com (use real domain)",
      "why": "1 sentence why it fits the look"
    }
  ]
}
Return exactly 5 items. Focus on real, purchasable K-pop inspired fashion. Mix high street and budget options. searchQuery is REQUIRED for every item and must stay short and generic so merchant search actually returns products.`,
          messages: [{role: "user", content: `Create a K-pop fan outfit for: ${prompt}`}],
        }),
      });
      const data = await res.json();
      const raw: string = data.content?.find((b: {type: string}) => b.type === "text")?.text ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      setStyleResults(JSON.parse(jsonMatch[0]) as StyleResult);
      setStyleMode("done");
    } catch {
      pushToast("Couldn't generate — try again!");
      setStyleMode("idle");
    }
  };

  // Generate a fanchant guide via FANI (same Worker, same model + token budget as the
  // other AI calls — the Worker's 1024 cap stands). Saved as an aiGenerated draft.
  const generateChant = async (groupId: string, song?: string) => {
    if (chantMode === "loading") return;
    const g = getIdol(groupId);
    if (!g) { pushToast("Pick a group first"); return; }
    setChantMode("loading");
    const songName = (song ?? "").trim();
    try {
      const res = await fetch("https://fandrop-ai.mihir86-mp.workers.dev", {
        method: "POST",
        headers: ANTHROPIC_HEADERS,
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: `You are a K-pop fanchant expert. Write a concise, practical fan-chant guide a fan can learn before a concert. Give the actual chant lines (member-name chants, "[clap]"/"[stomp]" cues, key call-and-response phrases) and say WHERE each goes in the song (intro, chorus, rap break, bridge). Keep it under ~150 words, plain text, no markdown headers. If you are unsure of exact official chants, say so briefly.`,
          messages: [{role: "user", content: songName
            ? `Write a fanchant guide for ${g.name} — the song "${songName}".`
            : `Write a general fanchant guide for ${g.name} (member-name chant order + their most chant-heavy title track).`}],
        }),
      });
      const data = await res.json();
      const text: string = data.content?.find((b: {type: string}) => b.type === "text")?.text ?? "";
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
      setChantMode("idle");
      pushToast("✨ AI chant added — verify before the show");
    } catch {
      pushToast("Couldn't generate — try again!");
      setChantMode("idle");
    }
  };

  const STYLE_PRESETS = [
    {label:"Airport OOTD",icon:"✈️",prompt:"K-pop idol airport fashion, oversized blazer, casual luxury streetwear"},
    {label:"Concert Fan",icon:"🎟",prompt:"K-pop concert fan outfit, lightstick-friendly, comfortable yet stylish"},
    {label:"Stage Glam",icon:"✨",prompt:"K-pop idol stage performance look, bold, eye-catching, performance ready"},
    {label:"Soft Girl",icon:"🌸",prompt:"K-pop soft girl aesthetic, pastel tones, feminine, cute everyday look"},
    {label:"Y2K Kpop",icon:"💿",prompt:"Y2K inspired K-pop fashion, low rise, rhinestones, retro futuristic"},
    {label:"Dark & Edgy",icon:"🖤",prompt:"Dark K-pop idol aesthetic, all-black, leather, edgy streetwear"},
  ];

  // Fan Card share
  const shareFanCard = async () => {
    const biasIdol = getIdol(fanBias);
    const fandoms = myIdolData.map(i => i.fandom).join(", ");
    const text = `🎶 ${APP_NAME} Fan Card\n\n${fanName || "A K-pop fan"}\n${biasIdol ? `Ultimate bias: ${biasIdol.emoji} ${biasIdol.name}` : ""}\nFandoms: ${fandoms}\nStan since: ${fanSince}\n\nGet ${APP_NAME}: https://fandrop.app`;
    try {
      if (navigator.share) {
        await navigator.share({title: `My ${APP_NAME} Fan Card`, text});
      } else {
        await navigator.clipboard.writeText(text);
        pushToast("Fan Card copied to clipboard! 💜");
      }
    } catch {
      pushToast("Fan Card copied to clipboard! 💜");
    }
  };

  // ── ONBOARD ──────────────────────────────────────────────────────────────────
  if (showOnboard) return (
    <div style={{fontFamily:"'DM Sans'",background:THEME.bg,minHeight:"100vh",color:THEME.text,display:"flex",justifyContent:"center"}}>
      <style>{G}</style>
      <div style={{width:"100%",maxWidth:430,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 24px 32px"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <img src="./icon-512.png" alt={APP_NAME} width={56} height={56} style={{width:56,height:56,marginBottom:14,borderRadius:14,objectFit:"contain",imageRendering:"auto"}}/>
            {/* Gradient + clip on the SAME text node via backgroundImage (longhand) so the
                shorthand never resets background-clip; solid fallback color guarantees it
                can never render invisible. */}
            <div className="h1" style={{fontSize:42,marginBottom:8,display:"inline-block",backgroundImage:heroGradient,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"#c084fc"}}>{APP_NAME}</div>
            <div className="sans" style={{fontSize:14,color:"rgba(255,255,255,.4)",lineHeight:1.7}}>The fan app built for real K-pop fans.<br/>Pick your groups to get started.</div>
          </div>
          <Lbl>Who do you stan? (pick all that apply)</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
            {IDOLS.map(idol => {
              const sel = myIdols.includes(idol.id);
              return (
                <div key={idol.id} className="tap" onClick={() => toggleIdol(idol.id)}
                  style={{borderRadius:16,border:`1.5px solid ${sel ? idol.color+"66" : "rgba(255,255,255,.08)"}`,background:sel ? `${idol.color}14` : "rgba(255,255,255,.03)",padding:"13px 14px",transition:"all .2s"}}>
                  <div style={{fontSize:22,marginBottom:5}}>{idol.emoji}</div>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:1}}>{idol.name}</div>
                  <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{idol.fandom}</div>
                  {sel && <div style={{marginTop:6,width:"100%",height:2,borderRadius:1,background:idol.color}}/>}
                </div>
              );
            })}
          </div>
          <button className="tap" onClick={() => setShowOnboard(false)} disabled={myIdols.length === 0}
            style={{width:"100%",padding:"16px",borderRadius:16,border:"none",background:myIdols.length > 0 ? heroGradient : "rgba(255,255,255,.07)",color:myIdols.length > 0 ? "#fff" : "rgba(255,255,255,.25)",fontSize:14,fontWeight:700,cursor:myIdols.length > 0 ? "pointer" : "default",fontFamily:"'Syne'",letterSpacing:"-.01em"}}>
            Enter {APP_NAME} {myIdols.length > 0 ? `— ${myIdols.length} group${myIdols.length > 1 ? "s" : ""} selected` : ""}
          </button>
          <div className="sans" style={{textAlign:"center",marginTop:12,fontSize:11,color:"rgba(255,255,255,.2)"}}>You can change your groups anytime in Fan Hub</div>
        </div>
      </div>
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────────
  const renderHome = () => {
    const event = savedEvent;
    const eventIdol = event ? getIdol(event.idol) : null;
    const eventColor = eventIdol?.color ?? "#7c3aed";
    const days = event ? getDays(event.date) : null;
    const eventWhere = event ? [event.venue, event.city].filter(Boolean).join(" · ") : "";
    // Same live filter/sort/expiry as the Drops tab, scoped to the user's groups.
    const myDrops = liveDrops(DROPS.filter(d => !d.idol || myIdols.includes(d.idol)));
    return (
      <div style={{overflowY:"auto",paddingBottom:90}}>
        <div style={{padding:"52px 22px 20px",position:"relative"}}>
          <Lbl>Your K-Pop Universe</Lbl>
          <div className="h1" style={{fontSize:44,marginBottom:6,display:"inline-block",backgroundImage:heroGradient,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"}}>{APP_NAME}</div>
          <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.38)",lineHeight:1.6}}>Concerts · Drops · Fan Tools · AI Fandom Assistant</div>
          <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
            {myIdolData.map(idol => (
              <div key={idol.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:`${idol.color}14`,border:`1px solid ${idol.color}28`}}>
                <span style={{fontSize:14}}>{idol.emoji}</span>
                <span style={{fontSize:11,fontWeight:700,color:idol.color,fontFamily:"'Space Mono'"}}>{idol.name}</span>
              </div>
            ))}
            <div className="tap" onClick={() => setShowPicker(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",cursor:"pointer"}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>+ Edit</span>
            </div>
          </div>
        </div>

        {event ? (
          <div className="tap shimmer fade" onClick={() => setTab("events")} style={{margin:"0 20px 18px",borderRadius:22,background:`linear-gradient(135deg,${eventColor}1a,rgba(255,255,255,.03))`,border:`1px solid ${eventColor}30`,padding:"18px 20px",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`${eventColor}0d`}}/>
            <Lbl style={{color:eventColor}}>🎟 My Concert · Tap for Full Kit</Lbl>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:8}}>
              <div className="h1" style={{fontSize:64,color:eventColor,lineHeight:1}}>{days != null ? Math.max(days, 0) : "—"}</div>
              <div className="sans" style={{fontSize:14,color:"rgba(255,255,255,.4)",marginBottom:10}}>days to go</div>
            </div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{eventIdol?.name ?? "My Concert"} {eventIdol?.emoji ?? "🎵"}</div>
            <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>{eventWhere || new Date(event.date).toDateString()}</div>
            {days != null && days >= 0 && days <= 14 && <div style={{marginTop:10,display:"inline-flex",gap:6,alignItems:"center",padding:"6px 13px",borderRadius:20,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.22)",color:"#ef4444",fontSize:11,fontFamily:"'Space Mono'",fontWeight:700}}><div className="live-dot"/> {days}d — Concert Kit urgent!</div>}
          </div>
        ) : (
          <div className="tap fade card" onClick={() => setTab("events")} style={{margin:"0 20px 18px",padding:"16px 18px",display:"flex",gap:14,alignItems:"center",border:"1.5px dashed rgba(192,132,252,.2)"}}>
            <div style={{fontSize:30}}>🎟</div>
            <div><div style={{fontSize:13,fontWeight:700,marginBottom:2}}>Save a Concert → Get Your Prep Kit</div><div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>Checklist, tickets, merch — all in one</div></div>
            <div style={{marginLeft:"auto",fontSize:20,color:"rgba(255,255,255,.18)"}}>›</div>
          </div>
        )}

        <div style={{padding:"0 22px 10px"}}><Lbl>🎵 My Group Drops</Lbl></div>
        {myDrops.length > 0 ? (
          <div className="hrow" style={{padding:"0 20px 18px"}}>
            {myDrops.slice(0, 6).map(({item: d, status}, i) => {
              const idol = d.idol ? getIdol(d.idol) : null;
              return (
                <div key={i} className="tap" onClick={() => d.ytUrl && window.open(d.ytUrl, "_blank")} style={{flexShrink:0,width:140,borderRadius:16,background:idol ? `${idol.color}14` : "rgba(255,255,255,.05)",border:`1px solid ${idol ? idol.color+"28" : "rgba(255,255,255,.07)"}`,padding:"12px 12px 10px"}}>
                  <div style={{fontSize:9,color:idol ? idol.color : "rgba(255,255,255,.35)",fontFamily:"'Space Mono'",letterSpacing:".07em",marginBottom:3}}>{d.type.toUpperCase()}</div>
                  <div style={{fontSize:12,fontWeight:700,lineHeight:1.2,marginBottom:3}}>{d.title}</div>
                  <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.38)",marginBottom:7}}>{d.artist}</div>
                  <div style={{fontSize:10,color:status.days === 0 ? "#ef4444" : status.upcoming ? "rgba(255,255,255,.3)" : idol ? idol.color : "#22c55e",fontFamily:"'Space Mono'"}}>{status.days === 0 ? "🔴 TODAY" : status.label}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tap" onClick={() => setTab("fani")} style={{margin:"0 20px 18px",padding:"16px 18px",borderRadius:16,background:"linear-gradient(135deg,rgba(124,58,237,.12),rgba(244,114,182,.06))",border:"1px solid rgba(192,132,252,.2)",display:"flex",gap:13,alignItems:"center"}}>
            <div style={{fontSize:26,flexShrink:0}}>✨</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>No tracked drops for your groups yet</div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.5}}>Ask FANI what's new with your groups →</div>
            </div>
            <div style={{fontSize:18,color:"rgba(255,255,255,.2)"}}>›</div>
          </div>
        )}

        <div className="tap fade card" onClick={() => setTab("fani")} style={{margin:"0 20px 18px",padding:"18px 18px",background:"linear-gradient(135deg,rgba(124,58,237,.14),rgba(244,114,182,.08))",border:"1px solid rgba(192,132,252,.2)"}}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:50,height:50,borderRadius:16,background:heroGradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤖</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                <div style={{fontSize:14,fontWeight:700}}>FANI — Your AI Fan Assistant</div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}><div className="live-dot"/><span style={{fontSize:9,color:"#ef4444",fontFamily:"'Space Mono'"}}>LIVE</span></div>
              </div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.6}}>Ask anything K-pop. Fanchants, merch advice, concert prep, music history — powered by Claude AI.</div>
            </div>
            <div style={{fontSize:18,color:"rgba(255,255,255,.18)"}}>›</div>
          </div>
        </div>

        <div style={{padding:"0 20px 28px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {([
            {icon:"🎤",label:"Fanchants",sub:"Learn before the show",tab:"fan" as TabId,section:"fanchant" as FanSection,c:"#7c3aed"},
            {icon:"📋",label:"Concert Kit",sub:"Full prep checklist",tab:"events" as TabId,section:undefined,c:"#f97316"},
            {icon:"🛍",label:"Official Merch",sub:"Where to shop safe",tab:"fan" as TabId,section:"merch" as FanSection,c:"#ec4899"},
            {icon:"💰",label:"Budget Tips",sub:"Fan on a budget",tab:"fan" as TabId,section:"budget" as FanSection,c:"#22c55e"},
            {icon:"📖",label:"K-Pop Glossary",sub:"New fan? Start here",tab:"fan" as TabId,section:"glossary" as FanSection,c:"#60a5fa"},
            {icon:"🎵",label:"New Drops",sub:"Latest releases",tab:"drops" as TabId,section:undefined,c:"#f43f5e"},
          ]).map((item, i) => (
            <div key={i} className={`card tap fade s${i+1}`} onClick={() => {setTab(item.tab); if (item.section) setFanSection(item.section);}} style={{padding:"16px 14px"}}>
              <div style={{fontSize:24,marginBottom:8}}>{item.icon}</div>
              <div className="h1" style={{fontSize:13,marginBottom:3}}>{item.label}</div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{item.sub}</div>
              <div style={{marginTop:10,width:22,height:2.5,borderRadius:2,background:item.c}}/>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── EVENTS / CONCERT KIT ──────────────────────────────────────────────────────
  const renderEvents = () => {
    const event = savedEvent;
    const days = event ? getDays(event.date) : null;
    const idol = event ? getIdol(event.idol) : null;
    const eventWhere = event ? [event.venue, event.city].filter(Boolean).join(" · ") : "";
    // Dark form-control styling, shared by the "Save my concert" inputs.
    const inputStyle: React.CSSProperties = {
      width:"100%",padding:"10px 12px",borderRadius:12,
      border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",
      color:"#fff",fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif",
    };
    return (
      <div style={{overflowY:"auto",paddingBottom:90}}>
        <div style={{padding:"52px 22px 16px"}}>
          <Lbl>Live Tickets + Full Kit</Lbl>
          <div className="h1" style={{fontSize:28,marginBottom:4}}>Concert<br/>Planner</div>
          <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.6}}>Tap a group for live Ticketmaster dates, save your show, then work the prep checklist.</div>
        </div>

        {/* ── LIVE GROUP GRID → Ticketmaster (never stored, never stale) ── */}
        <div style={{padding:"0 20px 8px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:12,fontWeight:700}}>🎤 Your Groups · Live Dates</div><AffTag/>
        </div>
        {myIdolData.length === 0 ? (
          <div style={{margin:"0 20px 18px",borderRadius:18,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"26px 18px",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>Follow a group to see live shows 🎤</div>
            <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:14,lineHeight:1.5}}>Pick your groups and we'll deep-link straight into their current Ticketmaster dates.</div>
            <button className="tap mono" onClick={() => setShowPicker(true)} style={{padding:"9px 16px",borderRadius:20,border:`1px solid ${THEME.primary}88`,background:THEME.primary+"22",color:"#C9A9FF",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Follow groups</button>
          </div>
        ) : (
          <div style={{padding:"0 20px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {myIdolData.map(g => {
              const tmUrl = concertSearchUrl(g.name);
              const resaleUrl = buildTicketSearchUrl("stubhub", g.name);
              return (
                <div key={g.id} style={{borderRadius:18,background:`${g.color}14`,border:`1px solid ${g.color}28`,padding:"14px 13px",display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                    <div style={{width:38,height:38,borderRadius:12,background:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{g.emoji}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                      <div className="sans" style={{fontSize:9,color:"rgba(255,255,255,.35)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.fandom}</div>
                    </div>
                  </div>
                  <a href={tmUrl} target="_blank" rel="noopener noreferrer">
                    <button className="tap" style={{width:"100%",padding:"9px",borderRadius:12,border:"none",background:buyGradient,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Space Mono'",boxShadow:`0 5px 16px ${THEME.accent}44`}}>Find tickets ↗</button>
                  </a>
                  {typeof resaleUrl === "string" && /^https?:\/\//i.test(resaleUrl) && (
                    <a href={resaleUrl} target="_blank" rel="noopener noreferrer" style={{textAlign:"center"}}>
                      <span className="mono" style={{fontSize:10,color:g.color}}>Check resale ↗</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SAVE MY CONCERT → self-contained {idol,date,city?,venue?} ── */}
        <div style={{padding:"0 20px 18px"}}>
          <div style={{borderRadius:18,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"14px 15px"}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>💾 Save My Concert</div>
            {myIdolData.length === 0 ? (
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.5}}>Follow a group above first, then save your show date here to unlock the Home countdown.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <select value={saveIdol || myIdols[0] || ""} onChange={e => setSaveIdol(e.target.value)} style={inputStyle}>
                  {myIdolData.map(g => <option key={g.id} value={g.id} style={{color:"#000"}}>{g.emoji} {g.name}</option>)}
                </select>
                <input type="date" value={saveDate} onChange={e => setSaveDate(e.target.value)} style={inputStyle}/>
                <div style={{display:"flex",gap:8}}>
                  <input type="text" placeholder="City (optional)" value={saveCity} onChange={e => setSaveCity(e.target.value)} style={inputStyle}/>
                  <input type="text" placeholder="Venue (optional)" value={saveVenue} onChange={e => setSaveVenue(e.target.value)} style={inputStyle}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="tap" onClick={saveConcert} style={{flex:1,padding:"10px",borderRadius:12,border:"none",background:buyGradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Space Mono'"}}>Save concert</button>
                  {event && <button className="tap" onClick={clearSavedConcert} style={{padding:"10px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.6)",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'"}}>Clear</button>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CONCERT KIT — always rendered & standalone (no saved concert required) ── */}
        <div className="fade" style={{padding:"0 20px 20px"}}>
            <div style={{borderRadius:22,background:`linear-gradient(135deg,${idol?.color ?? "#7c3aed"}10,rgba(255,255,255,.02))`,border:`1px solid ${idol?.color ?? "#7c3aed"}28`,overflow:"hidden",marginBottom:14}}>
              <div style={{padding:"16px 16px 12px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <Lbl style={{color:idol?.color}}>🎟 Concert Kit</Lbl>
                <div style={{fontSize:15,fontWeight:700}}>{event ? `${Math.max(days ?? 0, 0)} days · ${idol?.name ?? "Your show"}${eventWhere ? " · " + eventWhere : ""}` : "Your prep checklist"}</div>
              </div>

              <div style={{padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700}}>🌐 Official Merch</div><AffTag/>
                </div>
                <div style={{display:"flex",gap:7}}>
                  {["Weverse","Ktown4u"].map(shop => (
                    <a key={shop} href={shop === "Weverse" ? "https://weverse.io" : "https://ktown4u.com"} target="_blank" rel="noopener noreferrer" style={{flex:1}}>
                      <button className="tap" style={{width:"100%",padding:"9px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.65)",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'"}}>{shop} ↗</button>
                    </a>
                  ))}
                </div>
              </div>

              <div style={{padding:"13px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700}}>📋 Prep Checklist</div>
                  <div style={{fontSize:10,fontFamily:"'Space Mono'",color:idol?.color ?? "#7c3aed"}}>{completedChecks}/{totalChecks} done</div>
                </div>
                <div className="progress" style={{marginBottom:10}}>
                  <div className="progress-fill" style={{width:`${totalChecks > 0 ? (completedChecks/totalChecks)*100 : 0}%`,background:`linear-gradient(90deg,${idol?.color ?? "#7c3aed"},#f472b6)`}}/>
                </div>
                {CONCERT_KIT.map((phase, pi) => (
                  <div key={pi} style={{marginBottom:12}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:14}}>{phase.icon}</span>
                      <div style={{fontSize:11,fontWeight:700,color:phase.color,fontFamily:"'Space Mono'"}}>{phase.phase}</div>
                    </div>
                    {phase.items.map((item, ii) => {
                      const key = `${pi}-${ii}`, done = checkedItems[key];
                      return (
                        <div key={ii} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                          <div className="tap check-box" onClick={() => toggleCheck(key)} style={{borderColor:done ? phase.color : "rgba(255,255,255,.12)",background:done ? `${phase.color}20` : "transparent"}}>
                            {done && <span style={{fontSize:11,color:phase.color}}>✓</span>}
                          </div>
                          <div style={{flex:1}}>
                            <div className="sans" style={{fontSize:12,color:done ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.8)",textDecoration:done ? "line-through" : "none",lineHeight:1.4}}>{item.t}</div>
                            {item.aff && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <div style={{marginTop:3,display:"inline-flex",gap:4,alignItems:"center",fontSize:10,color:"#fbbf24"}}><AffTag/><span style={{fontFamily:"'Space Mono'"}}>{item.tag} ↗</span></div>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.18)",textAlign:"center"}}>Ticket & merch links are affiliate links · Prices may vary · {APP_NAME} earns a commission</div>
        </div>
      </div>
    );
  };

  // ── DROPS ─────────────────────────────────────────────────────────────────────
  const renderDrops = () => {
    // Live: derived from each date every render, upcoming-soonest-first then recent,
    // with >14d-past entries auto-expired by liveDrops().
    const visible = liveDrops(DROPS);
    return (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"52px 22px 16px"}}>
        <Lbl>Upcoming Releases</Lbl>
        <div className="h1" style={{fontSize:28}}>New Music<br/>Drops</div>
      </div>
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:11,paddingBottom:24}}>
        {visible.length === 0 ? (
          <div style={{borderRadius:18,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"28px 18px",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>No releases on the radar right now 🎵</div>
            <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.5}}>Check back soon — new comebacks get added as they're announced.</div>
          </div>
        ) : visible.map(({item: d, status}, i) => {
          const idol = d.idol ? getIdol(d.idol) : null;
          return (
            <div key={i} className="card fade" style={{animationDelay:`${i*.04}s`,overflow:"hidden"}}>
              <ColorBar color={idol?.color ?? "#6b7280"}/>
              <div style={{padding:"13px 13px 11px",display:"flex",gap:11,alignItems:"flex-start"}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${idol?.color ?? "#6b7280"}16`,border:`1px solid ${idol?.color ?? "#6b7280"}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {status.days === 0 ? "🔴" : status.upcoming ? "📅" : "🎵"}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:700}}>{d.title}</span>
                    {!status.upcoming && status.label === "New" && <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:"rgba(239,68,68,.18)",color:"#ef4444",fontFamily:"'Space Mono'",fontWeight:700}}>NEW</span>}
                  </div>
                  <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)",marginBottom:8}}>{d.artist} · {d.type} · {d.date}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    {d.ytUrl && <a href={d.ytUrl} target="_blank" rel="noopener noreferrer"><button className="tap pill" style={{background:"rgba(239,68,68,.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,.2)",fontSize:10}}>▶ YouTube</button></a>}
                    <span style={{fontSize:10,padding:"3px 10px",borderRadius:18,background:status.upcoming ? "rgba(255,255,255,.05)" : `${idol?.color ?? "#6b7280"}12`,color:status.upcoming ? "rgba(255,255,255,.45)" : idol?.color ?? "rgba(255,255,255,.4)",fontFamily:"'Space Mono'"}}>{status.label}</span>
                    {idol && <IdolTag idol={idol}/>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    );
  };

  // ── STYLE AI ──────────────────────────────────────────────────────────────────
  const renderStyle = () => (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      {wishlist.length > 0 && (
        <button className="tap" onClick={() => setShowWishlist(v => !v)} style={{position:"fixed",top:14,right:14,zIndex:400,width:40,height:40,borderRadius:12,background:"rgba(244,63,94,.15)",border:"1px solid rgba(244,63,94,.3)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
          ❤️<span style={{position:"absolute",top:-4,right:-4,width:17,height:17,borderRadius:"50%",background:"#f43f5e",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${THEME.bg}`,fontFamily:"'Space Mono'"}}>{wishlist.length}</span>
        </button>
      )}

      {showWishlist && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(10px)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={() => setShowWishlist(false)}>
          <div className="fade" style={{width:"100%",maxWidth:430,background:"#0c0718",borderRadius:"22px 22px 0 0",border:"1px solid rgba(255,255,255,.08)",padding:"18px 18px 40px",maxHeight:"72vh",overflowY:"auto"}} onClick={e => e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,.12)",margin:"0 auto 18px"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700,fontFamily:"'Syne'"}}>❤️ Wishlist ({wishlist.length})</div>
              <button className="tap" onClick={() => setShowWishlist(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:18,cursor:"pointer"}}>×</button>
            </div>
            {wishlist.map((item, i) => {
              const validUrl = typeof item.url === "string" && /^https?:\/\//i.test(item.url) ? item.url : null;
              const wishSearch = buildStoreSearchUrl(item.store, item.searchQuery || item.name);
              const buyUrl = wishSearch && /^https?:\/\//i.test(wishSearch) ? wishSearch : validUrl;
              return (
              <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👗</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:1}}>{item.name}</div>
                  <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{item.store} · {item.price}</div>
                </div>
                <div style={{display:"flex",gap:7}}>
                  {buyUrl && <a href={buyUrl} target="_blank" rel="noopener noreferrer"><button className="tap" style={{padding:"6px 12px",borderRadius:9,border:"1px solid rgba(192,132,252,.25)",background:"rgba(192,132,252,.1)",color:"#c084fc",fontSize:10,cursor:"pointer",fontFamily:"'Space Mono'"}}>Buy ↗</button></a>}
                  <button className="tap" onClick={() => toggleWish(item)} style={{padding:"6px 10px",borderRadius:9,border:"1px solid rgba(244,63,94,.2)",background:"rgba(244,63,94,.08)",color:"#f43f5e",fontSize:10,cursor:"pointer"}}>×</button>
                </div>
              </div>
              );
            })}
            <div className="sans" style={{marginTop:12,fontSize:9,color:"rgba(255,255,255,.18)",textAlign:"center"}}>All links are affiliate — {APP_NAME} earns a commission at no extra cost to you</div>
          </div>
        </div>
      )}

      <div style={{padding:"52px 22px 14px",position:"relative"}}>
        <Lbl>AI-Powered · Affiliate Commerce</Lbl>
        <div className="h1" style={{fontSize:28,marginBottom:4}}>AI Style<br/>Finder</div>
        <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.65}}>Describe any K-pop look → get shoppable outfit recommendations with real purchase links and budget dupes.</div>
      </div>

      <div style={{margin:"0 20px 16px",padding:"9px 13px",borderRadius:13,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.15)",display:"flex",gap:9,alignItems:"center"}}>
        <span style={{fontSize:14}}>💸</span>
        <div className="sans" style={{fontSize:11,color:"rgba(251,191,36,.8)",lineHeight:1.5}}>Every "Buy ↗" earns {APP_NAME} a commission via affiliate programs — at no extra cost to you.</div>
      </div>

      <div style={{padding:"0 20px 16px"}}>
        <Lbl style={{marginBottom:9}}>Base it on a group's style</Lbl>
        <div className="hrow" style={{marginBottom:14,flexWrap:"wrap"}}>
          {myIdolData.map(idol => (
            <button key={idol.id} className="tap pill" onClick={() => setStyleIdol(idol.id)} style={{flexShrink:0,background:styleIdol === idol.id ? `${idol.color}20` : "rgba(255,255,255,.04)",color:styleIdol === idol.id ? idol.color : "rgba(255,255,255,.3)",border:`1px solid ${styleIdol === idol.id ? idol.color+"44" : "rgba(255,255,255,.07)"}`}}>
              {idol.emoji} {idol.name}
            </button>
          ))}
          <button className="tap pill" onClick={() => setShowPicker(true)} style={{flexShrink:0,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.3)",border:"1px solid rgba(255,255,255,.07)"}}>+ Groups</button>
        </div>

        <Lbl style={{marginBottom:9}}>Quick style presets</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {STYLE_PRESETS.map((p, i) => (
            <button key={i} className="tap" onClick={() => setStylePrompt(p.prompt)} style={{borderRadius:13,border:`1px solid ${stylePrompt === p.prompt ? "rgba(192,132,252,.4)" : "rgba(255,255,255,.07)"}`,background:stylePrompt === p.prompt ? "rgba(192,132,252,.1)" : "rgba(255,255,255,.03)",padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{p.icon}</div>
              <div className="sans" style={{fontSize:10,fontWeight:600,color:stylePrompt === p.prompt ? "#c084fc" : "rgba(255,255,255,.55)",lineHeight:1.3}}>{p.label}</div>
            </button>
          ))}
        </div>

        <Lbl style={{marginBottom:8}}>Or describe your own look</Lbl>
        <div style={{borderRadius:14,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"12px 14px",marginBottom:14}}>
          <textarea value={stylePrompt} onChange={e => setStylePrompt(e.target.value)} placeholder="e.g. BTS Butter era pastel summer look, or BLACKPINK Paris Fashion Week street style…" rows={2} style={{width:"100%",background:"none",border:"none",color:THEME.text,fontSize:13,resize:"none",outline:"none",lineHeight:1.55}}/>
        </div>

        <button className="tap" onClick={generateStyle} disabled={styleMode === "loading"} style={{width:"100%",padding:"15px",borderRadius:15,border:"none",background:styleMode === "loading" ? "rgba(192,132,252,.15)" : heroGradient,color:"#fff",fontSize:13,fontWeight:700,cursor:styleMode === "loading" ? "default" : "pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:9,fontFamily:"'Syne'",letterSpacing:"-.01em",boxShadow:styleMode !== "loading" ? "0 8px 28px rgba(124,58,237,.35)" : "none",transition:"all .2s"}}>
          {styleMode === "loading" ? (
            <><div className="spin" style={{width:18,height:18,border:"2px solid rgba(255,255,255,.25)",borderTopColor:"#fff",borderRadius:"50%"}}/>Styling your look…</>
          ) : <>✨ Generate Outfit & Shop Links</>}
        </button>
      </div>

      {styleResults && (
        <div className="fade" style={{padding:"0 20px 24px"}}>
          <div style={{borderRadius:18,background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(236,72,153,.08))",border:"1px solid rgba(192,132,252,.2)",padding:"16px 16px",marginBottom:14}}>
            <div className="lbl" style={{color:"#c084fc",marginBottom:6}}>✨ Your Generated Look</div>
            <div className="h1" style={{fontSize:20,marginBottom:6}}>{styleResults.look}</div>
            <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.48)",lineHeight:1.65}}>{styleResults.vibe}</div>
          </div>

          <Lbl style={{marginBottom:10}}>🛍 Shop the Look <span style={{marginLeft:6}}><AffTag/></span></Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {(styleResults.items ?? []).map((item, i) => {
              const inWish = wishlist.find(x => x.name === item.name);
              const catLabel = typeof item.cat === "string" ? item.cat.toUpperCase() : "";
              const validUrl = typeof item.url === "string" && /^https?:\/\//i.test(item.url) ? item.url : null;
              // Prefer a merchant SEARCH url for the item; fall back to the AI homepage url.
              const searchUrl = buildStoreSearchUrl(item.store, item.searchQuery || item.name);
              const buyUrl = searchUrl && /^https?:\/\//i.test(searchUrl) ? searchUrl : validUrl;
              return (
                <div key={i} className="card fade" style={{overflow:"hidden",animationDelay:`${i*.05}s`}}>
                  <div style={{height:2,background:heroGradient}}/>
                  <div style={{padding:"12px 13px",display:"flex",gap:11,alignItems:"flex-start"}}>
                    <div style={{width:48,height:48,borderRadius:13,background:"rgba(192,132,252,.1)",border:"1px solid rgba(192,132,252,.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>
                      {item.cat==="Top"?"👕":item.cat==="Bottom"?"👖":item.cat==="Shoes"?"👟":item.cat==="Outer"?"🧥":item.cat==="Bag"?"👜":"💍"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:"#a78bfa",fontFamily:"'Space Mono'",letterSpacing:".1em",marginBottom:2}}>{catLabel}</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:2,lineHeight:1.2}}>{item.name}</div>
                      <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)",marginBottom:5}}>{item.store}</div>
                      <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.5,marginBottom:7,fontStyle:"italic"}}>"{item.why}"</div>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:12,fontWeight:700,fontFamily:"'Space Mono'",color:"#fff"}}>{item.price}</span>
                        {item.budget && <span style={{fontSize:10,fontFamily:"'Space Mono'",color:"#22c55e"}}>💚 {item.budget}</span>}
                      </div>
                    </div>
                    <button className="tap" onClick={() => toggleWish(item)} style={{width:32,height:32,borderRadius:9,border:`1px solid ${inWish ? "rgba(244,63,94,.35)" : "rgba(255,255,255,.1)"}`,background:inWish ? "rgba(244,63,94,.12)" : "rgba(255,255,255,.04)",fontSize:14,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {inWish ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div style={{padding:"0 13px 12px",display:"flex",gap:8}}>
                    {buyUrl && (
                    <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={{flex:1}}>
                      <button className="tap" style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:buyGradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Space Mono'",boxShadow:`0 6px 20px ${THEME.accent}55`}}>Buy at {item.store} ↗</button>
                    </a>
                    )}
                    {item.budget && (() => {
                      const budgetStore = item.budget.split(" ")[0];
                      // Dupe lands on the dupe store's search for the same item; unknown
                      // dupe stores keep the existing bare-homepage behavior.
                      const dupeSearch = buildStoreSearchUrl(budgetStore, item.searchQuery || item.name);
                      const bs = budgetStore.toLowerCase();
                      const budgetUrl = dupeSearch ?? (bs === "shein" ? "https://shein.com" : bs === "temu" ? "https://temu.com" : bs === "romwe" ? "https://romwe.com" : "https://yesstyle.com");
                      return (
                        <a href={budgetUrl} target="_blank" rel="noopener noreferrer">
                          <button className="tap" style={{padding:"10px 13px",borderRadius:12,border:"1px solid rgba(34,197,94,.25)",background:"rgba(34,197,94,.08)",color:"#22c55e",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'",whiteSpace:"nowrap"}}>💚 Dupe</button>
                        </a>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tap card" onClick={() => setTab("fani")} style={{marginTop:14,padding:"14px",display:"flex",gap:12,alignItems:"center",background:"rgba(124,58,237,.08)",border:"1px solid rgba(192,132,252,.18)"}}>
            <div style={{fontSize:22}}>🤖</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Ask FANI for more styling tips</div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>Get personalised fashion & fan advice from your AI assistant</div>
            </div>
            <div style={{fontSize:18,color:"rgba(255,255,255,.18)"}}>›</div>
          </div>

          <div style={{marginTop:10,padding:"8px",borderRadius:10,background:"rgba(255,255,255,.02)"}}>
            <div className="sans" style={{fontSize:9,color:"rgba(255,255,255,.18)",textAlign:"center"}}>Affiliate disclosure · {APP_NAME} earns a commission on purchases at no extra cost to you · Prices may vary · AI-generated suggestions</div>
          </div>

          <button className="tap" onClick={() => { setStyleResults(null); setStyleMode("idle"); setStylePrompt(""); }} style={{marginTop:12,width:"100%",padding:"10px",borderRadius:12,border:"1px solid rgba(255,255,255,.07)",background:"transparent",color:"rgba(255,255,255,.3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans'"}}>← Generate another look</button>
        </div>
      )}
    </div>
  );

  // ── FANI AI ───────────────────────────────────────────────────────────────────
  const renderFani = () => {
    const QUICK = [
      "What should I buy first as a new ARMY?",
      "How do I learn BTS fanchants fast?",
      "Best budget way to collect photocards?",
      "What are the best K-pop albums of 2026?",
      "How early should I arrive at a K-pop concert?",
      "What is the difference between Melon and Spotify charts?",
    ];
    return (
      <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 92px - env(safe-area-inset-bottom, 8px))"}}>
        <div style={{padding:"52px 22px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:46,height:46,borderRadius:14,background:heroGradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🤖</div>
            <div>
              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:1}}>
                <div className="h1" style={{fontSize:18}}>FANI</div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}><div className="live-dot"/><span style={{fontSize:9,color:"#ef4444",fontFamily:"'Space Mono'"}}>AI LIVE</span></div>
              </div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>Powered by Claude · Ask anything K-pop</div>
            </div>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {aiMessages.length === 0 && (
            <div className="fade">
              <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                <div style={{fontSize:40,marginBottom:10}}>💜</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:5}}>Hi! I'm FANI</div>
                <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.7}}>Your AI fan assistant. Ask me anything about K-pop — concerts, merch, music, culture, photocards, fan tips and more.</div>
              </div>
              <Lbl>Quick questions</Lbl>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {QUICK.map((q, i) => (
                  <div key={i} className="tap card" onClick={() => sendAiMessage(q)} style={{padding:"11px 14px",cursor:"pointer",animationDelay:`${i*.05}s`}}>
                    <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>{q}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {aiMessages.map((msg, i) => (
            <div key={i} className="fade" style={{marginBottom:12,display:"flex",flexDirection:"column",alignItems:msg.role === "user" ? "flex-end" : "flex-start"}}>
              {msg.role === "assistant" && <div style={{fontSize:9,color:"rgba(255,255,255,.28)",fontFamily:"'Space Mono'",marginBottom:4}}>FANI 🤖</div>}
              <div style={{maxWidth:"85%",padding:"11px 14px",borderRadius:msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",background:msg.role === "user" ? heroGradient : "rgba(255,255,255,.07)",border:msg.role === "assistant" ? "1px solid rgba(255,255,255,.08)" : "none"}}>
                <div className="sans" style={{fontSize:13,lineHeight:1.65,color:"rgba(255,255,255,.9)",whiteSpace:"pre-wrap"}}>{msg.content}</div>
              </div>
            </div>
          ))}
          {aiMode === "loading" && (
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:12,background:heroGradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
              <div style={{display:"flex",gap:5}}>
                {[0,1,2].map(n => <div key={n} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.3)",animation:`pulse ${1+n*.2}s ease-in-out infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={aiEndRef}/>
        </div>

        <div style={{flexShrink:0,padding:"12px 16px 16px",borderTop:"1px solid rgba(255,255,255,.06)",background:"rgba(6,4,14,.97)",backdropFilter:"blur(20px)",position:"relative",zIndex:2}}>
          <div style={{display:"flex",gap:9,alignItems:"flex-end"}}>
            <div style={{flex:1,borderRadius:16,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",padding:"11px 14px"}}>
              <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }} placeholder="Ask FANI anything K-pop…" rows={1} style={{width:"100%",background:"none",border:"none",color:THEME.text,fontSize:13,resize:"none",outline:"none",lineHeight:1.5}}/>
            </div>
            <button className="tap" onClick={() => sendAiMessage()} disabled={!aiInput.trim() || aiMode === "loading"} style={{width:44,height:44,borderRadius:13,border:"none",background:aiInput.trim() && aiMode !== "loading" ? heroGradient : "rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",flexShrink:0}}>
              {aiMode === "loading" ? <div className="spin" style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/> : "↑"}
            </button>
          </div>
          <div className="sans" style={{marginTop:7,fontSize:9,color:"rgba(255,255,255,.45)",textAlign:"center"}}>FANI is an AI — always verify critical info. Affiliate links throughout the app.</div>
        </div>
      </div>
    );
  };

  // ── FAN HUB ───────────────────────────────────────────────────────────────────
  const renderFan = () => {
    const biasData = getIdol(fanBias);
    return (
      <div style={{overflowY:"auto",paddingBottom:90}}>
        <div style={{padding:"52px 22px 14px"}}>
          <Lbl>Fan Tools & Resources</Lbl>
          <div className="h1" style={{fontSize:28}}>Fan Hub</div>
        </div>

        <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"0 20px 18px"}}>
          {([
            {id:"fancard",label:"🪪 Fan Card"},
            {id:"fanchant",label:"🎤 Fanchants"},
            {id:"merch",label:"🛍 Merch Shops"},
            {id:"budget",label:"💰 Budget Tips"},
            {id:"glossary",label:"📖 Glossary"},
            {id:"mygroups",label:"⚙️ My Groups"},
          ] as {id: FanSection; label: string}[]).map(s => (
            <button key={s.id} className="tap pill" onClick={() => setFanSection(s.id)} style={{flexShrink:0,background:fanSection === s.id ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.04)",color:fanSection === s.id ? "#fff" : "rgba(255,255,255,.3)",border:`1px solid ${fanSection === s.id ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.07)"}`}}>{s.label}</button>
          ))}
        </div>

        {/* FAN CARD */}
        {fanSection === "fancard" && (
          <div style={{padding:"0 20px 24px"}}>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => setFanPhoto(ev.target?.result as string);
              reader.readAsDataURL(file);
            }}/>

            <div className="fc-card" style={{background:`linear-gradient(135deg,${anchor}cc,#1a0a2e 60%,#0c0020)`,marginBottom:16,minHeight:220}}>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 20%,rgba(255,255,255,.05),transparent 60%)",pointerEvents:"none"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,position:"relative"}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:".2em",opacity:.6,fontFamily:"'Space Mono'",textTransform:"uppercase",marginBottom:4}}>{APP_NAME}</div>
                  <div className="h1" style={{fontSize:28,lineHeight:1.1}}>{fanName || "Your Name"}</div>
                </div>
                <div className="tap" onClick={() => fileRef.current?.click()} style={{width:56,height:56,borderRadius:16,background:"rgba(255,255,255,.12)",border:"1.5px dashed rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,cursor:"pointer"}}>
                  {fanPhoto ? <img src={fanPhoto} alt="fan" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:22}}>📸</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,position:"relative"}}>
                {myIdolData.map(idol => (
                  <span key={idol.id} style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:"rgba(255,255,255,.12)",fontFamily:"'Space Mono'",fontWeight:700}}>{idol.emoji} {idol.fandom}</span>
                ))}
              </div>
              <div style={{display:"flex",gap:16,position:"relative"}}>
                <div>
                  <div style={{fontSize:8,opacity:.5,fontFamily:"'Space Mono'",letterSpacing:".15em",textTransform:"uppercase",marginBottom:2}}>Ultimate Bias</div>
                  <div style={{fontSize:12,fontWeight:700,fontFamily:"'Space Mono'"}}>{biasData?.emoji} {biasData?.name}</div>
                </div>
                <div>
                  <div style={{fontSize:8,opacity:.5,fontFamily:"'Space Mono'",letterSpacing:".15em",textTransform:"uppercase",marginBottom:2}}>Stan Since</div>
                  <div style={{fontSize:12,fontWeight:700,fontFamily:"'Space Mono'"}}>{fanSince}</div>
                </div>
              </div>
            </div>

            <Lbl style={{marginBottom:8}}>Your fan name</Lbl>
            <div style={{borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"11px 14px",marginBottom:12}}>
              <input value={fanName} onChange={e => setFanName(e.target.value)} placeholder="e.g. PurpleWave / BTS_Joonie" maxLength={28} style={{width:"100%",background:"none",border:"none",color:THEME.text,fontSize:13,outline:"none"}}/>
            </div>

            <Lbl style={{marginBottom:8}}>Ultimate bias group</Lbl>
            <div className="hrow" style={{marginBottom:14,flexWrap:"wrap"}}>
              {myIdolData.map(idol => (
                <button key={idol.id} className="tap pill" onClick={() => setFanBias(idol.id)} style={{flexShrink:0,background:fanBias === idol.id ? `${idol.color}20` : "rgba(255,255,255,.04)",color:fanBias === idol.id ? idol.color : "rgba(255,255,255,.3)",border:`1px solid ${fanBias === idol.id ? idol.color+"44" : "rgba(255,255,255,.07)"}`}}>
                  {idol.emoji} {idol.name}
                </button>
              ))}
              <button className="tap pill" onClick={() => setShowPicker(true)} style={{flexShrink:0,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.3)",border:"1px solid rgba(255,255,255,.07)"}}>+ Groups</button>
            </div>

            <Lbl style={{marginBottom:8}}>Stan since</Lbl>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {["2019","2020","2021","2022","2023","2024","2025","2026"].map(yr => (
                <button key={yr} className="tap pill" onClick={() => setFanSince(yr)} style={{background:fanSince === yr ? "rgba(192,132,252,.2)" : "rgba(255,255,255,.04)",color:fanSince === yr ? "#c084fc" : "rgba(255,255,255,.35)",border:`1px solid ${fanSince === yr ? "rgba(192,132,252,.4)" : "rgba(255,255,255,.07)"}`}}>{yr}</button>
              ))}
            </div>

            <div style={{display:"flex",gap:9}}>
              <button className="tap" onClick={shareFanCard} style={{flex:1,padding:"14px",borderRadius:14,border:"none",background:heroGradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Syne'",letterSpacing:"-.01em"}}>
                💜 Share Fan Card
              </button>
              <button className="tap" onClick={() => fileRef.current?.click()} style={{padding:"14px 16px",borderRadius:14,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.6)",fontSize:13,cursor:"pointer"}}>
                📸
              </button>
            </div>
          </div>
        )}

        {/* FANCHANTS */}
        {fanSection === "fanchant" && (() => {
          const inputStyle: React.CSSProperties = {width:"100%",padding:"10px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif"};
          const visibleChants = showAllChants ? myChants : myChants.slice(0, 4);
          const libGroups = Array.from(new Set(CHANT_LIBRARY.map(c => c.idol).filter((x): x is string => !!x)));
          const libFiltered = chantLibGroup === "all" ? CHANT_LIBRARY : CHANT_LIBRARY.filter(c => c.idol === chantLibGroup);
          return (
          <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:16,paddingBottom:24}}>
            <div style={{padding:"10px 14px",borderRadius:14,background:"rgba(124,58,237,.07)",border:"1px solid rgba(124,58,237,.18)"}}>
              <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.65}}>💡 <strong style={{color:"#fff"}}>What is a fanchant?</strong> Scripted fan cheers tied to specific song moments. The whole crowd chants together — one of the most electric parts of any K-pop concert.</div>
            </div>

            {/* ── MY CHANTS (first 4 + show-all expand) ── */}
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <Lbl style={{marginBottom:0}}>🎤 My Chants ({myChants.length})</Lbl>
                {myChants.length > 4 && (
                  <button className="tap mono" onClick={() => setShowAllChants(v => !v)} style={{padding:"5px 12px",borderRadius:18,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.6)",fontSize:10,fontWeight:700,cursor:"pointer"}}>{showAllChants ? "Show less" : `Show all (${myChants.length})`}</button>
                )}
              </div>
              {myChants.length === 0 ? (
                <div style={{borderRadius:16,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"22px 16px",textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:5}}>No saved chants yet 🎤</div>
                  <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.5}}>Add one from the library below, write your own, or generate one with FANI.</div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:11}}>
                  {visibleChants.map(fc => {
                    const idol = fc.idol ? getIdol(fc.idol) : null;
                    const color = idol?.color ?? "#7c3aed";
                    const open = openChant === fc.id;
                    return (
                      <div key={fc.id} className="card" style={{overflow:"hidden"}}>
                        <ColorBar color={color}/>
                        <div className="tap" onClick={() => setOpenChant(open ? null : fc.id)} style={{padding:"13px 13px 11px",display:"flex",gap:11,alignItems:"center"}}>
                          <div style={{width:46,height:46,borderRadius:13,background:`${color}18`,border:`1px solid ${color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{idol?.emoji ?? "🎤"}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:700,marginBottom:2,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                              <span>{fc.song}</span>
                              {fc.aiGenerated && <span style={{fontSize:8,padding:"2px 7px",borderRadius:18,background:"rgba(251,191,36,.16)",color:"#fbbf24",fontFamily:"'Space Mono'",fontWeight:700,letterSpacing:".04em"}}>AI</span>}
                            </div>
                            {fc.idol ? <IdolTag idol={fc.idol}/> : <span className="sans" style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{fc.artist}</span>}
                          </div>
                          <div style={{fontSize:19,color:"rgba(255,255,255,.18)",transition:"transform .3s",transform:open ? "rotate(90deg)" : "none"}}>›</div>
                        </div>
                        {open && (
                          <div className="fade" style={{padding:"0 13px 14px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                            {fc.aiGenerated && <div className="sans" style={{marginTop:10,marginBottom:10,fontSize:10,color:"#fbbf24",background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",borderRadius:10,padding:"7px 10px",lineHeight:1.5}}>⚠️ AI-generated — verify before the show.</div>}
                            {fc.guide && <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.65,marginBottom:12,marginTop:fc.aiGenerated ? 0 : 10}}>{fc.guide}</div>}
                            {fc.lines && fc.lines.length > 0 && (
                              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                                {fc.lines.map((l, li) => (
                                  <div key={li} style={{borderRadius:12,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"10px 12px"}}>
                                    <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)",marginBottom:4,fontStyle:"italic"}}>"{l.lyric}"</div>
                                    <div style={{fontSize:12,fontWeight:700,color:color,fontFamily:"'Space Mono'",marginBottom:3}}>{l.chant}</div>
                                    <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.28)"}}>{l.note}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {fc.text && <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.62)",lineHeight:1.7,marginBottom:12,marginTop:(!fc.guide && !fc.aiGenerated) ? 10 : 0,whiteSpace:"pre-wrap"}}>{fc.text}</div>}
                            {fc.ytUrl && (
                              <a href={fc.ytUrl} target="_blank" rel="noopener noreferrer">
                                <button className="tap" style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${color}28`,background:`${color}0e`,color:color,fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'",marginBottom:8}}>▶ Fanchant Video on YouTube</button>
                              </a>
                            )}
                            <button className="tap" onClick={() => removeChant(fc.id)} style={{width:"100%",padding:"9px",borderRadius:12,border:"1px solid rgba(239,68,68,.22)",background:"rgba(239,68,68,.08)",color:"#ef4444",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'"}}>Remove from My Chants</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── GENERATE WITH FANI ── */}
            <div className="card" style={{padding:"14px 15px"}}>
              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700}}>✨ Generate with FANI</div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}><div className="live-dot"/><span style={{fontSize:9,color:"#ef4444",fontFamily:"'Space Mono'"}}>AI</span></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <select value={chantGenGroup || myIdols[0] || ""} onChange={e => setChantGenGroup(e.target.value)} style={inputStyle}>
                  {FULL_CATALOG.map(g => <option key={g.id} value={g.id} style={{color:"#000"}}>{g.emoji} {g.name}</option>)}
                </select>
                <input type="text" placeholder="Song (optional)" value={chantGenSong} onChange={e => setChantGenSong(e.target.value)} style={inputStyle}/>
                <button className="tap" disabled={chantMode === "loading"} onClick={() => generateChant(chantGenGroup || myIdols[0] || "bts", chantGenSong)} style={{width:"100%",padding:"11px",borderRadius:12,border:"none",background:chantMode === "loading" ? "rgba(255,255,255,.08)" : heroGradient,color:"#fff",fontSize:12,fontWeight:700,cursor:chantMode === "loading" ? "default" : "pointer",fontFamily:"'Space Mono'",opacity:chantMode === "loading" ? .7 : 1}}>{chantMode === "loading" ? "Generating…" : "Generate chant"}</button>
                <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.3)",textAlign:"center"}}>AI draft — always verify the chant before the show.</div>
              </div>
            </div>

            {/* ── ADD CUSTOM CHANT ── */}
            <div className="card" style={{padding:"14px 15px"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>➕ Add Custom Chant</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <select value={chantFormGroup || myIdols[0] || ""} onChange={e => setChantFormGroup(e.target.value)} style={inputStyle}>
                  {FULL_CATALOG.map(g => <option key={g.id} value={g.id} style={{color:"#000"}}>{g.emoji} {g.name}</option>)}
                </select>
                <input type="text" placeholder="Song title" value={chantFormSong} onChange={e => setChantFormSong(e.target.value)} style={inputStyle}/>
                <textarea placeholder="Chant / lyrics — one line per cue" value={chantFormText} onChange={e => setChantFormText(e.target.value)} rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.5}}/>
                <input type="text" placeholder="YouTube URL (optional)" value={chantFormYt} onChange={e => setChantFormYt(e.target.value)} style={inputStyle}/>
                <button className="tap" onClick={addCustomChant} style={{width:"100%",padding:"11px",borderRadius:12,border:"none",background:buyGradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Space Mono'"}}>Add chant</button>
              </div>
            </div>

            {/* ── CHANT LIBRARY (browse + add/remove) ── */}
            <div>
              <Lbl>📚 Chant Library</Lbl>
              <select value={chantLibGroup} onChange={e => setChantLibGroup(e.target.value)} style={{...inputStyle,marginBottom:10}}>
                <option value="all" style={{color:"#000"}}>All groups</option>
                {libGroups.map(gid => <option key={gid} value={gid} style={{color:"#000"}}>{getIdol(gid)?.emoji ?? "🎵"} {getIdol(gid)?.name ?? gid}</option>)}
              </select>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {libFiltered.map(c => {
                  const idol = c.idol ? getIdol(c.idol) : null;
                  const color = idol?.color ?? "#7c3aed";
                  const saved = isChantSaved(c.id);
                  return (
                    <div key={c.id} style={{borderRadius:14,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"11px 12px",display:"flex",gap:11,alignItems:"center"}}>
                      <div style={{width:38,height:38,borderRadius:11,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{idol?.emoji ?? "🎵"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.song}</div>
                        <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.38)"}}>{c.artist}</div>
                      </div>
                      <button className="tap mono" onClick={() => toggleLibraryChant(c)} style={{flexShrink:0,padding:"7px 13px",borderRadius:18,border:`1px solid ${saved ? "rgba(255,255,255,.12)" : color+"66"}`,background:saved ? "rgba(255,255,255,.04)" : `${color}1e`,color:saved ? "rgba(255,255,255,.5)" : "#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>{saved ? "✓ Added" : "+ Add"}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })()}

        {/* MERCH */}
        {fanSection === "merch" && (
          <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
            {MERCH_SHOPS.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">
                <div className="card tap fade" style={{animationDelay:`${i*.04}s`,padding:"14px 15px"}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:44,height:44,borderRadius:12,background:`${s.color}18`,border:`1px solid ${s.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🛍</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:700}}>{s.name}</span>
                        <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:`${s.color}18`,color:s.color,fontFamily:"'Space Mono'",fontWeight:700}}>{s.tag}</span>
                        <AffTag/>
                      </div>
                      <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.42)",lineHeight:1.55,marginBottom:5}}>{s.desc}</div>
                      <div style={{fontSize:10,fontFamily:"'Space Mono'",color:"#22c55e"}}>{s.price}</div>
                    </div>
                    <div style={{fontSize:16,color:"rgba(255,255,255,.18)"}}>↗</div>
                  </div>
                </div>
              </a>
            ))}
            <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.18)",textAlign:"center",padding:"4px 0"}}>All links are affiliate links · {APP_NAME} earns a small commission at no extra cost to you</div>
          </div>
        )}

        {/* BUDGET */}
        {fanSection === "budget" && (
          <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
            <div style={{padding:"10px 14px",borderRadius:14,background:"rgba(34,197,94,.07)",border:"1px solid rgba(34,197,94,.18)"}}>
              <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.65}}>💚 K-pop is expensive. Concerts, lightsticks, albums, photocards — it adds up fast. These tips from real fan communities help you participate without breaking the bank.</div>
            </div>
            {BUDGET_TIPS.map((t, i) => (
              <div key={i} className="card fade" style={{animationDelay:`${i*.04}s`,padding:"14px 15px"}}>
                <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
                  <div style={{width:40,height:40,borderRadius:11,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{t.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{t.tip}</div>
                    <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.55,marginBottom:7}}>{t.detail}</div>
                    <div style={{fontSize:10,padding:"3px 10px",borderRadius:18,display:"inline-block",background:"rgba(34,197,94,.1)",color:"#22c55e",fontFamily:"'Space Mono'"}}>{t.save}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GLOSSARY */}
        {fanSection === "glossary" && (
          <div style={{padding:"0 20px",paddingBottom:24}}>
            <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:14,padding:"10px 14px",display:"flex",gap:9,alignItems:"center",marginBottom:14}}>
              <span style={{opacity:.4,fontSize:14}}>🔍</span>
              <input value={glossSearch} onChange={e => setGlossSearch(e.target.value)} placeholder="Search K-pop terms…" style={{background:"none",border:"none",color:THEME.text,fontSize:13,flex:1,outline:"none"}}/>
            </div>
            {GLOSSARY.filter(g => !glossSearch || g.t.toLowerCase().includes(glossSearch.toLowerCase()) || g.d.toLowerCase().includes(glossSearch.toLowerCase())).map((g, i) => (
              <div key={i} style={{padding:"11px 14px",borderRadius:13,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:7}}>
                <div style={{fontSize:13,fontWeight:700,color:"#c084fc",fontFamily:"'Space Mono'",marginBottom:3}}>{g.t}</div>
                <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.55}}>{g.d}</div>
              </div>
            ))}
            {GLOSSARY.filter(g => !glossSearch || g.t.toLowerCase().includes(glossSearch.toLowerCase()) || g.d.toLowerCase().includes(glossSearch.toLowerCase())).length === 0 && (
              <div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,.22)"}}>
                <div style={{fontSize:36,marginBottom:8}}>🔍</div>
                <div className="sans">No terms found</div>
              </div>
            )}
          </div>
        )}

        {/* MY GROUPS */}
        {fanSection === "mygroups" && (
          <div style={{padding:"0 20px",paddingBottom:24}}>
            <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.4)",lineHeight:1.7,marginBottom:16}}>Your personalised feed, drops, and fanchants are based on the groups you follow. Browse 100+ groups or add your own.</div>
            <button className="tap" onClick={() => setShowPicker(true)} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:heroGradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Syne'",letterSpacing:"-.01em",marginBottom:18}}>
              🔍 Browse & Add Groups
            </button>
            <Lbl style={{marginBottom:10}}>Following ({myIdolData.length})</Lbl>
            {myIdolData.length > 0 ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {myIdolData.map(idol => (
                  <div key={idol.id} className="tap" onClick={() => { toggleIdol(idol.id); pushToast(`Removed ${idol.name}`); }}
                    style={{borderRadius:16,border:`1.5px solid ${idol.color}55`,background:`${idol.color}12`,padding:"14px 13px",transition:"all .2s",position:"relative"}}>
                    <div style={{position:"absolute",top:10,right:11,fontSize:13,color:"rgba(255,255,255,.3)"}}>×</div>
                    <div style={{fontSize:24,marginBottom:6}}>{idol.emoji}</div>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{idol.name}</div>
                    <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:6}}>{idol.fandom}</div>
                    <div style={{width:"100%",height:2,borderRadius:1,background:idol.color}}/>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sans" style={{textAlign:"center",padding:"20px 0",fontSize:12,color:"rgba(255,255,255,.3)"}}>No groups yet — tap "Browse & Add Groups" to start.</div>
            )}
          </div>
        )}

        {/* Fan Hub footer */}
        <div style={{padding:"8px 20px 30px",textAlign:"center"}}>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="sans" style={{fontSize:11,color:"rgba(255,255,255,.4)",textDecoration:"underline"}}>Privacy Policy</a>
          <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.18)",marginTop:6}}>Swaiyu · Sakred Studio</div>
        </div>
      </div>
    );
  };

  // ── GROUP PICKER (modal — reachable from Home "+ Edit" and Fan Hub) ───────────
  const groupCard = (g: {id: string; name: string; emoji: string; color: string; fandom: string}) => {
    const sel = myIdols.includes(g.id);
    return (
      <div key={g.id} className="tap" onClick={() => { toggleIdol(g.id); pushToast(sel ? `Removed ${g.name}` : `Added ${g.name} 💜`); }}
        style={{borderRadius:14,border:`1.5px solid ${sel ? g.color+"66" : "rgba(255,255,255,.08)"}`,background:sel ? `${g.color}14` : "rgba(255,255,255,.03)",padding:"11px 12px",transition:"all .18s",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20,flexShrink:0}}>{g.emoji}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
          <div className="sans" style={{fontSize:9.5,color:"rgba(255,255,255,.35)"}}>{g.fandom}</div>
        </div>
        <div style={{width:18,height:18,borderRadius:6,border:`1.5px solid ${sel ? g.color : "rgba(255,255,255,.2)"}`,background:sel ? g.color : "transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:THEME.bg,flexShrink:0}}>{sel ? "✓" : ""}</div>
      </div>
    );
  };

  const renderPicker = () => {
    if (!showPicker) return null;
    const s = pickerSearch.trim().toLowerCase();
    const customAsCards = customGroups.map(c => ({id:c.id, name:c.name, emoji:c.emoji, color:c.color, fandom:c.fandom}));
    const matches = s
      ? [...FULL_CATALOG, ...customAsCards].filter(g => g.name.toLowerCase().includes(s) || g.fandom.toLowerCase().includes(s))
      : null;
    const popular = FULL_CATALOG.filter(g => g.tier === "featured" || g.tier === "popular");
    const more = FULL_CATALOG.filter(g => g.tier === "more");
    const close = () => { setShowPicker(false); setPickerSearch(""); };
    const grid = (items: {id: string; name: string; emoji: string; color: string; fandom: string}[]) =>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>{items.map(groupCard)}</div>;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(10px)",zIndex:700,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={close}>
        <div className="fade" style={{width:"100%",maxWidth:430,background:"#0c0718",borderRadius:"22px 22px 0 0",border:"1px solid rgba(255,255,255,.08)",padding:"18px 18px 36px",maxHeight:"86vh",display:"flex",flexDirection:"column"}} onClick={e => e.stopPropagation()}>
          <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,.12)",margin:"0 auto 16px",flexShrink:0}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexShrink:0}}>
            <div style={{fontSize:16,fontWeight:700,fontFamily:"'Syne'"}}>Your Groups <span style={{color:anchor}}>({myIdols.length})</span></div>
            <button className="tap" onClick={close} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:20,cursor:"pointer"}}>×</button>
          </div>
          <div style={{borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
            <span style={{fontSize:14,opacity:.5}}>🔍</span>
            <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Search 100+ groups by name or fandom" style={{width:"100%",background:"none",border:"none",color:THEME.text,fontSize:13,outline:"none"}}/>
          </div>

          <div style={{overflowY:"auto",flex:1,minHeight:0}}>
            {matches ? (
              matches.length > 0 ? grid(matches) : (
                <div className="sans" style={{textAlign:"center",padding:"24px 0",fontSize:12,color:"rgba(255,255,255,.3)"}}>No groups found for "{pickerSearch.trim()}" — add it as a custom group below ↓</div>
              )
            ) : (
              <>
                <Lbl style={{marginBottom:9}}>⭐ Popular</Lbl>
                {grid(popular)}
                {customAsCards.length > 0 && <><Lbl style={{marginBottom:9}}>🎤 Your Custom Groups</Lbl>{grid(customAsCards)}</>}
                <Lbl style={{marginBottom:9}}>More Groups</Lbl>
                {grid(more)}
              </>
            )}
          </div>

          <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:14,marginTop:4,flexShrink:0}}>
            <Lbl style={{marginBottom:8}}>Can't find your group? Add it →</Lbl>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"10px 14px"}}>
                <input value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addCustomGroup(); }} maxLength={40} placeholder="e.g. your local group" style={{width:"100%",background:"none",border:"none",color:THEME.text,fontSize:13,outline:"none"}}/>
              </div>
              <button className="tap" onClick={addCustomGroup} disabled={!customInput.trim()} style={{padding:"0 18px",borderRadius:12,border:"none",background:customInput.trim() ? heroGradient : "rgba(255,255,255,.07)",color:customInput.trim() ? "#fff" : "rgba(255,255,255,.25)",fontSize:13,fontWeight:700,cursor:customInput.trim() ? "pointer" : "default",fontFamily:"'Syne'"}}>Add</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── MAIN LAYOUT ────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'DM Sans'",background:THEME.bg,minHeight:"100vh",color:THEME.text,display:"flex",justifyContent:"center"}}>
      <style>{css}</style>

      <div className="toast-wrap">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>

      {renderPicker()}

      <div style={{width:"100%",maxWidth:430,minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative"}}>
        {/* Shared anchor-tinted backdrop behind ALL views (driven by bias-group color) */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:240,background:`radial-gradient(ellipse at 70% -10%,${anchor}18 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
        <div style={{flex:1,overflow:"hidden",position:"relative",zIndex:1}}>
          {tab === "home"   && renderHome()}
          {tab === "events" && renderEvents()}
          {tab === "drops"  && renderDrops()}
          {tab === "style"  && renderStyle()}
          {tab === "fani"   && renderFani()}
          {tab === "fan"    && renderFan()}
        </div>

        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(6,4,14,.97)",backdropFilter:"blur(28px)",borderTop:"1px solid rgba(255,255,255,.07)",padding:`8px 4px calc(16px + env(safe-area-inset-bottom, 8px))`,display:"flex",zIndex:300}}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} className="tap" onClick={() => setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
                <div style={{fontSize:active ? 21 : 17,transition:"all .2s",filter:active ? `drop-shadow(0 0 7px ${anchor})` : "none"}}>{t.icon}</div>
                <div style={{fontSize:8,fontWeight:700,color:active ? anchor : "rgba(255,255,255,.2)",fontFamily:"'Space Mono'",letterSpacing:".04em",transition:"color .2s"}}>{t.label}</div>
                {active && <div style={{width:3,height:3,borderRadius:"50%",background:anchor,boxShadow:`0 0 6px ${anchor}`}}/>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
