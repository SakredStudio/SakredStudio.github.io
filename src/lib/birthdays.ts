import { BIRTHDAYS, type Birthday } from "../data/birthdays";
import type { Idol } from "../data/idols";
import { getIdol } from "./groups";

// Birthday lookups over the static dataset (Step 5 of BUILD-PLAN-V2.md). Everything is
// computed from the device clock at render time, so Home has something new every day
// with no server. `now` is injectable for tests.
export interface UpcomingBirthday extends Birthday { idol: Idol | undefined; daysUntil: number; }

const two = (n: number) => String(n).padStart(2, "0");
export const todayKey = (now = new Date()): string => `${two(now.getMonth() + 1)}-${two(now.getDate())}`;

// Whole days from local midnight today to the next occurrence of an MM-DD. 0 = today.
// Feb 29 rolls to Mar 1 in non-leap years through Date overflow, which is what fans expect.
export function daysUntil(date: string, now = new Date()): number {
  const [m, d] = date.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next.getTime() < today.getTime()) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

const withIdol = (b: Birthday, now: Date): UpcomingBirthday =>
  ({ ...b, idol: getIdol(b.groupId), daysUntil: daysUntil(b.date, now) });

// Everyone with a birthday today, across the whole catalog, followed groups first.
export function todaysBirthdays(followed: string[], now = new Date()): UpcomingBirthday[] {
  const key = todayKey(now);
  const mine = new Set(followed);
  return BIRTHDAYS.filter(b => b.date === key)
    .map(b => withIdol(b, now))
    .sort((a, b) => Number(mine.has(b.groupId)) - Number(mine.has(a.groupId)));
}

// The next `limit` birthdays among the followed groups (today excluded).
export function upcomingBirthdays(followed: string[], limit: number, now = new Date()): UpcomingBirthday[] {
  const mine = new Set(followed);
  return BIRTHDAYS.filter(b => mine.has(b.groupId))
    .map(b => withIdol(b, now))
    .filter(b => b.daysUntil > 0)
    .sort((a, b) => a.daysUntil - b.daysUntil || a.member.localeCompare(b.member))
    .slice(0, limit);
}

// The soonest birthday in one group (today counts), or null for groups without data.
export function nextBirthdayFor(groupId: string, now = new Date()): UpcomingBirthday | null {
  const rows = BIRTHDAYS.filter(b => b.groupId === groupId).map(b => withIdol(b, now));
  rows.sort((a, b) => a.daysUntil - b.daysUntil);
  return rows[0] ?? null;
}

// "MM-DD" → "Oct 25"
export const formatMonthDay = (date: string): string => {
  const [m, d] = date.split("-").map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
