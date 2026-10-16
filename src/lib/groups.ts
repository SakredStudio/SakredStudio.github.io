import { KPOP_GROUPS, type CatalogGroup, type GroupTier } from "../kpopGroups";
import { IDOLS, type Idol } from "../data/idols";
import { THEME } from "../theme";

/* ── GROUP RESOLVER ───────────────────────────────────────────────────────────
   One lookup across featured (IDOLS) → catalog (KPOP_GROUPS) → custom (user-added).
   Catalog/custom groups are normalised into the Idol shape (era/members/lightColor
   are never rendered, so empty defaults are safe), so every consumer goes through
   the same getIdol() call site. */
export const toIdol = (g: CatalogGroup): Idol => ({
  id: g.id, name: g.name, emoji: g.emoji, color: g.color,
  era: "", fandom: g.fandom, members: [], lightColor: g.color,
});

// Featured tier mirrored from IDOLS so the picker can show all tiers in one list.
export const FEATURED_CATALOG: CatalogGroup[] = IDOLS.map(i => ({
  id: i.id, name: i.name, fandom: i.fandom, emoji: i.emoji, color: i.color, tier: "featured" as GroupTier,
}));
// Full browsable catalog (featured first, then popular, then more).
export const FULL_CATALOG: CatalogGroup[] = [...FEATURED_CATALOG, ...KPOP_GROUPS];

export const CATALOG_BY_ID = new Map<string, Idol>();
IDOLS.forEach(i => CATALOG_BY_ID.set(i.id, i));
KPOP_GROUPS.forEach(g => CATALOG_BY_ID.set(g.id, toIdol(g)));

// Registry for user-added custom groups, kept in sync with fandrop_customGroups so
// getIdol() can resolve them even when called during render.
export const customRegistry = new Map<string, Idol>();
export const registerCustom = (g: Idol) => customRegistry.set(g.id, g);

export const getIdol = (id: string): Idol | undefined =>
  CATALOG_BY_ID.get(id) ?? customRegistry.get(id);

export const loadCustomGroups = (): Idol[] => {
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
