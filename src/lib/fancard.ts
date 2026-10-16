import type { Idol } from "../data/idols";
import { APP_NAME } from "../theme";

/* ═══════════════════════════════════════════════════════
   FAN CARD → PNG  (Step 4 of BUILD-PLAN-V2.md)
   Renders the card to an offscreen canvas at story (1080×1920) or square (1080×1080)
   size and hands back a PNG blob. Every text run is ≥ 28px at 1080 wide so it stays
   legible once Instagram/TikTok downscale it. No network, no library.
═══════════════════════════════════════════════════════ */

export interface FanCardData {
  name: string;
  bias: Idol | undefined;
  groups: Idol[];        // followed groups → fandom chips
  since: string;
  photo: string | null;  // data URL
  anchor: string;        // hex color
}
export type CardFormat = "story" | "square";
export type ShareOutcome = "shared" | "downloaded" | "cancelled";

const SITE = "sakredstudio.github.io";
const FONT = "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = src;
  });

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Shrinks the font size until `text` fits `maxW`, never below `minPx`.
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, startPx: number, minPx: number, maxW: number): number {
  let px = startPx;
  for (; px > minPx; px -= 4) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    if (ctx.measureText(text).width <= maxW) break;
  }
  ctx.font = `${weight} ${px}px ${FONT}`;
  return px;
}

function hexAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "").match(/../g);
  if (!m || m.length < 3) return `rgba(124,58,237,${alpha})`;
  const [r, g, b] = m.map(x => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function renderFanCard(d: FanCardData, format: CardFormat): Promise<Blob> {
  const W = 1080, H = format === "story" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  try { await document.fonts.load(`800 90px ${FONT}`); await document.fonts.ready; } catch { /* fallback font */ }

  // ── Background: anchor color → concert-night purple, with two soft glows ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, d.anchor);
  bg.addColorStop(0.55, "#1a0a2e");
  bg.addColorStop(1, "#0c0020");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.beginPath(); ctx.arc(W * 0.88, H * 0.1, 280, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hexAlpha(d.anchor, 0.35); ctx.beginPath(); ctx.arc(W * 0.12, H * 0.92, 340, 0, Math.PI * 2); ctx.fill();

  // ── Panel ──
  const pad = 80;
  const panelX = pad, panelW = W - pad * 2;
  const panelH = format === "story" ? 900 : 860;
  const panelY = format === "story" ? Math.round((H - panelH) / 2) + 40 : Math.round((H - panelH) / 2);
  ctx.fillStyle = "rgba(255,255,255,.09)";
  roundRect(ctx, panelX, panelY, panelW, panelH, 56); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 3; ctx.stroke();

  // Story format gets the wordmark above the panel.
  if (format === "story") {
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = `800 104px ${FONT}`; ctx.fillText(APP_NAME, W / 2, panelY - 120);
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = `500 34px ${FONT}`;
    ctx.fillText("my K-pop fan card", W / 2, panelY - 60);
    ctx.textAlign = "left";
  }

  // ── Photo (or bias emoji) top-right of the panel ──
  const x = panelX + 64;
  const photoSize = 240;
  const photoX = panelX + panelW - 64 - photoSize, photoY = panelY + 64;
  ctx.save();
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 48); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(photoX, photoY, photoSize, photoSize);
  if (d.photo) {
    try {
      const img = await loadImage(d.photo);
      const s = Math.max(photoSize / img.width, photoSize / img.height);
      const dw = img.width * s, dh = img.height * s;
      ctx.drawImage(img, photoX + (photoSize - dw) / 2, photoY + (photoSize - dh) / 2, dw, dh);
    } catch { /* keep the placeholder tile */ }
  } else {
    ctx.font = `120px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff"; ctx.fillText(d.bias?.emoji ?? "💜", photoX + photoSize / 2, photoY + photoSize / 2 + 8);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; roundRect(ctx, photoX, photoY, photoSize, photoSize, 48); ctx.stroke();

  // ── Name block ──
  const textMaxW = photoX - x - 40;
  let y = panelY + 64 + 36;
  ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = `700 30px ${FONT}`;
  ctx.fillText(`${APP_NAME} · fan card`, x, y);
  y += 112;
  ctx.fillStyle = "#fff";
  const name = d.name.trim() || "K-pop fan";
  fitFont(ctx, name, 800, 92, 48, textMaxW);
  ctx.fillText(name, x, y);

  // ── Fandom chips (wrap) ──
  y += 90;
  ctx.font = `700 32px ${FONT}`;
  let cx = x;
  const chipH = 64, chipPadX = 26, gap = 16, maxX = panelX + panelW - 64;
  const chips = d.groups.length ? d.groups.map(g => `${g.emoji} ${g.fandom}`) : ["💜 new fan"];
  for (const label of chips) {
    const w = ctx.measureText(label).width + chipPadX * 2;
    if (cx + w > maxX) { cx = x; y += chipH + gap; }
    if (y + chipH > panelY + panelH - 230) break;
    ctx.fillStyle = "rgba(255,255,255,.14)"; roundRect(ctx, cx, y, w, chipH, 32); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.fillText(label, cx + chipPadX, y + chipH / 2 + 2); ctx.textBaseline = "alphabetic";
    cx += w + gap;
  }

  // ── Bias + since, pinned to the bottom of the panel ──
  const by = panelY + panelH - 150;
  ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = `600 28px ${FONT}`;
  ctx.fillText("ULTIMATE BIAS", x, by);
  ctx.fillText("STAN SINCE", x + 520, by);
  ctx.fillStyle = "#fff"; ctx.font = `800 44px ${FONT}`;
  ctx.fillText(d.bias ? `${d.bias.emoji} ${d.bias.name}` : "—", x, by + 62);
  ctx.fillText(d.since, x + 520, by + 62);

  // ── Watermark ──
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = `600 30px ${FONT}`;
  ctx.fillText(`${APP_NAME.toLowerCase()} · ${SITE}`, W / 2, H - 70);
  if (format === "story") {
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = `500 28px ${FONT}`;
    ctx.fillText("make yours free on Android", W / 2, H - 120);
  }
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

// Share sheet with the PNG attached where the browser allows files; otherwise download.
export async function shareFanCard(blob: Blob, format: CardFormat): Promise<ShareOutcome> {
  const file = new File([blob], `swaiyu-fan-card-${format}.png`, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `My ${APP_NAME} Fan Card`, text: `My K-pop fan card 💜 ${APP_NAME} · https://${SITE}` });
      return "shared";
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "cancelled";
      // fall through to download on any other failure
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}

// Reads a picked file and returns a 640×640 cover-cropped JPEG data URL (≈60–120 KB),
// small enough to persist in localStorage alongside the other card fields.
export async function downscalePhoto(file: File, size = 640): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
  const img = await loadImage(dataUrl);
  const c = document.createElement("canvas"); c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return dataUrl;
  const s = Math.max(size / img.width, size / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return c.toDataURL("image/jpeg", 0.85);
}
