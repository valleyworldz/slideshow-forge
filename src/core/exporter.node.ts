/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { detectFfmpeg, renderSlideshowMp4 } from "./ffmpeg";
import { buildManifest, buildReadmeTvGuide } from "./manifest";
import { buildNormalizeOptionsForPhoto, resolveSlideDuration } from "./cardFormat";
import { albumOutputPath, normalizePhotoToJpeg, numberedJpegName } from "./processor.node";
import type { ExportOptions, ExportResult, PhotoAsset } from "./types";

export async function runExport(
  photos: PhotoAsset[],
  options: ExportOptions
): Promise<ExportResult> {
  const log = options.onLog ?? (() => {});
  const progress = options.onProgress ?? (() => {});
  const errors: string[] = [];
  const ready = photos.filter((p) => p.status === "ready");

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
  log(`Mode: ${options.mode} | ${ready.length} photos`);

  const outputFiles: string[] = [];
  const tempFrames: string[] = [];
  let frameSeq = 0;

  for (let i = 0; i < ready.length; i++) {
    const photo = ready[i];
    const name = numberedJpegName(i);
    const outPath = path.join(albumDir, name);
    const tmpFrame = path.join(framesDir, `_src_${String(i).padStart(4, "0")}.jpg`);
    const normOpts = buildNormalizeOptionsForPhoto(
      photo,
      options.preset.width,
      options.preset.height,
      options.backgroundMode
    );
    const slideSec = resolveSlideDuration(photo, options.preset.slideDurationSeconds);
    const frameCopies = Math.max(1, Math.round(slideSec * options.preset.fps));

    try {
      const fmt = photo.frameMode && photo.frameMode !== "default" ? ` [${photo.frameMode}]` : "";
      const asp = photo.aspectRatio && photo.aspectRatio !== "16:9" ? ` ${photo.aspectRatio}` : "";
      const dur =
        photo.slideDurationSeconds !== undefined && photo.slideDurationSeconds !== options.preset.slideDurationSeconds
          ? ` ${slideSec}s`
          : "";
      log(`[${i + 1}/${ready.length}] ${photo.filename}${fmt}${asp}${dur}`);
      await normalizePhotoToJpeg(photo, outPath, normOpts);
      await normalizePhotoToJpeg(photo, tmpFrame, normOpts);
      tempFrames.push(tmpFrame);
      for (let c = 0; c < frameCopies; c++) {
        frameSeq++;
        await copyFile(tmpFrame, path.join(framesDir, `${String(frameSeq).padStart(6, "0")}.jpg`));
      }
      outputFiles.push(name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${photo.filename}: ${msg}`);
      log(`⚠ Failed: ${photo.filename} — ${msg}`);
    }
    progress(Math.floor(((i + 1) / ready.length) * 70));
  }

  const needVideo = options.mode === "mp4" || options.mode === "both";
  const needFolder = options.mode === "folder" || options.mode === "both";

  if (!needFolder && needVideo) {
    // MP4-only: keep frames in temp, remove numbered jpgs from album root
    for (const f of outputFiles) {
      await rm(path.join(albumDir, f), { force: true });
    }
  }

  if (needVideo) {
    const ffmpeg = await detectFfmpeg();
    if (!ffmpeg.installed || !ffmpeg.path) {
      errors.push("FFmpeg not found. Install ffmpeg and ensure it is on PATH.");
      log("🛑 FFmpeg required for MP4 export. Run: slideshow-forge doctor");
    } else {
      const mp4Path = path.join(albumDir, "Samsung_Slideshow_Video.mp4");
      log("🎥 Encoding MP4 with FFmpeg...");
      try {
        await renderSlideshowMp4({
          ffmpegPath: ffmpeg.path,
          framesDir,
          outputPath: mp4Path,
          preset: options.preset,
          transition: options.preset.transition,
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

  progress(100);
  log("✨ Export complete");

  return {
    success: errors.length === 0,
    outputDir: albumDir,
    manifest,
    files: outputFiles,
    errors,
  };
}
