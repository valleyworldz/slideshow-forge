/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import sharp from "sharp";
import path from "node:path";
import type { BackgroundMode, PhotoAsset } from "./types";

export interface NormalizeOptions {
  width: number;
  height: number;
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundMode: BackgroundMode;
  quality?: number;
}

function rotationFromExif(orientation: number): number | undefined {
  switch (orientation) {
    case 3:
      return 180;
    case 6:
      return 90;
    case 8:
      return 270;
    default:
      return undefined;
  }
}

async function renderInner(
  input: string,
  rot: number | undefined,
  width: number,
  height: number,
  backgroundMode: BackgroundMode,
  quality: number
): Promise<Buffer> {
  let pipeline = sharp(input, { failOn: "none" });
  if (rot) pipeline = pipeline.rotate(rot);
  else pipeline = pipeline.rotate();

  if (backgroundMode === "crop-fill") {
    return pipeline.resize(width, height, { fit: "cover", position: "centre" }).jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  if (backgroundMode === "black-bars") {
    return pipeline
      .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  const blurredBg = await sharp(input, { failOn: "none" })
    .rotate(rot ?? 0)
    .resize(width, height, { fit: "cover" })
    .blur(18)
    .modulate({ brightness: 0.65 })
    .toBuffer();

  const contained = await sharp(input, { failOn: "none" })
    .rotate(rot ?? 0)
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp(blurredBg)
    .composite([{ input: contained, gravity: "centre" }])
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

export async function normalizePhotoToJpeg(
  photo: PhotoAsset,
  outputPath: string,
  options: NormalizeOptions
): Promise<void> {
  const { width, height, backgroundMode, quality = 90 } = options;
  const canvasW = options.canvasWidth ?? width;
  const canvasH = options.canvasHeight ?? height;
  const rot = rotationFromExif(photo.orientation ?? 1);

  const inner = await renderInner(photo.originalPath, rot, width, height, backgroundMode, quality);

  if (canvasW === width && canvasH === height) {
    await sharp(inner).toFile(outputPath);
    return;
  }

  await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([{ input: inner, gravity: "centre" }])
    .jpeg({ quality, mozjpeg: true })
    .toFile(outputPath);
}

export async function getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
  const meta = await sharp(filePath, { failOn: "none" }).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

export function numberedJpegName(index: number): string {
  return `${String(index + 1).padStart(6, "0")}.jpg`;
}

export function albumOutputPath(outputDir: string, albumName: string): string {
  return path.join(outputDir, "Samsung_Slideshows", albumName);
}
