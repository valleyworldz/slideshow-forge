/**
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [GATE] Changelog Sync
 * ───────────────────────────────────────────────────────────────────────────
 * @file     changelog-check.ts
 * @purpose  Verify CHANGELOG.md version matches package.json / constants.ts
 * @layer    GATE
 * @depends  constants
 * @consumers npm run changelog:check, release checklist
 * @status   ELITE ✅
 * @see      CHANGELOG.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_VERSION } from "../src/core/constants.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8")) as { version: string };
  const changelog = await readFile(path.join(ROOT, "CHANGELOG.md"), "utf8");

  if (pkg.version !== APP_VERSION) {
    console.error(`✗ package.json (${pkg.version}) !== constants.ts (${APP_VERSION})`);
    process.exit(1);
  }

  const header = `## [${APP_VERSION}]`;
  if (!changelog.includes(header)) {
    console.error(`✗ CHANGELOG.md missing section: ${header}`);
    process.exit(1);
  }

  console.log(`✓ CHANGELOG.md documents v${APP_VERSION}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
