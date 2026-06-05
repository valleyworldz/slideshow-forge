/**
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [GATE] TV Export Probe CLI
 * ───────────────────────────────────────────────────────────────────────────
 * @file     tv-probe.ts
 * @purpose  Validate export album against Samsung JPEG + MP4 contract
 * @layer    GATE
 * @depends  tv-probe.node
 * @consumers npm run tv:probe
 * @see      docs/TV_VALIDATION.md
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   npm run tv:probe -- output/Samsung_Slideshows/Elite_Slideshow
 *   npm run tv:probe -- e2e-output/03-both-subset/Samsung_Slideshows/Elite_Subset_Both --json
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { probeSamsungAlbum } from "../src/core/tv-probe.node.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--json");
  const json = process.argv.includes("--json");

  if (args.length === 0) {
    console.error("Usage: npm run tv:probe -- <album-dir> [--json]");
    console.error("Example: npm run tv:probe -- output/Samsung_Slideshows/Elite_Slideshow");
    process.exit(1);
  }

  const albumDir = path.resolve(ROOT, args[0]);
  const report = await probeSamsungAlbum(albumDir);

  if (json) {
    console.log(JSON.stringify({ ok: report.ok, command: "tv-probe", data: report }, null, 2));
  } else {
    console.log(`\n=== TV Probe: ${albumDir} ===\n`);
    for (const c of report.checks) {
      console.log(`  ${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
    console.log(`\n=== ${report.ok ? "PASS" : "FAIL"} (${report.checks.filter((c) => c.ok).length}/${report.checks.length}) ===\n`);
  }

  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
