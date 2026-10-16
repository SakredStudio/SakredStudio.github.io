export const getDays = (d: string): number =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

// Live release status, derived from the date every call — NO stored countdown strings.
// future → "In N days" ("Tomorrow"/"Today 🎉" at 1/0); past ≤14d → "New"/"Released N
// days ago"; past >14d → hidden:true so the feed auto-expires stale releases.
export interface DropStatus { label: string; upcoming: boolean; hidden: boolean; days: number; }

export const dropStatus = (date: string): DropStatus => {
  const days = getDays(date);
  if (days > 1)  return { label: `In ${days} days`, upcoming: true, hidden: false, days };
  if (days === 1) return { label: "Tomorrow", upcoming: true, hidden: false, days };
  if (days === 0) return { label: "Today 🎉", upcoming: true, hidden: false, days };
  const ago = Math.abs(days);
  if (ago <= 14) return { label: ago <= 2 ? "New" : `Released ${ago} days ago`, upcoming: false, hidden: false, days };
  return { label: "", upcoming: false, hidden: true, days };
};

// Filter a date-carrying list to non-expired entries, sorted upcoming-soonest-first then
// most-recent past. Generic so both DROPS and the Home subset reuse it.
export function liveDrops<T extends { date: string }>(list: T[]): { item: T; status: DropStatus }[] {
  return list
    .map(item => ({ item, status: dropStatus(item.date) }))
    .filter(x => !x.status.hidden)
    .sort((a, b) => {
      if (a.status.upcoming !== b.status.upcoming) return a.status.upcoming ? -1 : 1;
      return a.status.upcoming ? a.status.days - b.status.days : b.status.days - a.status.days;
    });
}
