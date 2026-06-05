/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [IO] Export Orchestrator
 * ───────────────────────────────────────────────────────────────────────────
 * @file     exporter.node.ts
 * @purpose  Single entry for disk export: JPEG normalize → MP4 → manifest
 * @layer    IO
 * @depends  processor.node, ffmpeg, manifest, cardFormat, concurrency.node
 * @consumers cli/index, electron/main, server/index
 * @status   ELITE ✅
 * @see      docs/PIPELINE.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultNormalizeConcurrency, mapWithConcurrency } from "./concurrency.node";
import { detectFfmpeg, renderSlideshowMp4 } from "./ffmpeg";
import { buildManifest, buildReadmeTvGuide } from "./manifest";
import { buildNormalizeOptionsForPhoto, resolveSlideDuration } from "./cardFormat";
import { albumOutputPath, normalizePhotoToJpeg, numberedJpegName } from "./processor.node";
import type { NormalizeOptions } from "./processor.node";
import {
  blendSlideJpegs,
  crossfadeFrameCount,
  ffmpegTransitionForPreset,
} from "./transitions.node";
import type { ExportOptions, ExportResult, PhotoAsset } from "./types";

type SlidePlan = {
  photo: PhotoAsset;
  index: number;
  name: string;
  outPath: string;
  tmpFrame: string;
  normOpts: NormalizeOptions;
  holdFrames: number;
  cfFrames: number;
  slideSec: number;
};

function buildSlidePlans(
  ready: PhotoAsset[],
  albumDir: string,
  framesDir: string,
  options: ExportOptions,
  bakeCrossfade: boolean
): SlidePlan[] {
  return ready.map((photo, i) => {
    const slideSec = resolveSlideDuration(photo, options.preset.slideDurationSeconds);
    const slideFrames = Math.max(1, Math.round(slideSec * options.preset.fps));
    const cfFrames =
      bakeCrossfade && i < ready.length - 1
        ? Math.min(crossfadeFrameCount(options.preset.fps), Math.max(1, Math.floor(slideFrames / 3)))
        : 0;
    const holdFrames = Math.max(1, slideFrames - cfFrames);
    return {
      photo,
      index: i,
      name: numberedJpegName(i),
      outPath: path.join(albumDir, numberedJpegName(i)),
      tmpFrame: path.join(framesDir, `_src_${String(i).padStart(4, "0")}.jpg`),
      normOpts: buildNormalizeOptionsForPhoto(
        photo,
        options.preset.width,
        options.preset.height,
        options.backgroundMode
      ),
      holdFrames,
      cfFrames,
      slideSec,
    };
  });
}

export async function runExport(
  photos: PhotoAsset[],
  options: ExportOptions
): Promise<ExportResult> {
  const log = options.onLog ?? (() => {});
  const progress = options.onProgress ?? (() => {});
  const errors: string[] = [];
  const ready = photos.filter((p) => p.status === "ready");
  const totalStart = performance.now();
  const concurrency = options.normalizeConcurrency ?? defaultNormalizeConcurrency();

  if (ready.length === 0) {
    return {
      success: false,
      outputDir: options.outputDir,
      manifest: buildManifest({
        inputFolder: options.inputFolder,
        outputFolder: options.outputDir,
        photos,
        readyCount: 0,
        preset: options.preset,
        outputFiles: [],
        exportMode: options.mode,
        backgroundMode: options.backgroundMode,
      }),
      files: [],
      errors: ["No ready photos to export."],
    };
  }

  const albumDir = albumOutputPath(options.outputDir, options.albumName);
  const framesDir = path.join(albumDir, "_frames");
  await rm(albumDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  log(`Output: ${albumDir}`);
  log(`Mode: ${options.mode} | ${ready.length} photos | normalize concurrency: ${concurrency}`);

  const outputFiles: string[] = [];
  const tempFrames: string[] = [];
  let frameSeq = 0;

  const needVideo = options.mode === "mp4" || options.mode === "both";
  const bakeCrossfade = needVideo && options.preset.transition === "crossfade";
  const plans = buildSlidePlans(ready, albumDir, framesDir, options, bakeCrossfade);
  const normalizedOk = new Set<number>();

  const normalizeStart = performance.now();
  let normalizeDone = 0;

  await mapWithConcurrency(plans, concurrency, async (plan) => {
    const { photo, index } = plan;
    const fmt = photo.frameMode && photo.frameMode !== "default" ? ` [${photo.frameMode}]` : "";
    const asp = photo.aspectRatio && photo.aspectRatio !== "16:9" ? ` ${photo.aspectRatio}` : "";
    const dur =
      photo.slideDurationSeconds !== undefined &&
      photo.slideDurationSeconds !== options.preset.slideDurationSeconds
        ? ` ${plan.slideSec}s`
        : "";
    log(`[${index + 1}/${ready.length}] ${photo.filename}${fmt}${asp}${dur}`);
    try {
      await normalizePhotoToJpeg(photo, plan.outPath, plan.normOpts);
      await copyFile(plan.outPath, plan.tmpFrame);
      normalizedOk.add(index);
      tempFrames.push(plan.tmpFrame);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${photo.filename}: ${msg}`);
      log(`⚠ Failed: ${photo.filename} — ${msg}`);
    } finally {
      normalizeDone++;
      progress(Math.floor((normalizeDone / plans.length) * 50));
    }
  });

  const normalizeMs = Math.round(performance.now() - normalizeStart);
  log(`⏱ Normalize phase: ${normalizeMs}ms (${ready.length} photos, concurrency ${concurrency})`);

  const framesStart = performance.now();

  for (const plan of plans) {
    if (!normalizedOk.has(plan.index)) continue;

    try {
      for (let c = 0; c < plan.holdFrames; c++) {
        frameSeq++;
        await copyFile(plan.tmpFrame, path.join(framesDir, `${String(frameSeq).padStart(6, "0")}.jpg`));
      }

      if (plan.cfFrames > 0 && plan.index < plans.length - 1) {
        const nextPlan = plans[plan.index + 1];
        if (normalizedOk.has(nextPlan.index)) {
          for (let k = 1; k <= plan.cfFrames; k++) {
            const blended = await blendSlideJpegs(plan.tmpFrame, nextPlan.tmpFrame, k / plan.cfFrames);
            frameSeq++;
            await writeFile(path.join(framesDir, `${String(frameSeq).padStart(6, "0")}.jpg`), blended);
          }
        }
      }

      outputFiles.push(plan.name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${plan.photo.filename}: ${msg}`);
      log(`⚠ Frame assembly failed: ${plan.photo.filename} — ${msg}`);
    }

    const assembled = plans.filter((p) => normalizedOk.has(p.index) && p.index <= plan.index).length;
    progress(50 + Math.floor((assembled / plans.length) * 20));
  }

  const framesMs = Math.round(performance.now() - framesStart);

  const needFolder = options.mode === "folder" || options.mode === "both";

  if (!needFolder && needVideo) {
    for (const f of outputFiles) {
      await rm(path.join(albumDir, f), { force: true });
    }
  }

  let encodeMs = 0;

  if (needVideo) {
    const ffmpeg = await detectFfmpeg();
    if (!ffmpeg.installed || !ffmpeg.path) {
      errors.push("FFmpeg not found. Install ffmpeg and ensure it is on PATH.");
      log("🛑 FFmpeg required for MP4 export. Run: slideshow-forge doctor");
    } else {
      const mp4Path = path.join(albumDir, "Samsung_Slideshow_Video.mp4");
      log("🎥 Encoding MP4 with FFmpeg...");
      const encodeStart = performance.now();
      try {
        await renderSlideshowMp4({
          ffmpegPath: ffmpeg.path,
          framesDir,
          outputPath: mp4Path,
          preset: options.preset,
          transition: ffmpegTransitionForPreset(options.preset.transition),
          framesInputFps: options.preset.fps,
          musicPath: options.musicEnabled ? options.musicPath : undefined,
          onLog: log,
        });
        outputFiles.push("Samsung_Slideshow_Video.mp4");
        log("✓ MP4 written");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`MP4 encode failed: ${msg}`);
        log(`🛑 MP4 failed: ${msg}`);
      }
      encodeMs = Math.round(performance.now() - encodeStart);
      log(`⏱ Encode phase: ${encodeMs}ms`);
    }
    progress(90);
  }

  for (const tmp of tempFrames) {
    await rm(tmp, { force: true });
  }
  await rm(framesDir, { recursive: true, force: true });

  const manifest = buildManifest({
    inputFolder: options.inputFolder,
    outputFolder: albumDir,
    photos,
    readyCount: outputFiles.filter((f) => f.endsWith(".jpg")).length || ready.length,
    preset: options.preset,
    outputFiles,
    exportMode: options.mode,
    backgroundMode: options.backgroundMode,
    musicTrack: options.musicEnabled ? options.musicPath : undefined,
  });

  await writeFile(path.join(albumDir, "slideshow_manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(
    path.join(albumDir, "README_TV_INSTRUCTIONS.txt"),
    buildReadmeTvGuide({
      albumName: options.albumName,
      preset: options.preset,
      exportMode: options.mode,
      outputFolder: albumDir,
    })
  );

  const totalMs = Math.round(performance.now() - totalStart);
  const timing = {
    normalizeMs,
    framesMs,
    encodeMs,
    totalMs,
    photoCount: ready.length,
    concurrency,
  };

  progress(100);
  log(
    `⏱ Export timing — normalize ${normalizeMs}ms | frames ${framesMs}ms | encode ${encodeMs}ms | total ${totalMs}ms`
  );
  log("✨ Export complete");

  return {
    success: errors.length === 0,
    outputDir: albumDir,
    manifest,
    files: outputFiles,
    errors,
    timing,
  };
}
