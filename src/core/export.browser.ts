/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from "jszip";
import { buildManifest, buildReadmeTvGuide } from "./manifest";
import { buildNormalizeOptionsForPhoto } from "./cardFormat";
import { normalizePhotoOnCanvas, numberedJpegName } from "./processor.browser";
import type { BackgroundMode, ExportMode, ExportResult, PhotoAsset, SlideshowPreset } from "./types";

export interface BrowserExportOptions {
  photos: PhotoAsset[];
  preset: SlideshowPreset;
  backgroundMode: BackgroundMode;
  mode: ExportMode;
  albumName: string;
  inputFolder: string;
  musicPath?: string;
  musicEnabled?: boolean;
  onLog?: (msg: string) => void;
  onProgress?: (pct: number) => void;
}

function decodeApiLogs(header: string | null): string[] {
  if (!header) return [];
  try {
    return JSON.parse(atob(header)) as string[];
  } catch {
    return [];
  }
}

export async function runBrowserFolderExport(opts: BrowserExportOptions): Promise<ExportResult> {
  const { photos, preset, backgroundMode, albumName, inputFolder, onLog, onProgress } = opts;
  const log = onLog ?? (() => {});
  const ready = photos.filter((p) => p.status === "ready");
  const errors: string[] = [];
  const outputFiles: string[] = [];
  const safeName = albumName.replace(/[^\w\- ]/g, "_").replace(/\s+/g, "_");

  if (ready.length === 0) {
    return {
      success: false,
      outputDir: safeName,
      manifest: buildManifest({
        inputFolder,
        outputFolder: safeName,
        photos,
        readyCount: 0,
        preset,
        outputFiles: [],
        exportMode: "folder",
        backgroundMode,
      }),
      files: [],
      errors: ["No ready photos."],
    };
  }

  const zip = new JSZip();
  const base = zip.folder("Samsung_Slideshows")?.folder(safeName) ?? zip;

  log(`Normalizing ${ready.length} photos to ${preset.width}x${preset.height} (per-card frame/aspect applied)...`);

  for (let i = 0; i < ready.length; i++) {
    const ph = ready[i];
    const name = numberedJpegName(i);
    const blob = await normalizePhotoOnCanvas(ph, preset.width, preset.height, backgroundMode);
    if (blob) {
      base.file(name, blob);
      outputFiles.push(name);
      const fmt = ph.frameMode && ph.frameMode !== "default" ? ` [${ph.frameMode}]` : "";
      log(`[${i + 1}/${ready.length}] ${ph.filename}${fmt}`);
    } else {
      errors.push(`Normalize failed: ${ph.filename} — re-import file or use Electron/CLI for HEIC`);
      log(`⚠ Skipped ${ph.filename} (could not normalize with card formatting)`);
    }
    onProgress?.(Math.floor(((i + 1) / ready.length) * 85));
  }

  const albumPath = `Samsung_Slideshows/${safeName}`;
  const manifest = buildManifest({
    inputFolder,
    outputFolder: albumPath,
    photos,
    readyCount: outputFiles.length,
    preset,
    outputFiles,
    exportMode: "folder",
    backgroundMode,
  });

  base.file("slideshow_manifest.json", JSON.stringify(manifest, null, 2));
  base.file(
    "README_TV_INSTRUCTIONS.txt",
    buildReadmeTvGuide({ albumName: safeName, preset, exportMode: "folder", outputFolder: albumPath })
  );

  onProgress?.(95);
  log("Creating ZIP download...");
  const content = await zip.generateAsync({ type: "blob" });
  triggerDownload(content, `Slideshow_Forge_${safeName}_${new Date().toISOString().slice(0, 10)}.zip`);

  onProgress?.(100);
  log("✓ ZIP downloaded — extract to USB root");

  return {
    success: outputFiles.length === ready.length && errors.length === 0,
    outputDir: albumPath,
    manifest,
    files: outputFiles,
    errors,
  };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function checkApiServer(): Promise<{ available: boolean; version?: string; ffmpeg?: boolean }> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { available: false };
    const data = (await res.json()) as { version?: string; doctor?: { ffmpeg?: { installed: boolean } } };
    return { available: true, version: data.version, ffmpeg: data.doctor?.ffmpeg?.installed };
  } catch {
    return { available: false };
  }
}

export function validateApiUploadReady(photos: PhotoAsset[]): { ok: boolean; missing: string[] } {
  const ready = photos.filter((p) => p.status === "ready");
  const missing = ready.filter((p) => !p.sourceFile).map((p) => p.filename);
  return { ok: missing.length === 0, missing };
}

export async function runApiExport(opts: BrowserExportOptions): Promise<ExportResult> {
  const uploadCheck = validateApiUploadReady(opts.photos);
  if (!uploadCheck.ok) {
    throw new Error(
      `MP4/API export needs original files attached (${uploadCheck.missing.length} missing). ` +
        `Re-import your folder — sample album URLs cannot be sent to the server. Use Electron or CLI for large libraries.`
    );
  }

  const form = new FormData();
  form.append("mode", opts.mode);
  form.append("backgroundMode", opts.backgroundMode);
  form.append("albumName", opts.albumName);
  form.append("preset", JSON.stringify(opts.preset));
  form.append("photos", JSON.stringify(opts.photos.filter((p) => p.status === "ready")));
  form.append("musicEnabled", opts.musicEnabled && opts.musicPath ? "1" : "0");
  if (opts.musicPath) form.append("musicPath", opts.musicPath);

  for (const p of opts.photos) {
    if (p.status === "ready" && p.sourceFile) {
      form.append("files", p.sourceFile, p.filename);
    }
  }

  const res = await fetch("/api/export", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Export failed (${res.status})`);
  }

  const apiLogs = decodeApiLogs(res.headers.get("X-Slideshow-Logs"));
  const blob = await res.blob();
  const safeName = opts.albumName.replace(/[^\w\- ]/g, "_");
  triggerDownload(blob, `Slideshow_Forge_${safeName}.zip`);

  const ok = res.headers.get("X-Slideshow-Ok") === "1";
  const readyCount = opts.photos.filter((p) => p.status === "ready").length;

  return {
    success: ok,
    outputDir: `Samsung_Slideshows/${safeName}`,
    manifest: buildManifest({
      inputFolder: opts.inputFolder,
      outputFolder: `Samsung_Slideshows/${safeName}`,
      photos: opts.photos,
      readyCount,
      preset: opts.preset,
      outputFiles: [],
      exportMode: opts.mode,
      backgroundMode: opts.backgroundMode,
      musicTrack: opts.musicEnabled ? opts.musicPath : undefined,
    }),
    files: [],
    errors: ok ? [] : [`Export finished with errors. ${apiLogs.slice(-3).join(" ")}`],
  };
}

export function buildCliExportCommand(_albumName: string, mode: ExportMode): string {
  const m = mode === "folder" ? "folder" : mode === "mp4" ? "mp4" : "both";
  if (m === "folder") return `npm run workspace:export -- --mode folder`;
  return `slideshow-forge workspace export --mode ${m} --json`;
}
