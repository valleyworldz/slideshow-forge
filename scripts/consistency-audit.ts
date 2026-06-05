/**
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [GATE] Consistency Audit
 * ───────────────────────────────────────────────────────────────────────────
 * @file     consistency-audit.ts
 * @purpose  Verify version sync, required docs, and metadata conventions
 * @layer    GATE
 * @depends  fs, path, constants
 * @consumers npm run audit:consistency, release checklist
 * @status   ELITE ✅
 * @see      docs/ELITE_CONSISTENCY_AUDIT.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_VERSION } from "../src/core/constants.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

async function check(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    checks.push({ name, ok: false, detail });
    console.error(`  ✗ ${name} — ${detail}`);
  }
}

async function readText(rel: string): Promise<string> {
  return readFile(path.join(ROOT, rel), "utf8");
}

async function mustExist(rel: string): Promise<void> {
  await access(path.join(ROOT, rel));
}

const REQUIRED_DOCS = [
  "README.md",
  "E2E_MAP.md",
  "FLOW_MAP.md",
  "docs/SOURCE_OF_TRUTH.md",
  "docs/ELITE_DEV_HANDOFF.md",
  "docs/ARCHITECTURE_QUALITY_GUIDE.md",
  "docs/SCORECARD.md",
  "docs/KANBAN_TRACKER.md",
  "docs/PIPELINE.md",
  "docs/DIRECTORY_TREE.md",
  "docs/METADATA_CONVENTIONS.md",
  "docs/ELITE_CONSISTENCY_AUDIT.md",
  "CHANGELOG.md",
  "AGENTS.md",
  "ELITE_APPROVED.md",
];

async function main() {
  console.log("\n=== Slideshow Forge Consistency Audit ===\n");

  await check("package.json version", async () => {
    const pkg = JSON.parse(await readText("package.json")) as { version: string };
    if (pkg.version !== APP_VERSION) {
      throw new Error(`package.json=${pkg.version} vs constants=${APP_VERSION}`);
    }
  });

  await check("metadata.json version", async () => {
    const meta = JSON.parse(await readText("metadata.json")) as { version: string };
    if (meta.version !== APP_VERSION) {
      throw new Error(`metadata.json=${meta.version} vs constants=${APP_VERSION}`);
    }
  });

  await check("required documentation files", async () => {
    for (const f of REQUIRED_DOCS) await mustExist(f);
  });

  await check("README links doc hub", async () => {
    const readme = await readText("README.md");
    if (!readme.includes("E2E_MAP.md") || !readme.includes("docs/SOURCE_OF_TRUTH.md")) {
      throw new Error("README missing links to E2E_MAP or SOURCE_OF_TRUTH");
    }
  });

  await check("exporter.node.ts metadata block", async () => {
    const src = await readText("src/core/exporter.node.ts");
    if (!src.includes("@meta SLIDESHOW FORGE")) {
      throw new Error("Missing elite @meta block on exporter.node.ts");
    }
  });

  await check("no committed .env secrets file", async () => {
    try {
      await access(path.join(ROOT, ".env"));
      throw new Error(".env exists — must not be committed (use .env.example only)");
    } catch (e) {
      if (e instanceof Error && e.message.includes(".env exists")) throw e;
      // .env missing = good
    }
  });

  await check("CHANGELOG version section", async () => {
    const cl = await readText("CHANGELOG.md");
    if (!cl.includes(`## [${APP_VERSION}]`)) {
      throw new Error(`CHANGELOG.md missing ## [${APP_VERSION}]`);
    }
  });

  await check("SOURCE_OF_TRUTH references KANBAN", async () => {
    const sot = await readText("docs/SOURCE_OF_TRUTH.md");
    if (!sot.includes("KANBAN_TRACKER")) {
      throw new Error("SOURCE_OF_TRUTH should reference KANBAN_TRACKER.md");
    }
  });

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n=== ${checks.length - failed.length}/${checks.length} passed ===\n`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
