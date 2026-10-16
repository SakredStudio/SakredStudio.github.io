// Sanity-checks src/data/members.ts and src/data/birthdays.ts. Run: npm run check:birthdays
// Fails (exit 1) when:
//   - a member is listed twice in one group
//   - a birthday date is not a valid "MM-DD"
//   - a birthday row references a group or member that is not in MEMBERS
//   - a birthday is listed twice for the same member
//   - MEMBERS is missing a group (featured IDOLS or catalog) or lists an unknown one
//   - a featured group's MEMBERS differ from IDOLS, or a featured member has no birthday
// Prints coverage per tier (popular/more gaps are reported, not failures: unconfirmed dates are omitted on purpose).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const errors = [];
const fail = (msg) => errors.push(msg);

// ── Load a TS data file by stripping `export const X: Type =` into `exports.X =`.
function loadTs(file) {
  const src = read(file)
    .replace(/export\s+(?:interface|type)\s+\w+[^{=]*(?:=\s*[^;]+;|\{[^}]*\})/g, "")
    .replace(/export\s+const\s+(\w+)\s*:[^=]+=/g, "exports.$1 =")
    .replace(/export\s+const\s+(\w+)\s*=/g, "exports.$1 =")
    .replace(/\}\s*as const\s*;/g, "};")
    .replace(/\]\s*as const\s*;/g, "];");
  const exp = {};
  new Function("exports", src)(exp);
  return exp;
}

// ── Group ids the app uses: featured (IDOLS) + catalog (slugify(name) of KPOP_GROUPS).
const slugify = (name) =>
  name.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function loadFeatured() {
  const file = fs.existsSync(path.join(root, "src/data/idols.ts")) ? "src/data/idols.ts" : "src/App.tsx";
  const src = read(file);
  const out = [];
  const re = /\{\s*id:\s*"([^"]+)"[^\n]*?members:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(src))) out.push({ id: m[1], members: JSON.parse("[" + m[2] + "]") });
  return out;
}

function loadCatalog() {
  const src = read("src/kpopGroups.ts");
  const out = [];
  const re = /name:\s*"([^"]+)"[^\n]*?tier:\s*"(popular|more)"/g;
  let m;
  while ((m = re.exec(src))) out.push({ id: slugify(m[1]), tier: m[2] });
  return out;
}

const featured = loadFeatured();
const catalog = loadCatalog();
if (featured.length !== 8) fail(`expected 8 featured groups in IDOLS, found ${featured.length}`);
if (catalog.length === 0) fail("no catalog groups found in src/kpopGroups.ts");

const tierOf = new Map();
featured.forEach((g) => tierOf.set(g.id, "featured"));
catalog.forEach((g) => tierOf.set(g.id, g.tier));

const { MEMBERS } = loadTs("src/data/members.ts");
const { BIRTHDAYS } = loadTs("src/data/birthdays.ts");
if (!MEMBERS || typeof MEMBERS !== "object") fail("src/data/members.ts must export MEMBERS");
if (!Array.isArray(BIRTHDAYS)) fail("src/data/birthdays.ts must export BIRTHDAYS");
if (errors.length) done();

const key = (s) => s.trim().toLowerCase();

// ── MEMBERS: coverage of group ids, duplicates, featured match.
for (const id of tierOf.keys()) if (!MEMBERS[id]) fail(`MEMBERS is missing group "${id}"`);
for (const id of Object.keys(MEMBERS)) {
  if (!tierOf.has(id)) fail(`MEMBERS has unknown group "${id}"`);
  const list = MEMBERS[id];
  if (!Array.isArray(list) || list.length === 0) { fail(`MEMBERS["${id}"] must be a non-empty array`); continue; }
  const seen = new Set();
  for (const name of list) {
    if (typeof name !== "string" || !name.trim()) { fail(`MEMBERS["${id}"] has an empty name`); continue; }
    if (seen.has(key(name))) fail(`MEMBERS["${id}"] lists "${name}" twice`);
    seen.add(key(name));
  }
}
for (const g of featured) {
  const have = (MEMBERS[g.id] || []).map(key).sort().join("|");
  const want = g.members.map(key).sort().join("|");
  if (have !== want) fail(`MEMBERS["${g.id}"] does not match its IDOLS member list`);
}

// ── BIRTHDAYS: valid dates, known group/member, no duplicate rows.
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const validDate = (s) => {
  const m = /^(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const mo = +m[1], d = +m[2];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= DAYS[mo - 1];
};
const have = new Set();
BIRTHDAYS.forEach((b, i) => {
  const where = `BIRTHDAYS[${i}] (${b && b.groupId}/${b && b.member})`;
  if (!b || typeof b.groupId !== "string" || typeof b.member !== "string" || typeof b.date !== "string") {
    fail(`${where} must have string groupId, member, date`);
    return;
  }
  if (!validDate(b.date)) fail(`${where} has invalid date "${b.date}" (want MM-DD)`);
  const list = MEMBERS[b.groupId];
  if (!list) { fail(`${where} references unknown group`); return; }
  if (!list.some((n) => key(n) === key(b.member))) fail(`${where} references a member not in MEMBERS["${b.groupId}"]`);
  const k = b.groupId + "|" + key(b.member);
  if (have.has(k)) fail(`${where} is a duplicate birthday row`);
  have.add(k);
});

// ── Featured groups must be complete.
for (const g of featured) {
  for (const name of MEMBERS[g.id] || []) {
    if (!have.has(g.id + "|" + key(name))) fail(`featured group "${g.id}" is missing a birthday for "${name}"`);
  }
}

// ── Coverage report.
const stats = {};
for (const [id, tier] of tierOf) {
  const s = (stats[tier] = stats[tier] || { groups: 0, complete: 0, members: 0, dated: 0 });
  const list = MEMBERS[id] || [];
  const dated = list.filter((n) => have.has(id + "|" + key(n))).length;
  s.groups++;
  s.members += list.length;
  s.dated += dated;
  if (dated === list.length) s.complete++;
}
for (const tier of ["featured", "popular", "more"]) {
  const s = stats[tier];
  if (s) console.log(`${tier.padEnd(9)} ${s.complete}/${s.groups} groups complete, ${s.dated}/${s.members} birthdays`);
}

function done() {
  if (errors.length) {
    console.error(`\ncheck-birthdays: ${errors.length} problem(s)`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log("check-birthdays: OK");
}
done();
