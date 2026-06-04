#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Slideshow Forge CLI — machine-readable JSON for AI agents and humans.
 */

import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { APP_NAME, APP_VERSION } from "../core/constants";
import { runDoctor } from "../core/doctor.node";
import { runExport } from "../core/exporter.node";
import { createPreset, DEFAULT_PRESET } from "../core/presets";
import { createEmptyProject, loadProject, saveProject } from "../core/project";
import { scanFolder } from "../core/scanner.node";
import { getWorkspacePhotosDir, getWorkspaceProjectPath } from "../core/workspace";
import { WORKSPACE_DIR_NAME, WORKSPACE_ALBUM_NAME } from "../core/workspace.shared";
import type { BackgroundMode, CliJsonResponse, ExportMode, SlideshowPreset, TransitionMode } from "../core/types";

const program = new Command();

program.name("slideshow-forge").description(`${APP_NAME} — Samsung TV slideshow builder`).version(APP_VERSION);

function emitJson<T>(command: string, data: T, ok = true, error?: string): never {
  const payload: CliJsonResponse<T> = { ok, command, data, error };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(ok ? 0 : 1);
}

function parsePreset(id: string, duration: number, transition: TransitionMode): SlideshowPreset {
  const valid = ["samsung-safe-1080p", "samsung-4k", "photo-folder-only", "both"] as const;
  if (!valid.includes(id as (typeof valid)[number])) {
    throw new Error(`Invalid preset: ${id}. Use: ${valid.join(", ")}`);
  }
  return createPreset(id as SlideshowPreset["id"], { slideDurationSeconds: duration, transition });
}

program
  .command("doctor")
  .description("Check FFmpeg, Sharp, and environment")
  .option("--json", "JSON output for agents")
  .action(async (opts: { json?: boolean }) => {
    const report = await runDoctor();
    if (opts.json) emitJson("doctor", report, report.ok);
    console.log(report.ok ? "✓ Environment OK" : "✗ Issues found");
    for (const m of report.messages) console.log(`  ${m}`);
    process.exit(report.ok ? 0 : 1);
  });

program
  .command("scan <folder>")
  .description("Scan a photo folder and list assets")
  .option("--no-recursive", "Do not scan subfolders")
  .option("--no-dedupe", "Disable deduplication")
  .option("--no-fix-rotation", "Skip EXIF orientation")
  .option("--json", "JSON output")
  .option("-o, --output <file>", "Write project JSON")
  .action(async (folder: string, opts: { recursive?: boolean; dedupe?: boolean; fixRotation?: boolean; json?: boolean; output?: string }) => {
    const abs = path.resolve(folder);
    const result = await scanFolder(abs, {
      recursive: opts.recursive !== false,
      dedupe: opts.dedupe !== false,
      fixRotation: opts.fixRotation !== false,
      autoConvert: true,
    });

    if (opts.output) {
      const project = createEmptyProject(abs, path.basename(abs));
      project.photos = result.photos;
      await saveProject(path.resolve(opts.output), project);
    }

    if (opts.json) {
      emitJson("scan", { folder: abs, ...result, projectPath: opts.output });
    }

    console.log(`Scanned: ${abs}`);
    console.log(`  Total: ${result.stats.total} | Ready: ${result.stats.ready} | Dupes: ${result.stats.duplicate} | Skipped: ${result.stats.unsupported}`);
    if (opts.output) console.log(`  Project saved: ${opts.output}`);
  });

const projectCmd = program.command("project").description("Create or update a slideshow project file");

projectCmd
  .command("init <folder>")
  .description("Scan folder and write project.json")
  .option("-o, --output <file>", "Project file path", "slideshow.project.json")
  .option("--json", "JSON output")
  .action(async (folder: string, opts: { output: string; json?: boolean }) => {
    const abs = path.resolve(folder);
    const out = path.resolve(opts.output);
    const { photos } = await scanFolder(abs, {
      recursive: true,
      dedupe: true,
      fixRotation: true,
      autoConvert: true,
    });
    const project = createEmptyProject(abs, path.basename(abs));
    project.photos = photos;
    await saveProject(out, project);
    if (opts.json) emitJson("project init", { projectPath: out, photos: photos.length, ready: photos.filter((p) => p.status === "ready").length });
    console.log(`Project written: ${out} (${photos.length} items)`);
  });

const exportCmd = program
  .command("export")
  .description("Export slideshow to disk (folder / MP4 / both)")
  .requiredOption("-o, --output <dir>", "Output directory")
  .option("-i, --input <folder>", "Input photo folder (scans on the fly)")
  .option("-p, --project <file>", "Project JSON from scan/init")
  .option("--mode <mode>", "folder | mp4 | both", "both")
  .option("--preset <id>", "samsung-safe-1080p | samsung-4k | photo-folder-only | both", "samsung-safe-1080p")
  .option("--background <mode>", "black-bars | blurred-fill | crop-fill", "blurred-fill")
  .option("--duration <sec>", "Seconds per slide", "5")
  .option("--transition <t>", "none | crossfade | fade-to-black", "crossfade")
  .option("--name <album>", "Album folder name", WORKSPACE_ALBUM_NAME)
  .option("--music <path>", "Optional background music (AAC/MP3)")
  .option("--json", "JSON output")
  .action(async (opts: {
    output: string;
    input?: string;
    project?: string;
    mode: string;
    preset: string;
    background: string;
    duration: string;
    transition: string;
    name: string;
    music?: string;
    json?: boolean;
  }) => {
    const mode = opts.mode as ExportMode;
    const background = opts.background as BackgroundMode;
    const transition = opts.transition as TransitionMode;
    const duration = parseInt(opts.duration, 10) || 5;
    let photos: import("../core/types").PhotoAsset[] = [];
    let inputFolder = opts.input ? path.resolve(opts.input) : "";
    let preset = parsePreset(opts.preset, duration, transition);

    if (opts.project) {
      const project = await loadProject(path.resolve(opts.project));
      photos = project.photos;
      inputFolder = project.inputFolder;
      preset = project.preset;
    } else if (opts.input) {
      const scanned = await scanFolder(path.resolve(opts.input), {
        recursive: true,
        dedupe: true,
        fixRotation: true,
        autoConvert: true,
      });
      photos = scanned.photos;
      inputFolder = path.resolve(opts.input);
    } else {
      throw new Error("Provide --input <folder> or --project <file>");
    }

    if (mode === "folder") {
      preset = { ...preset, id: "photo-folder-only" };
    }

    const logs: string[] = [];
    const result = await runExport(photos, {
      outputDir: path.resolve(opts.output),
      albumName: opts.name.replace(/[^\w\- ]/g, "_").replace(/\s+/g, "_"),
      mode,
      preset,
      backgroundMode: background,
      musicEnabled: Boolean(opts.music),
      musicPath: opts.music,
      inputFolder,
      onLog: (m) => logs.push(m),
    });

    if (opts.json) {
      emitJson("export", { ...result, logs }, result.success, result.errors.join("; ") || undefined);
    }

    console.log(result.success ? "✓ Export complete" : "✗ Export finished with errors");
    console.log(`  Output: ${result.outputDir}`);
    for (const e of result.errors) console.log(`  ! ${e}`);
    process.exit(result.success ? 0 : 1);
  });

const workspaceCmd = program.command("workspace").description(`Elite workflow using "${WORKSPACE_DIR_NAME}"`);

workspaceCmd
  .command("scan")
  .description("Scan workspace photos and write workspace.project.json")
  .option("--json", "JSON output")
  .action(async (opts: { json?: boolean }) => {
    const dir = getWorkspacePhotosDir();
    const out = getWorkspaceProjectPath();
    const result = await scanFolder(dir, {
      recursive: false,
      dedupe: true,
      fixRotation: true,
      autoConvert: true,
    });
    const project = createEmptyProject(dir, WORKSPACE_ALBUM_NAME);
    project.photos = result.photos;
    project.preset = createPreset("samsung-safe-1080p");
    await saveProject(out, project);
    if (opts.json) emitJson("workspace scan", { folder: dir, projectPath: out, ...result });
    console.log(`Workspace: ${dir}`);
    console.log(`  Ready: ${result.stats.ready} / ${result.stats.total}`);
    console.log(`  Project: ${out}`);
  });

workspaceCmd
  .command("export")
  .description("Export elite workspace to ./output")
  .option("-o, --output <dir>", "Output directory", "output")
  .option("--mode <mode>", "folder | mp4 | both", "both")
  .option("--preset <id>", "samsung-safe-1080p | samsung-4k", "samsung-safe-1080p")
  .option("--background <mode>", "black-bars | blurred-fill | crop-fill", "blurred-fill")
  .option("--duration <sec>", "Seconds per slide", "5")
  .option("--transition <t>", "none | crossfade | fade-to-black", "crossfade")
  .option("--name <album>", "Album name", WORKSPACE_ALBUM_NAME)
  .option("--music <path>", "Optional music track")
  .option("--json", "JSON output")
  .action(async (opts: {
    output: string;
    mode: string;
    preset: string;
    background: string;
    duration: string;
    transition: string;
    name: string;
    music?: string;
    json?: boolean;
  }) => {
    const projectPath = getWorkspaceProjectPath();
    let project;
    try {
      project = await loadProject(projectPath);
    } catch {
      const dir = getWorkspacePhotosDir();
      const scanned = await scanFolder(dir, {
        recursive: false,
        dedupe: true,
        fixRotation: true,
        autoConvert: true,
      });
      project = createEmptyProject(dir, WORKSPACE_ALBUM_NAME);
      project.photos = scanned.photos;
      await saveProject(projectPath, project);
    }

    const mode = opts.mode as ExportMode;
    const preset = parsePreset(opts.preset, parseInt(opts.duration, 10) || 5, opts.transition as TransitionMode);
    const logs: string[] = [];
    const result = await runExport(project.photos.filter((p) => p.status === "ready"), {
      outputDir: path.resolve(opts.output),
      albumName: opts.name.replace(/[^\w\- ]/g, "_").replace(/\s+/g, "_"),
      mode,
      preset,
      backgroundMode: opts.background as BackgroundMode,
      musicEnabled: Boolean(opts.music),
      musicPath: opts.music,
      inputFolder: project.inputFolder,
      onLog: (m) => logs.push(m),
    });
    if (opts.json) emitJson("workspace export", { ...result, logs }, result.success, result.errors.join("; ") || undefined);
    console.log(result.success ? "✓ Elite export complete" : "✗ Export had errors");
    console.log(`  ${result.outputDir}`);
    process.exit(result.success ? 0 : 1);
  });

program
  .command("help-agent")
  .description("Print agent-oriented command reference as JSON")
  .action(() => {
    emitJson("help-agent", {
      name: APP_NAME,
      version: APP_VERSION,
      workspace: WORKSPACE_DIR_NAME,
      commands: [
        { cmd: "slideshow-forge doctor --json", desc: "Verify FFmpeg and dependencies" },
        { cmd: "slideshow-forge workspace scan --json", desc: "Scan photos for use and save project" },
        { cmd: "slideshow-forge workspace export --mode both --json", desc: "Elite export to ./output" },
        { cmd: "slideshow-forge scan \"photos for use\" --json", desc: "Scan workspace folder explicitly" },
        { cmd: "slideshow-forge export -p \"photos for use/workspace.project.json\" -o ./output --mode both --json", desc: "Export from workspace project" },
      ],
      flags: {
        json: "Always use --json for programmatic parsing",
        mode: "folder | mp4 | both",
        preset: "samsung-safe-1080p | samsung-4k",
      },
    });
  });

program.parseAsync(process.argv).catch((err: Error) => {
  if (program.opts().json) {
    emitJson(program.args[0] ?? "unknown", null, false, err.message);
  }
  console.error(err.message);
  process.exit(1);
});
