// Sanity-checks public/drops.json. Run: npm run check:drops
// Fails (exit 1) when:
//   - the file is not {"updated":"yyyy-mm-dd","drops":[...]}
//   - a row is missing artist / title / type / date / source, or has an unknown key
//   - `source` is not an https URL with a real hostname (the announcement link is REQUIRED)
//   - `date` is not a real yyyy-mm-dd calendar date
//   - `idol` is not null and not a group id the app knows (featured IDOLS or catalog slug)
//   - two rows share the same artist + title + date (case-insensitive)
// Mirrors the runtime validator in src/data/drops.ts but is stricter: the app silently
// drops a bad row, this script stops the commit.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const errors = [];
const fail = (msg) => errors.push(msg);

// ── Group ids the app uses: featured (IDOLS) + catalog (slugify(name) of KPOP_GROUPS).
const slugify = (name) =>
  name.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function knownIds() {
  const ids = new Set();
  const idols = read("src/data/idols.ts");
  for (const m of idols.matchAll(/\{\s*id:\s*"([^"]+)"/g)) ids.add(m[1]);
  const catalog = read("src/kpopGroups.ts");
  for (const m of catalog.matchAll(/name:\s*"([^"]+)"[^\n]*?tier:\s*"(?:popular|more)"/g)) ids.add(slugify(m[1]));
  return ids;
}

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const validDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const max = mo === 2 && !leap ? 28 : DAYS[mo - 1];
  return d <= max;
};

const validSource = (s) => {
  if (typeof s !== "string") return false;
  let u;
  try { u = new URL(s); } catch { return false; }
  return u.protocol === "https:" && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname);
};

const REQUIRED = ["artist", "title", "type", "date", "idol", "source"];
const ALLOWED = new Set([...REQUIRED, "yt"]);
const key = (s) => String(s).trim().toLowerCase();

let payload;
try { payload = JSON.parse(read("public/drops.json")); }
catch (e) { fail(`public/drops.json is not valid JSON: ${e.message}`); done(); }

if (!payload || typeof payload !== "object" || Array.isArray(payload)) fail("top level must be an object");
else {
  if (!validDate(payload.updated)) fail(`"updated" must be yyyy-mm-dd, got ${JSON.stringify(payload.updated)}`);
  if (!Array.isArray(payload.drops)) fail('"drops" must be an array');
}
if (errors.length) done();

const ids = knownIds();
if (ids.size === 0) fail("could not read any group ids from src/data/idols.ts / src/kpopGroups.ts");
const seen = new Map();

payload.drops.forEach((row, i) => {
  const where = `drops[${i}]${row && row.artist ? ` (${row.artist} — ${row.title})` : ""}`;
  if (!row || typeof row !== "object" || Array.isArray(row)) { fail(`${where} must be an object`); return; }
  for (const k of REQUIRED) if (!(k in row)) fail(`${where} is missing "${k}"`);
  for (const k of Object.keys(row)) if (!ALLOWED.has(k)) fail(`${where} has unknown key "${k}"`);
  for (const k of ["artist", "title", "type"]) {
    if (typeof row[k] !== "string" || !row[k].trim()) fail(`${where} "${k}" must be a non-empty string`);
  }
  if (typeof row.date !== "string" || !validDate(row.date)) fail(`${where} has invalid date ${JSON.stringify(row.date)} (want yyyy-mm-dd)`);
  if (!validSource(row.source)) fail(`${where} needs an https announcement URL in "source", got ${JSON.stringify(row.source)}`);
  if (row.idol !== null) {
    if (typeof row.idol !== "string" || !row.idol.trim()) fail(`${where} "idol" must be a group id or null`);
    else if (!ids.has(row.idol)) fail(`${where} references unknown group id "${row.idol}"`);
  }
  if ("yt" in row && typeof row.yt !== "string") fail(`${where} "yt" must be a string when present`);
  if (typeof row.artist === "string" && typeof row.title === "string" && typeof row.date === "string") {
    const k = `${key(row.artist)}|${key(row.title)}|${row.date}`;
    if (seen.has(k)) fail(`${where} duplicates drops[${seen.get(k)}]`);
    else seen.set(k, i);
  }
});

function done() {
  if (errors.length) {
    console.error(`\ncheck-drops: ${errors.length} problem(s)`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  const n = payload.drops.length;
  const last = payload.drops.map((d) => d.date).sort().pop();
  console.log(`check-drops: OK — ${n} rows, updated ${payload.updated}, last release ${last}`);
}
done();
