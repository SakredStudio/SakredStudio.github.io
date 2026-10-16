export interface Drop {
  artist: string;
  title: string;
  type: string;
  date: string;          // ISO yyyy-mm-dd
  idol: string | null;   // FULL_CATALOG id where the group exists, else null
  ytUrl: string | null;  // live YouTube search built from artist + title
}

const yt = (q: string): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

// Real upcoming comebacks. Refreshed by hand roughly monthly (see ROADMAP.md);
// entries auto-hide 14 days after their date via lib/drops.ts. Only map `idol`
// to a group that exists in IDOLS or KPOP_GROUPS (slugify(name)); else null.
// Last verified 2026-10-15.
export const DROPS: Drop[] = [
  {artist:"NCT WISH",title:"I SPY",type:"Mini Album",date:"2026-10-12",idol:"nct-wish",ytUrl:yt("NCT WISH I SPY")},
  {artist:"Xdinary Heroes",title:"IMPULSE",type:"Mini Album",date:"2026-10-12",idol:"xdinary-heroes",ytUrl:yt("Xdinary Heroes IMPULSE")},
  {artist:"PLAVE",title:"HYPERDRIVE",type:"Mini Album",date:"2026-10-12",idol:null,ytUrl:yt("PLAVE HYPERDRIVE")},
  {artist:"IVE",title:"Looks Can Kill (pre-release)",type:"Pre-release Single",date:"2026-10-19",idol:"ive",ytUrl:yt("IVE Looks Can Kill")},
  {artist:"NMIXX",title:"Strange Muse",type:"Mini Album",date:"2026-10-19",idol:"nmixx",ytUrl:yt("NMIXX Strange Muse Birthday Wish")},
  {artist:"LISA",title:"PRESS PLAY",type:"EP",date:"2026-10-23",idol:"bp",ytUrl:yt("LISA PRESS PLAY")},
  {artist:"IVE",title:"Looks Can Kill",type:"Mini Album",date:"2026-10-26",idol:"ive",ytUrl:yt("IVE Looks Can Kill")},
  {artist:"ILLIT",title:"BREAK EVEN",type:"Mini Album",date:"2026-10-26",idol:"illit",ytUrl:yt("ILLIT BREAK EVEN I Will Arrest You")},
  {artist:"RIIZE",title:"Prologue Single (title TBA)",type:"Digital Single",date:"2026-10-26",idol:"riize",ytUrl:yt("RIIZE new single 2026")},
  {artist:"xikers",title:"ROUTE ZERO : The CALLING",type:"Mini Album",date:"2026-11-02",idol:"xikers",ytUrl:yt("xikers ROUTE ZERO The CALLING")},
  {artist:"ATEEZ",title:"GOLDEN HOUR: Part.6",type:"Mini Album",date:"2026-11-13",idol:"ateez",ytUrl:yt("ATEEZ GOLDEN HOUR Part.6")},
  {artist:"TOMORROW X TOGETHER",title:"PERFECT STORM",type:"Mini Album",date:"2026-11-16",idol:"tomorrow-x-together",ytUrl:yt("TXT PERFECT STORM")},
];
