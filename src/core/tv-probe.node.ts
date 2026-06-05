/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [IO] Samsung TV Export Probe
 * ───────────────────────────────────────────────────────────────────────────
 * @file     tv-probe.node.ts
 * @purpose  Validate exported album JPEGs + MP4 against Samsung USB contract
 * @layer    IO
 * @depends  ffmpeg, sharp, manifest types
 * @consumers scripts/tv-probe.ts, e2e
 * @status   ELITE ✅
 * @see      docs/TV_VALIDATION.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { readFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { detectFfmpeg, ffprobePathFromFfmpeg, probeMp4PixelFormat } from "./ffmpeg";
import type { ExportManifest } from "./types";

export type TvProbeCheck = { name: string; ok: boolean; detail?: string };

export type TvProbeReport = {
  albumDir: string;
  ok: boolean;
  checks: TvProbeCheck[];
  jpegCount: number;
  hasMp4: boolean;
  manifestPreset?: { width: number; height: number; id: string };
};

const NUMBERED_JPEG = /^\d{6}\.jpg$/i;
const MP4_NAME = "Samsung_Slideshow_Video.mp4";

function check(name: string, ok: boolean, detail?: string): TvProbeCheck {
  return { name, ok, detail };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function probeMp4Stream(
  filePath: string,
  ffmpegPath: string
): Promise<{ codec: string; width: number; height: number; pixFmt: string; colorRange?: string }> {
  const probe = ffprobePathFromFfmpeg(ffmpegPath);
  const { spawn } = await import("node:child_process");
  return new Promise((resolve, reject) => {
    const proc = spawn(
      probe,
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name,width,height,pix_fmt,color_range",
        "-of",
        "json",
        filePath,
      ],
      { windowsHide: true }
    );
    let stdout = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("ffprobe failed"));
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as {
          streams?: Array<{
            codec_name?: string;
            width?: number;
            height?: number;
            pix_fmt?: string;
            color_range?: string;
          }>;
        };
        const s = parsed.streams?.[0];
        if (!s?.codec_name || !s.width || !s.height || !s.pix_fmt) {
          reject(new Error("Incomplete ffprobe stream data"));
          return;
        }
        resolve({
          codec: s.codec_name,
          width: s.width,
          height: s.height,
          pixFmt: s.pix_fmt,
          colorRange: s.color_range,
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

/** Validate a Samsung_Slideshows album folder (JPEG folder + optional MP4). */
export async function probeSamsungAlbum(albumDir: string): Promise<TvProbeReport> {
  const checks: TvProbeCheck[] = [];
  let manifest: ExportManifest | undefined;
  let expectedW = 1920;
  let expectedH = 1080;

  const manifestPath = path.join(albumDir, "slideshow_manifest.json");
  if (await fileExists(manifestPath)) {
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as ExportManifest;
      expectedW = manifest.preset.width;
      expectedH = manifest.preset.height;
      checks.push(check("manifest-json", true, `preset=${manifest.preset.id} ${expectedW}x${expectedH}`));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      checks.push(check("manifest-json", false, msg));
    }
  } else {
    checks.push(check("manifest-json", false, "missing slideshow_manifest.json"));
  }

  const readmeOk = await fileExists(path.join(albumDir, "README_TV_INSTRUCTIONS.txt"));
  checks.push(
    check("readme-tv-instructions", readmeOk, readmeOk ? "present" : "missing README_TV_INSTRUCTIONS.txt")
  );

  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(albumDir);
  const jpegs = entries.filter((f) => NUMBERED_JPEG.test(f)).sort();
  checks.push(
    check("numbered-jpegs", jpegs.length > 0, jpegs.length > 0 ? `${jpegs.length} files` : "no 000001.jpg …")
  );

  if (jpegs.length > 0) {
    const sample = path.join(albumDir, jpegs[0]);
    try {
      const meta = await sharp(sample).metadata();
      const isJpeg = meta.format === "jpeg" || meta.format === "jpg";
      checks.push(check("jpeg-format", isJpeg, `format=${meta.format ?? "unknown"}`));
      const dimOk = (meta.width ?? 0) === expectedW && (meta.height ?? 0) === expectedH;
      checks.push(
        check(
          "jpeg-dimensions",
          dimOk,
          `${meta.width}x${meta.height} (expected ${expectedW}x${expectedH})`
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      checks.push(check("jpeg-format", false, msg));
    }
  }

  const mp4Path = path.join(albumDir, MP4_NAME);
  const hasMp4 = await fileExists(mp4Path);
  if (hasMp4) {
    const ff = await detectFfmpeg();
    if (!ff.installed || !ff.path) {
      checks.push(check("mp4-ffmpeg", false, "FFmpeg not available for probe"));
    } else {
      try {
        const pix = await probeMp4PixelFormat(mp4Path, ff.path);
        checks.push(check("mp4-pix-fmt-yuv420p", pix === "yuv420p", `pix_fmt=${pix}`));
        const stream = await probeMp4Stream(mp4Path, ff.path);
        checks.push(check("mp4-codec-h264", stream.codec === "h264", `codec=${stream.codec}`));
        const dimOk = stream.width === expectedW && stream.height === expectedH;
        checks.push(
          check("mp4-dimensions", dimOk, `${stream.width}x${stream.height} (expected ${expectedW}x${expectedH})`)
        );
        if (stream.colorRange) {
          checks.push(
            check(
              "mp4-color-range-tv",
              stream.colorRange === "tv" || stream.colorRange === "unknown",
              `color_range=${stream.colorRange}`
            )
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        checks.push(check("mp4-probe", false, msg));
      }
    }
  }

  const ok = checks.every((c) => c.ok);
  return {
    albumDir,
    ok,
    checks,
    jpegCount: jpegs.length,
    hasMp4,
    manifestPreset: manifest
      ? { width: manifest.preset.width, height: manifest.preset.height, id: manifest.preset.id }
      : undefined,
  };
}

/** Throw if probe fails — for E2E integration. */
export async function assertSamsungAlbum(albumDir: string): Promise<string> {
  const report = await probeSamsungAlbum(albumDir);
  if (report.ok) {
    const parts = [`${report.jpegCount} JPEGs`];
    if (report.hasMp4) parts.push("MP4 OK");
    return parts.join(", ");
  }
  const failed = report.checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail ?? "fail"}`);
  throw new Error(failed.join("; "));
}
