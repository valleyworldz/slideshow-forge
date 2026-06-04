/**
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [GATE] Production E2E
 * ───────────────────────────────────────────────────────────────────────────
 * @file     e2e.ts
 * @purpose  25 automated checks across export, CLI, API, card format
 * @layer    GATE
 * @depends  exporter.node, server, cli paths, workspace
 * @consumers npm run test:e2e, elite-check
 * @status   ELITE ✅
 * @see      E2E_MAP.md
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Production E2E — validates every export path for personal use.
 * Default: fast subset (~8 photos). Full 188-photo run: E2E_FULL=1
 * Run: npm run test:e2e | npm run test:e2e:full
 */

import { spawn } from "node:child_process";
import { mkdir, cp, rm, access, readFile, stat, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runDoctor } from "../src/core/doctor.node.ts";
import { scanFolder } from "../src/core/scanner.node.ts";
import { runExport } from "../src/core/exporter.node.ts";
import { createPreset } from "../src/core/presets.ts";
import { saveProject, loadProject, createEmptyProject } from "../src/core/project.ts";
import { startApiServer } from "../src/server/index.ts";
import { detectFfmpeg } from "../src/core/ffmpeg.ts";
import {
  buildNormalizeOptionsForPhoto,
  patchPhoto,
  resolveFrameMode,
  resolveSlideDuration,
  resolveAspectRatio,
} from "../src/core/cardFormat.ts";
import { WORKSPACE_DIR_NAME, WORKSPACE_ALBUM_NAME } from "../src/core/workspace.shared.ts";
import type { BackgroundMode, PhotoAsset, SlideshowPreset } from "../src/core/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const INPUT_DIR = process.env.E2E_INPUT_DIR ?? path.join(ROOT, WORKSPACE_DIR_NAME);
let OUT_DIR = path.join(ROOT, "e2e-output");
let SUBSET_DIR = path.join(OUT_DIR, "_subset");
const RUN_FULL = process.env.E2E_FULL === "1";
const SUBSET_COUNT = parseInt(process.env.E2E_SUBSET ?? "8", 10);

type StepResult = { name: string; ok: boolean; ms: number; detail?: string; error?: string };

const results: StepResult[] = [];

async function step(name: string, fn: () => Promise<string | void>): Promise<void> {
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, ms: Date.now() - t0, detail: detail ?? undefined });
    console.log(`  ✓ ${name} (${Date.now() - t0}ms)${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    results.push({ name, ok: false, ms: Date.now() - t0, error });
    console.error(`  ✗ ${name} (${Date.now() - t0}ms) — ${error}`);
  }
}

function skip(name: string, reason: string): void {
  results.push({ name, ok: true, ms: 0, detail: `skipped: ${reason}` });
  console.log(`  ○ ${name} — skipped (${reason})`);
}

async function assertFile(p: string, minBytes = 1000): Promise<string> {
  await access(p);
  const s = await stat(p);
  if (s.size < minBytes) throw new Error(`${p} too small (${s.size} bytes)`);
  return `${path.basename(p)} (${(s.size / 1024).toFixed(1)} KB)`;
}

async function probeMp4DurationSeconds(file: string): Promise<number> {
  const ff = await detectFfmpeg();
  if (!ff.installed || !ff.path) throw new Error("FFmpeg required for duration probe");
  return new Promise((resolve, reject) => {
    const proc = spawn(ff.path!, ["-i", file], { windowsHide: true });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!m) {
        reject(new Error(`Could not parse duration from ffmpeg output`));
        return;
      }
      resolve(parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]));
    });
  });
}

function runCmd(cmd: string, args: string[]): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: ROOT, shell: true, windowsHide: true });
    let out = "";
    proc.stdout?.on("data", (d) => (out += d.toString()));
    proc.stderr?.on("data", (d) => (out += d.toString()));
    proc.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

function parseCliJson(stdout: string): { ok: boolean; data?: unknown; error?: string } {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON in CLI output");
  return JSON.parse(stdout.slice(start, end + 1)) as { ok: boolean; data?: unknown; error?: string };
}

async function prepareSubset(): Promise<void> {
  await rm(SUBSET_DIR, { recursive: true, force: true });
  await mkdir(SUBSET_DIR, { recursive: true });
  const files = (await readdir(INPUT_DIR))
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort()
    .slice(0, SUBSET_COUNT);
  if (files.length < 4) throw new Error(`Need at least 4 JPEGs in ${INPUT_DIR}`);
  for (const f of files) {
    await cp(path.join(INPUT_DIR, f), path.join(SUBSET_DIR, f));
  }
}

async function scanSubset(): Promise<PhotoAsset[]> {
  const { photos } = await scanFolder(SUBSET_DIR, {
    recursive: false,
    dedupe: true,
    fixRotation: true,
    autoConvert: true,
  });
  const ready = photos.filter((p) => p.status === "ready");
  if (ready.length < 4) throw new Error(`Subset has only ${ready.length} ready photos`);
  return ready;
}

function applyCardFormats(photos: PhotoAsset[], defaultSec: number): PhotoAsset[] {
  const base = photos.slice(0, 4);
  return [
    patchPhoto(base[0], { frameMode: "crop-fill", aspectRatio: "16:9", slideDurationSeconds: 2 }),
    patchPhoto(base[1], { frameMode: "black-bars", aspectRatio: "4:3", slideDurationSeconds: 4 }),
    patchPhoto(base[2], { frameMode: "blurred-fill", aspectRatio: "1:1", slideDurationSeconds: 3 }),
    patchPhoto(base[3], { frameMode: "default", aspectRatio: "original", slideDurationSeconds: undefined }),
    ...photos.slice(4),
  ];
}

async function main() {
  console.log("\n=== Slideshow Forge Production E2E ===\n");
  console.log(`Input:  ${INPUT_DIR}`);
  console.log(`Output: ${OUT_DIR}`);
  console.log(`Mode:   ${RUN_FULL ? "FULL inventory + subset" : `subset (${SUBSET_COUNT} photos)`}\n`);

  try {
    await rm(OUT_DIR, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch {
    OUT_DIR = path.join(ROOT, `e2e-output-${Date.now()}`);
    SUBSET_DIR = path.join(OUT_DIR, "_subset");
    console.warn(`  ⚠ Using fresh output dir: ${OUT_DIR}`);
  }
  await mkdir(OUT_DIR, { recursive: true });

  // --- Environment & core logic ---
  await step("doctor", async () => {
    const r = await runDoctor();
    if (!r.ok) throw new Error(r.messages.join("; "));
    return `ffmpeg=${r.ffmpeg.installed}, sharp=${r.sharp.ok}`;
  });

  await step("card-format-helpers", async () => {
    const p: PhotoAsset = {
      id: "t1",
      filename: "t.jpg",
      originalPath: "x.jpg",
      status: "ready",
      frameMode: "crop-fill",
      aspectRatio: "4:3",
      slideDurationSeconds: 8,
    };
    if (resolveFrameMode(p, "blurred-fill") !== "crop-fill") throw new Error("resolveFrameMode");
    if (resolveAspectRatio(p) !== "4:3") throw new Error("resolveAspectRatio");
    if (resolveSlideDuration(p, 5) !== 8) throw new Error("resolveSlideDuration");
    const cleared = patchPhoto(p, { slideDurationSeconds: undefined });
    if (cleared.slideDurationSeconds !== undefined) throw new Error("patchPhoto clear duration");
    const opts = buildNormalizeOptionsForPhoto(p, 1920, 1080, "blurred-fill");
    if (opts.backgroundMode !== "crop-fill" || opts.width !== 1440) throw new Error("buildNormalizeOptions 4:3");
    return "frame/aspect/duration/normalize OK";
  });

  await step("artifacts-cli", async () => {
    await access(path.join(ROOT, "dist", "cli.mjs"));
    return "dist/cli.mjs";
  });

  await step("artifacts-electron", async () => {
    if (process.env.E2E_SKIP_BUILD === "1") {
      await access(path.join(ROOT, "dist-electron", "main.cjs"));
      await access(path.join(ROOT, "dist-electron", "preload.cjs"));
      return "skipped build (E2E_SKIP_BUILD=1)";
    }
    const r = await runCmd("npm", ["run", "build:electron"]);
    if (r.code !== 0) throw new Error(r.out.slice(-400));
    await access(path.join(ROOT, "dist-electron", "main.cjs"));
    await access(path.join(ROOT, "dist-electron", "preload.cjs"));
    return "main.cjs + preload.cjs";
  });

  // --- Inventory ---
  await step("scan-full-inventory", async () => {
    const { photos, stats } = await scanFolder(INPUT_DIR, {
      recursive: false,
      dedupe: true,
      fixRotation: true,
      autoConvert: true,
    });
    if (stats.ready < 1) throw new Error(`No ready photos (${stats.total} total)`);
    const project = createEmptyProject(INPUT_DIR, WORKSPACE_ALBUM_NAME);
    project.photos = photos;
    const projectPath = path.join(OUT_DIR, "workspace.project.json");
    await saveProject(projectPath, project);
    return `${stats.ready} ready / ${stats.total} total`;
  });

  await step("prepare-subset", async () => {
    await prepareSubset();
    const n = (await readdir(SUBSET_DIR)).filter((f) => /\.jpe?g$/i.test(f)).length;
    return `${n} photos in ${path.basename(SUBSET_DIR)}`;
  });

  await step("project-card-fields-roundtrip", async () => {
    const ready = await scanSubset();
    const tagged = applyCardFormats(ready, 5);
    const projPath = path.join(OUT_DIR, "card-test.project.json");
    const project = createEmptyProject(SUBSET_DIR, "CardTest");
    project.photos = tagged;
    await saveProject(projPath, project);
    const loaded = await loadProject(projPath);
    const a = loaded.photos[0];
    if (a.frameMode !== "crop-fill" || a.slideDurationSeconds !== 2) {
      throw new Error("Card fields not persisted on photo 0");
    }
    if (loaded.photos[3].slideDurationSeconds !== undefined) {
      throw new Error("Cleared duration should stay undefined");
    }
    return "frame/aspect/duration round-trip OK";
  });

  // --- Standard export modes ---
  await step("export-folder-subset", async () => {
    const photos = await scanSubset();
    const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 3, transition: "crossfade" });
    const r = await runExport(photos, {
      outputDir: path.join(OUT_DIR, "01-folder-subset"),
      albumName: "Elite_Subset_Folder",
      mode: "folder",
      preset,
      backgroundMode: "blurred-fill",
      musicEnabled: false,
      inputFolder: SUBSET_DIR,
    });
    if (!r.success && r.errors.length) throw new Error(r.errors.join("; "));
    await assertFile(path.join(r.outputDir, "000001.jpg"));
    const manifest = JSON.parse(await readFile(path.join(r.outputDir, "slideshow_manifest.json"), "utf-8")) as {
      exportMode: string;
      appVersion: string;
      sequence?: { index: number; filename: string }[];
    };
    if (manifest.exportMode !== "folder" || !manifest.appVersion) throw new Error("Invalid manifest");
    if (!manifest.sequence?.length) throw new Error("Manifest missing sequence");
    await assertFile(path.join(r.outputDir, "README_TV_INSTRUCTIONS.txt"), 50);
    return `${r.files.length} files`;
  });

  await step("export-mp4-subset", async () => {
    const photos = await scanSubset();
    const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 2, transition: "crossfade" });
    const r = await runExport(photos, {
      outputDir: path.join(OUT_DIR, "02-mp4-subset"),
      albumName: "Elite_Subset_MP4",
      mode: "mp4",
      preset,
      backgroundMode: "blurred-fill",
      musicEnabled: false,
      inputFolder: SUBSET_DIR,
    });
    const mp4 = path.join(r.outputDir, "Samsung_Slideshow_Video.mp4");
    if (r.errors.some((e) => e.includes("FFmpeg"))) throw new Error(r.errors.join("; "));
    const info = await assertFile(mp4, 50_000);
    const head = await readFile(mp4);
    if (head.slice(4, 8).toString("ascii") !== "ftyp") throw new Error("Invalid MP4 container");
    const dur = await probeMp4DurationSeconds(mp4);
    const expectedMin = photos.length * preset.slideDurationSeconds * 0.85;
    const expectedMax = photos.length * preset.slideDurationSeconds * 1.35;
    if (dur < expectedMin || dur > expectedMax) {
      throw new Error(`MP4 duration ${dur.toFixed(1)}s outside [${expectedMin}, ${expectedMax}]`);
    }
    return `${info}, ${dur.toFixed(1)}s`;
  });

  await step("export-both-subset", async () => {
    const photos = await scanSubset();
    const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 2, transition: "none" });
    const r = await runExport(photos, {
      outputDir: path.join(OUT_DIR, "03-both-subset"),
      albumName: "Elite_Subset_Both",
      mode: "both",
      preset,
      backgroundMode: "black-bars",
      musicEnabled: false,
      inputFolder: SUBSET_DIR,
    });
    await assertFile(path.join(r.outputDir, "000001.jpg"));
    await assertFile(path.join(r.outputDir, "Samsung_Slideshow_Video.mp4"), 50_000);
    return `jpg + mp4 (${r.files.length} files)`;
  });

  // --- Per-card formatting ---
  await step("session-persist-roundtrip", async () => {
    const { savePhotoSession, loadPhotoSession, applyPersistedEdits } = await import("../src/core/session.browser.ts");
    const ready = applyCardFormats(await scanSubset(), 5).slice(0, 3);
    savePhotoSession(ready);
    const loaded = loadPhotoSession();
    if (!loaded?.order.length || loaded.order[0] !== ready[0].filename) {
      throw new Error("Session order not saved");
    }
    const merged = applyPersistedEdits(
      ready.map((p) => ({ ...p, frameMode: undefined, slideDurationSeconds: undefined }))
    );
    if (merged[0].slideDurationSeconds !== ready[0].slideDurationSeconds) {
      throw new Error("Session overrides not applied");
    }
    return "browser session persist OK";
  });

  await step("export-card-formats-mp4", async () => {
    const photos = applyCardFormats(await scanSubset(), 5);
    const cardPhotos = photos.slice(0, 4);
    const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 5, transition: "none" });
    const expectedDuration = cardPhotos.reduce(
      (s, p) => s + resolveSlideDuration(p, preset.slideDurationSeconds),
      0
    );
    const r = await runExport(cardPhotos, {
      outputDir: path.join(OUT_DIR, "04-card-formats-mp4"),
      albumName: "Card_Formats_MP4",
      mode: "mp4",
      preset,
      backgroundMode: "blurred-fill",
      musicEnabled: false,
      inputFolder: SUBSET_DIR,
    });
    const mp4 = path.join(r.outputDir, "Samsung_Slideshow_Video.mp4");
    await assertFile(mp4, 20_000);
    const dur = await probeMp4DurationSeconds(mp4);
    if (dur < expectedDuration * 0.8 || dur > expectedDuration * 1.25) {
      throw new Error(`Variable-duration MP4 ${dur.toFixed(1)}s vs expected ~${expectedDuration}s`);
    }
    return `4 cards, ${dur.toFixed(1)}s (expected ~${expectedDuration}s)`;
  });

  await step("export-card-formats-folder", async () => {
    const photos = applyCardFormats(await scanSubset(), 5).slice(0, 4);
    const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 5, transition: "crossfade" });
    const r = await runExport(photos, {
      outputDir: path.join(OUT_DIR, "05-card-formats-folder"),
      albumName: "Card_Formats_Folder",
      mode: "folder",
      preset,
      backgroundMode: "crop-fill",
      musicEnabled: false,
      inputFolder: SUBSET_DIR,
    });
    if (r.files.filter((f) => f.endsWith(".jpg")).length < 4) throw new Error("Missing numbered JPEGs");
    return "4 formatted JPEGs";
  });

  // --- Background modes ---
  for (const bg of ["black-bars", "blurred-fill", "crop-fill"] as BackgroundMode[]) {
    await step(`export-background-${bg}`, async () => {
      const photos = (await scanSubset()).slice(0, 3);
      const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 2, transition: "none" });
      const r = await runExport(photos, {
        outputDir: path.join(OUT_DIR, `06-bg-${bg}`),
        albumName: `BG_${bg}`,
        mode: "folder",
        preset,
        backgroundMode: bg,
        musicEnabled: false,
        inputFolder: SUBSET_DIR,
      });
      await assertFile(path.join(r.outputDir, "000001.jpg"), 5000);
      return `${photos.length} photos, mode=${bg}`;
    });
  }

  // --- Presets ---
  await step("export-preset-4k-mp4", async () => {
    const photos = (await scanSubset()).slice(0, 3);
    const preset = createPreset("samsung-4k", { slideDurationSeconds: 2, transition: "crossfade" });
    const r = await runExport(photos, {
      outputDir: path.join(OUT_DIR, "07-preset-4k"),
      albumName: "Preset_4K",
      mode: "mp4",
      preset,
      backgroundMode: "blurred-fill",
      musicEnabled: false,
      inputFolder: SUBSET_DIR,
    });
    const mp4 = path.join(r.outputDir, "Samsung_Slideshow_Video.mp4");
    await assertFile(mp4, 80_000);
    return await assertFile(mp4);
  });

  await step("export-preset-folder-only", async () => {
    const photos = (await scanSubset()).slice(0, 3);
    const preset = createPreset("photo-folder-only");
    const r = await runExport(photos, {
      outputDir: path.join(OUT_DIR, "08-preset-folder-only"),
      albumName: "Folder_Only",
      mode: "folder",
      preset,
      backgroundMode: "black-bars",
      musicEnabled: false,
      inputFolder: SUBSET_DIR,
    });
    const mp4Path = path.join(r.outputDir, "Samsung_Slideshow_Video.mp4");
    try {
      await access(mp4Path);
      throw new Error("folder-only preset must not create MP4");
    } catch (e) {
      if (e instanceof Error && e.message.includes("must not")) throw e;
    }
    return `${r.files.length} JPEGs, no MP4`;
  });

  // --- CLI (agent JSON) ---
  await step("cli-doctor-json", async () => {
    const r = await runCmd("npx", ["tsx", "src/cli/index.ts", "doctor", "--json"]);
    if (r.code !== 0) throw new Error(r.out.slice(-400));
    const j = parseCliJson(r.out);
    if (!j.ok) throw new Error(j.error ?? "doctor failed");
    return "CLI doctor JSON ok";
  });

  await step("cli-scan-json", async () => {
    const r = await runCmd("npx", ["tsx", "src/cli/index.ts", "scan", SUBSET_DIR, "--json"]);
    if (r.code !== 0) throw new Error(r.out.slice(-400));
    const j = parseCliJson(r.out) as { ok: boolean; data?: { stats?: { ready: number } } };
    if (!j.ok || !j.data?.stats?.ready) throw new Error("scan json failed");
    return `${j.data.stats.ready} ready`;
  });

  await step("cli-export-folder-json", async () => {
    const proj = path.join(OUT_DIR, "cli-export.project.json");
    const r1 = await runCmd("npx", [
      "tsx",
      "src/cli/index.ts",
      "scan",
      SUBSET_DIR,
      "-o",
      proj,
      "--json",
    ]);
    if (r1.code !== 0) throw new Error(r1.out.slice(-300));
    const out = path.join(OUT_DIR, "09-cli-export");
    const r2 = await runCmd("npx", [
      "tsx",
      "src/cli/index.ts",
      "export",
      "-p",
      proj,
      "-o",
      out,
      "--mode",
      "folder",
      "--json",
    ]);
    if (r2.code !== 0) throw new Error(r2.out.slice(-400));
    const j = parseCliJson(r2.out);
    if (!j.ok) throw new Error(j.error ?? r2.out.slice(-300));
    return "CLI export folder JSON ok";
  });

  // --- API ---
  await step("api-health", async () => {
    const server = await startApiServer(3848);
    try {
      const res = await fetch("http://127.0.0.1:3848/api/health");
      const data = (await res.json()) as { ok: boolean; version: string; doctor?: { ok: boolean } };
      if (!data.ok || !data.version) throw new Error("health not ok");
      return `v${data.version}, doctor=${data.doctor?.ok}`;
    } finally {
      server.close();
    }
  });

  await step("api-export-zip", async () => {
    const ready = (await scanSubset()).slice(0, 3);
    const server = await startApiServer(3849);
    try {
      const form = new FormData();
      const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 2, transition: "none" });
      for (const p of ready) {
        const buf = await readFile(path.join(SUBSET_DIR, p.filename));
        form.append("files", new Blob([buf]), p.filename);
      }
      form.append("photos", JSON.stringify(ready));
      form.append("preset", JSON.stringify(preset));
      form.append("mode", "folder");
      form.append("backgroundMode", "blurred-fill");
      form.append("albumName", "API_Zip_Test");

      const res = await fetch("http://127.0.0.1:3849/api/export", { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const zipBuf = Buffer.from(await res.arrayBuffer());
      if (zipBuf.length < 5000) throw new Error(`ZIP too small (${zipBuf.length} bytes)`);
      const okHdr = res.headers.get("X-Slideshow-Ok");
      if (okHdr !== "1") throw new Error(`Export not ok (header ${okHdr})`);
      return `ZIP ${(zipBuf.length / 1024).toFixed(1)} KB`;
    } finally {
      server.close();
    }
  });

  // --- Full inventory (opt-in) ---
  if (RUN_FULL) {
    await step("export-full-inventory-folder", async () => {
      const projectPath = path.join(OUT_DIR, "workspace.project.json");
      const project = await loadProject(projectPath);
      const ready = project.photos.filter((p) => p.status === "ready");
      const preset = createPreset("samsung-safe-1080p", { slideDurationSeconds: 5, transition: "crossfade" });
      const r = await runExport(ready, {
        outputDir: path.join(OUT_DIR, "10-full-inventory-folder"),
        albumName: WORKSPACE_ALBUM_NAME + "_Full",
        mode: "folder",
        preset,
        backgroundMode: "blurred-fill",
        musicEnabled: false,
        inputFolder: INPUT_DIR,
        onLog: () => process.stdout.write("."),
      });
      console.log("");
      if (r.files.length < ready.length * 0.95) {
        throw new Error(`Only ${r.files.length}/${ready.length}; ${r.errors.slice(0, 2).join("; ")}`);
      }
      return `${r.files.length} JPEGs`;
    });
  } else {
    skip("export-full-inventory-folder", "set E2E_FULL=1 for full workspace export");
  }

  // --- Web dist (if already built) ---
  await step("artifacts-web-dist", async () => {
    try {
      await access(path.join(ROOT, "dist", "index.html"));
      return "dist/index.html present";
    } catch {
      const r = await runCmd("npm", ["run", "build"]);
      if (r.code !== 0) throw new Error(r.out.slice(-400));
      await access(path.join(ROOT, "dist", "index.html"));
      return "built dist/index.html";
    }
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  const report = {
    suite: "production-e2e",
    version: "3.0.0",
    input: INPUT_DIR,
    output: OUT_DIR,
    mode: RUN_FULL ? "full" : `subset-${SUBSET_COUNT}`,
    passed,
    total: results.length,
    failed: failed.map((f) => ({ name: f.name, error: f.error })),
    results,
    timestamp: new Date().toISOString(),
  };
  const reportPath = path.join(OUT_DIR, "e2e-report.json");
  await import("node:fs/promises").then((fs) => fs.writeFile(reportPath, JSON.stringify(report, null, 2)));

  console.log("\n=== E2E Summary ===");
  console.log(`Passed: ${passed}/${results.length}`);
  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  ✗ ${f.name}: ${f.error}`);
    console.log(`\nReport: ${reportPath}\n`);
    process.exit(1);
  }
  console.log(`\n✅ All production E2E checks passed.`);
  console.log(`Report: ${reportPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
