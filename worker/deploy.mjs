// One-shot deploy of both Cloudflare Workers. Works in PowerShell, cmd, bash, zsh.
//   npm run deploy:workers          (after `npx wrangler login` once)
// Steps: D1 schema → deploy swaiyu-beacon → SUMMARY_KEY secret → deploy fandrop-ai.
// The SUMMARY_KEY is generated for you, piped to wrangler, printed once and saved to
// worker/beacon/.summary-key (git-ignored). Re-running is safe: the schema is
// CREATE IF NOT EXISTS; set SKIP_SECRET=1 to keep the existing key.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const beacon = join(here, "beacon");
const fani = join(here, "fandrop-ai");

function wrangler(step, cwd, args, input) {
  console.log(`\n── ${step}\n   npx wrangler ${args.join(" ")}`);
  // One command string (not an args array) with shell:true: works on Windows, no DEP0190 warning.
  const r = spawnSync(`npx --yes wrangler ${args.join(" ")}`, {
    cwd, shell: true, input,
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
  });
  if (r.status !== 0) {
    console.error(`\n✗ "${step}" failed (exit ${r.status}). Fix the error above and re-run: npm run deploy:workers`);
    process.exit(r.status || 1);
  }
}

wrangler("1/4  D1 schema (events + counters) on database swaiyu", beacon,
  ["d1", "execute", "swaiyu", "--file", "schema.sql", "--remote", "--yes"]);

wrangler("2/4  deploy swaiyu-beacon", beacon, ["deploy"]);

const keyFile = join(beacon, ".summary-key");
if (process.env.SKIP_SECRET) {
  console.log("\n── 3/4  SUMMARY_KEY skipped (SKIP_SECRET set)");
} else {
  const key = randomBytes(24).toString("base64url");
  wrangler("3/4  SUMMARY_KEY secret on swaiyu-beacon", beacon, ["secret", "put", "SUMMARY_KEY"], key + "\n");
  writeFileSync(keyFile, key + "\n");
  console.log(`   SUMMARY_KEY = ${key}\n   (also saved to worker/beacon/.summary-key, which git ignores)`);
}

wrangler("4/4  deploy fandrop-ai with the daily cap (ANTHROPIC_API_KEY secret is kept)", fani, ["deploy"]);

const key = existsSync(keyFile) ? "<see worker/beacon/.summary-key>" : "<SUMMARY_KEY>";
console.log(`
✓ Both Workers deployed. Check them in a browser:
  https://swaiyu-beacon.mihir86-mp.workers.dev/summary?key=${key}   → JSON with "totals"
  Open sakredstudio.github.io once, reload the summary: "open" should appear (after v2 is merged).`);
