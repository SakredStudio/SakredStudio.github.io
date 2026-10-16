/* ═══════════════════════════════════════════════════════
   BRAND + THEME TOKENS  (single source of truth)
═══════════════════════════════════════════════════════ */
export const APP_NAME = "Swaiyu";

export const THEME = {
  bg:        "#0E0A1A", // concert-night base (near-black, purple undertone)
  text:      "#F5F0FF", // soft off-white
  textMuted: "#A89CC4", // low-saturation lilac-gray (derived from the violet)
  primary:   "#8B3FFF", // K-pop violet — default anchor
  accent:    "#FF3DAE", // electric pink — used sparingly (Buy emphasis)
  holoMid:   "#FF6EC7", // holographic gradient mid stop
  holoEnd:   "#4DD0FF", // holographic gradient end stop
};

// Type scale (BUILD-PLAN-V2.md Step 2): one family, two working weights, 12px floor.
//   12 caption · 14 body · 16 card title · 22 section · 32+ hero number
export const FONT = "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

export const hexToRgb = (hex: string): string => {
  const parts = hex.replace("#", "").match(/../g);
  if (!parts || parts.length < 3) return "124,58,237";
  return parts.map(x => parseInt(x, 16)).join(",");
};

/* ═══════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════ */
export const G = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html,body{height:100%;overscroll-behavior:none}
  body{font-family:${FONT};font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{display:none}
  a{text-decoration:none;color:inherit}
  input,button,textarea,select{font-family:inherit;font-size:14px}
  .tap{transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .12s;cursor:pointer;user-select:none}
  .tap:active{transform:scale(.96);opacity:.8}
  .fade{animation:fu .38s cubic-bezier(.22,1,.36,1) both}
  @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .s1{animation-delay:.05s}.s2{animation-delay:.10s}.s3{animation-delay:.15s}
  .s4{animation-delay:.20s}.s5{animation-delay:.25s}.s6{animation-delay:.30s}
  .card{border-radius:16px;background:rgba(139,63,255,.06);border:1px solid rgba(180,140,255,.14);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
  .pill{border-radius:50px;padding:10px 16px;min-height:44px;font-size:13px;font-weight:700;border:none;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;transition:all .18s}
  .hrow{display:flex;gap:10px;overflow-x:auto;padding-bottom:2px}
  .spin{animation:sp .9s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
  .glow{box-shadow:0 0 22px rgba(var(--gc),0.38)}
  .h1{font-weight:800;line-height:1.08;letter-spacing:-.02em}
  .mono,.sans{font-family:inherit}
  .lbl{font-size:14px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:8px}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700}
  .toast-wrap{position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px}
  .toast{background:rgba(12,6,28,.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:30px;padding:10px 20px;font-size:13px;font-weight:600;white-space:nowrap;animation:fu .3s cubic-bezier(.22,1,.36,1)}
  .shimmer{background:linear-gradient(90deg,transparent,rgba(255,255,255,.04) 50%,transparent);background-size:200% 100%;animation:sh 2.2s infinite}
  @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .live-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;animation:pulse 1.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
  .gradient-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .progress{height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}
  .progress-fill{height:100%;border-radius:2px;transition:width .6s cubic-bezier(.22,1,.36,1)}
  .check-box{width:26px;height:26px;border-radius:8px;border:1.5px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .2s}
  .fc-card{border-radius:20px;overflow:hidden;position:relative;padding:24px 20px 20px;color:#fff}
`;

// Per-render CSS variables driven by the followed group's anchor color.
export const buildCss = (anchor: string, heroGradient: string): string => `
  ${G}
  :root{
    --bg:${THEME.bg};
    --s1:rgba(139,63,255,.07);
    --b1:rgba(180,140,255,.13);
    --t1:${THEME.text};
    --t2:${THEME.textMuted};
    --t3:rgba(168,156,196,.6);
    --a1:${anchor};
    --a2:${THEME.holoMid};
    --grad:${heroGradient};
    --gc:${hexToRgb(anchor)};
  }
`;

// Shared dark form-control styling for selects / inputs (44px tall).
export const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", minHeight: 44, borderRadius: 12,
  border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)",
  color: "#fff", fontSize: 14, outline: "none",
};
