/**
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [GATE] CI Test Fixtures
 * ───────────────────────────────────────────────────────────────────────────
 * @file     generate-ci-fixtures.ts
 * @purpose  Generate small JPEG set for CI E2E (no gitignored workspace photos)
 * @layer    GATE
 * @depends  sharp
 * @consumers GitHub Actions, npm run fixtures:ci
 * @status   ELITE ✅
 * @see      docs/KANBAN_TRACKER.md § P2-1
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { mkdir, cp, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { WORKSPACE_DIR_NAME } from "../src/core/workspace.shared.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = path.join(ROOT, "test", "fixtures", "ci-photos");
const COUNT = 8;

const COLORS = [
  { r: 220, g: 60, b: 60 },
  { r: 60, g: 180, b: 80 },
  { r: 60, g: 120, b: 220 },
  { r: 240, g: 200, b: 40 },
  { r: 180, g: 60, b: 200 },
  { r: 40, g: 200, b: 200 },
  { r: 240, g: 140, b: 80 },
  { r: 120, g: 120, b: 120 },
];

async function generateFixtures(): Promise<number> {
  await mkdir(FIXTURE_DIR, { recursive: true });
  for (let i = 0; i < COUNT; i++) {
    const c = COLORS[i % COLORS.length];
    const w = 640 + (i % 3) * 80;
    const h = 480 + (i % 2) * 60;
    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${c.r},${c.g},${c.b})"/>
      <text x="50%" y="50%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${i + 1}</text>
    </svg>`;
    const out = path.join(FIXTURE_DIR, `ci_photo_${String(i + 1).padStart(2, "0")}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 85, mozjpeg: true }).toFile(out);
  }
  return COUNT;
}

async function installToWorkspace(): Promise<void> {
  const workspaceDir = path.join(ROOT, WORKSPACE_DIR_NAME);
  await mkdir(workspaceDir, { recursive: true });
  const files = (await readdir(FIXTURE_DIR)).filter((f) => /\.jpe?g$/i.test(f));
  for (const f of files) {
    await cp(path.join(FIXTURE_DIR, f), path.join(workspaceDir, f));
  }
}

async function main() {
  const install = process.argv.includes("--workspace");
  const n = await generateFixtures();
  console.log(`Generated ${n} CI fixture JPEGs → ${FIXTURE_DIR}`);
  if (install) {
    await installToWorkspace();
    console.log(`Installed fixtures → ${path.join(ROOT, WORKSPACE_DIR_NAME)}/`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
