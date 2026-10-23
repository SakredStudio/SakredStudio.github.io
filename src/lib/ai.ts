import { GLOSSARY } from "../data/glossary";

// All AI calls go through the token-gated Cloudflare Worker (origin allowlist, per-IP
// rate limit, daily global cap, model allowlist, 1024-token cap). No key ever ships in
// the bundle.
const WORKER_URL = "https://fandrop-ai.mihir86-mp.workers.dev";
const MODEL = "claude-haiku-4-5-20251001";

export interface ChatMessage { role: "user" | "assistant"; content: string; }

// Thrown when the Worker answers 429 {"error":"daily_cap"} — the 2,000-requests-per-UTC-day
// budget is spent (worker/fandrop-ai-daily-cap.patch.md). Screens show FANI_RESTING_MSG.
export class FaniRestingError extends Error {
  constructor() { super("daily_cap"); this.name = "FaniRestingError"; }
}
export const FANI_RESTING_MSG = "FANI is resting, back tomorrow 💜";
export const isFaniResting = (e: unknown): e is FaniRestingError => e instanceof FaniRestingError;

// Returns the first text block of the reply, or "" if the Worker answered with a
// shape we don't recognise. Network / parse failures throw; the daily cap throws
// FaniRestingError so callers can tell it apart from a plain outage.
export async function askWorker(system: string, messages: ChatMessage[], maxTokens = 1000): Promise<string> {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json();
  if (res.status === 429 && data?.error === "daily_cap") throw new FaniRestingError();
  return data?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
}

export const FANI_SYSTEM = (): string =>
  `You are a knowledgeable, enthusiastic K-pop fan assistant named FANI. You know everything about K-pop — groups, members, songs, albums, concerts, photocards, fan culture, Korean idol industry, merchandise, fanchants, and fan communities. You're warm, relatable, and talk like a fellow fan. Keep responses concise (2–4 sentences max unless listing things). Use relevant emoji sparingly. You help fans solve real problems: finding merch, learning fanchants, understanding K-pop culture, planning concerts, budgeting for fan activities, and staying up to date on releases. Current date: ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}. Write plain text, no markdown. Use these exact meanings for fan terms: ${GLOSSARY.map(g => `${g.t} = ${g.d}`).join(" ")} If you are not sure about a fact, say so instead of guessing.`;

export const CHANT_SYSTEM =
  `You are a K-pop fanchant expert. Write a concise, practical fan-chant guide a fan can learn before a concert. Give the actual chant lines (member-name chants, "[clap]"/"[stomp]" cues, key call-and-response phrases) and say WHERE each goes in the song (intro, chorus, rap break, bridge). Keep it under ~150 words, plain text, no markdown headers. If you are unsure of exact official chants, say so briefly.`;
