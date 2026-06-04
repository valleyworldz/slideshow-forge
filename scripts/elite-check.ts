/**
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [GATE] Elite Approval
 * ───────────────────────────────────────────────────────────────────────────
 * @file     elite-check.ts
 * @purpose  7-gate release approval: doctor, builds, workspace, e2e
 * @layer    GATE
 * @depends  doctor.node, workspace, npm scripts
 * @consumers npm run elite:approve
 * @status   ELITE ✅
 * @see      ELITE_APPROVED.md
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Elite approval gate — run before release or after major changes.
 * npm run elite:approve
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runDoctor } from "../src/core/doctor.node.ts";
import { workspaceExists, getWorkspacePhotosDir } from "../src/core/workspace.ts";
import { WORKSPACE_DIR_NAME, WORKSPACE_ALBUM_NAME } from "../src/core/workspace.shared.ts";
import { APP_VERSION } from "../src/core/constants.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

function run(cmd: string, args: string[], env?: NodeJS.ProcessEnv): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: ROOT, shell: true, windowsHide: true, env: { ...process.env, ...env } });
    let out = "";
    proc.stdout?.on("data", (d) => (out += d.toString()));
    proc.stderr?.on("data", (d) => (out += d.toString()));
    proc.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

async function check(name: string, fn: () => Promise<string | void>): Promise<void> {
  try {
    const detail = await fn();
    checks.push({ name, ok: true, detail: detail ?? undefined });
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({ name, ok: false, detail: msg });
    console.error(`  ✗ ${name} — ${msg}`);
  }
}

async function main() {
  console.log(`\n=== Slideshow Forge Elite Approval v${APP_VERSION} ===\n`);

  await check("workspace folder exists", async () => {
    const ok = await workspaceExists(ROOT);
    if (!ok) throw new Error(`Missing "${WORKSPACE_DIR_NAME}" at project root`);
    return getWorkspacePhotosDir(ROOT);
  });

  await check("environment (doctor)", async () => {
    const d = await runDoctor();
    if (!d.ok) throw new Error(d.messages.join("; "));
    return `ffmpeg=${d.ffmpeg.installed}, sharp=${d.sharp.ok}`;
  });

  await check("electron bundle", async () => {
    const r = await run("npm", ["run", "build:electron"]);
    if (r.code !== 0) throw new Error(r.out.slice(-500));
    await access(path.join(ROOT, "dist-electron", "main.cjs"));
    await access(path.join(ROOT, "dist-electron", "preload.cjs"));
    return "main.cjs + preload.cjs";
  });

  await check("web production build", async () => {
    const r = await run("npm", ["run", "build"]);
    if (r.code !== 0) throw new Error(r.out.slice(-500));
    await access(path.join(ROOT, "dist", "index.html"));
    return "dist/";
  });

  await check("cli bundle", async () => {
    await access(path.join(ROOT, "dist", "cli.mjs"));
    return "dist/cli.mjs";
  });

  await check("workspace scan", async () => {
    const r = await run("npm", ["run", "workspace:scan"]);
    if (r.code !== 0) throw new Error(r.out.slice(-300));
    const proj = path.join(getWorkspacePhotosDir(ROOT), "workspace.project.json");
    const raw = JSON.parse(await readFile(proj, "utf-8")) as { photos: unknown[] };
    return `${raw.photos.length} items in project`;
  });

  await check("production e2e (all aspects)", async () => {
    const e2eEnv = process.env.E2E_FULL
      ? { E2E_FULL: "1", E2E_SUBSET: process.env.E2E_SUBSET ?? "8" }
      : { E2E_SUBSET: process.env.E2E_SUBSET ?? "8" };
    const r = await run("npx", ["tsx", "scripts/e2e.ts"], e2eEnv);
    if (r.code !== 0) throw new Error("e2e failed — see e2e-output/e2e-report.json");
    const report = JSON.parse(
      await readFile(path.join(ROOT, "e2e-output", "e2e-report.json"), "utf-8")
    ) as { passed: number; total: number; suite?: string; failed?: { name: string }[] };
    if (report.failed?.length) throw new Error(`${report.failed.length} step(s) failed`);
    const mode = process.env.E2E_FULL ? "full+subset" : `production-subset-${e2eEnv.E2E_SUBSET ?? "8"}`;
    return `${report.passed}/${report.total} (${mode})`;
  });

  const failed = checks.filter((c) => !c.ok);
  console.log("\n=== Elite Summary ===");
  console.log(`Version: ${APP_VERSION}`);
  console.log(`Workspace: ${WORKSPACE_DIR_NAME} → album ${WORKSPACE_ALBUM_NAME}`);
  console.log(`Checks: ${checks.length - failed.length}/${checks.length} passed`);

  if (failed.length) {
    console.log("\nBlocked:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }

  console.log("\n✅ ELITE APPROVED — all gates passed.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
