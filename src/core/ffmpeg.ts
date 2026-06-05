/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [IO] FFmpeg MP4 Encoder
 * ───────────────────────────────────────────────────────────────────────────
 * @file     ffmpeg.ts
 * @purpose  Detect FFmpeg on PATH; render H.264/AAC slideshow MP4
 * @layer    IO
 * @depends  types (SlideshowPreset)
 * @consumers exporter.node, doctor.node, e2e
 * @status   ELITE ✅
 * @see      docs/PIPELINE.md § Stage 5
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import type { SlideshowPreset, TransitionMode } from "./types";

export interface FfmpegInfo {
  installed: boolean;
  version?: string;
  path?: string;
}

export async function detectFfmpeg(customPath?: string): Promise<FfmpegInfo> {
  const candidates = [
    customPath,
    process.env.FFMPEG_PATH,
    "ffmpeg",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
  ].filter(Boolean) as string[];

  for (const bin of candidates) {
    try {
      const version = await runCommand(bin, ["-version"]);
      const firstLine = version.stdout.split("\n")[0] ?? "";
      return { installed: true, version: firstLine, path: bin };
    } catch {
      continue;
    }
  }
  return { installed: false };
}

function runCommand(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `Exit ${code}`));
    });
  });
}

export async function renderSlideshowMp4(params: {
  ffmpegPath: string;
  framesDir: string;
  outputPath: string;
  preset: SlideshowPreset;
  transition: TransitionMode;
  musicPath?: string;
  /** When frames are pre-expanded at preset.fps (per-slide durations), pass preset.fps. */
  framesInputFps?: number;
  onLog?: (msg: string) => void;
}): Promise<void> {
  const { ffmpegPath, framesDir, outputPath, preset, transition, musicPath, framesInputFps, onLog } = params;
  await access(framesDir);

  const fps = preset.fps;
  const inputFps = framesInputFps ?? 1 / preset.slideDurationSeconds;
  const inputPattern = path.join(framesDir, "%06d.jpg");

  const fadeDuration = transition === "none" ? 0 : transition === "crossfade" ? 0.5 : 0.8;
  const bitrate = `${preset.bitrateMbps}M`;

  const args: string[] = [
    "-y",
    "-framerate",
    String(inputFps),
    "-i",
    inputPattern,
    "-vf",
    buildVideoFilter(preset.width, preset.height, fps, fadeDuration, transition),
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-pix_fmt",
    "yuv420p",
    "-color_range",
    "tv",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-b:v",
    bitrate,
    "-r",
    String(fps),
    "-movflags",
    "+faststart",
  ];

  if (musicPath) {
    args.push("-i", musicPath, "-c:a", "aac", "-b:a", "192k", "-shortest");
  } else {
    args.push("-an");
  }

  args.push(outputPath);

  onLog?.(`[ffmpeg] ${ffmpegPath} ${args.join(" ")}`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    proc.stderr.on("data", (d) => {
      const line = d.toString().trim();
      if (line) onLog?.(`[ffmpeg] ${line}`);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

function buildVideoFilter(
  width: number,
  height: number,
  fps: number,
  fadeDuration: number,
  transition: TransitionMode
): string {
  const scale = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;
  const samsungFmt = "format=yuv420p";
  if (transition === "none" || fadeDuration <= 0) {
    return `${scale},fps=${fps},${samsungFmt}`;
  }
  if (transition === "fade-to-black") {
    return `${scale},fps=${fps},fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${fadeDuration}:d=${fadeDuration},${samsungFmt}`;
  }
  return `${scale},fps=${fps},fade=t=in:st=0:d=${fadeDuration},${samsungFmt}`;
}

/** Resolve ffprobe binary adjacent to ffmpeg. */
export function ffprobePathFromFfmpeg(ffmpegPath: string): string {
  return ffmpegPath.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");
}

export async function probeMp4PixelFormat(filePath: string, ffmpegPath?: string): Promise<string> {
  const ff = await detectFfmpeg(ffmpegPath);
  if (!ff.installed || !ff.path) throw new Error("FFmpeg required for ffprobe");
  const probe = ffprobePathFromFfmpeg(ff.path);
  const { stdout } = await runCommand(probe, [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=pix_fmt",
    "-of",
    "csv=p=0",
    filePath,
  ]);
  const pix = stdout.trim().split("\n")[0]?.trim();
  if (!pix) throw new Error("Could not read pix_fmt from ffprobe");
  return pix;
}
