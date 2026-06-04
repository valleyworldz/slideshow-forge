/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BackgroundMode,
  CardAspectRatio,
  CardFrameMode,
  CardGridDensity,
  PhotoAsset,
} from "./types";

export const FRAME_MODE_LABELS: Record<CardFrameMode, string> = {
  default: "Default (global)",
  "black-bars": "Letterbox",
  "blurred-fill": "Blur fill",
  "crop-fill": "Crop fill",
};

export const ASPECT_LABELS: Record<CardAspectRatio, string> = {
  "16:9": "16:9 TV",
  "4:3": "4:3 Classic",
  "1:1": "1:1 Square",
  original: "Original ratio",
};

export const GRID_DENSITY_CLASSES: Record<CardGridDensity, string> = {
  compact: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3",
  normal: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  large: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8",
};

export const THUMB_ASPECT_CLASS: Record<CardAspectRatio, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  original: "aspect-auto min-h-[140px]",
};

export function resolveFrameMode(photo: PhotoAsset, global: BackgroundMode): BackgroundMode {
  const m = photo.frameMode ?? "default";
  if (m === "default") return global;
  return m;
}

export function resolveAspectRatio(photo: PhotoAsset): CardAspectRatio {
  return photo.aspectRatio ?? "16:9";
}

/** Inner content size + full TV canvas (letterbox padding when inner is smaller). */
export function resolveExportDimensions(
  canvasWidth: number,
  canvasHeight: number,
  aspect: CardAspectRatio
): { width: number; height: number; canvasWidth: number; canvasHeight: number } {
  const cw = canvasWidth;
  const ch = canvasHeight;

  switch (aspect) {
    case "4:3": {
      const h = ch;
      const w = Math.min(Math.round((h * 4) / 3), cw);
      return { width: w, height: h, canvasWidth: cw, canvasHeight: ch };
    }
    case "1:1": {
      const s = Math.min(cw, ch);
      return { width: s, height: s, canvasWidth: cw, canvasHeight: ch };
    }
    case "original":
      return { width: cw, height: ch, canvasWidth: cw, canvasHeight: ch };
    case "16:9":
    default:
      return { width: cw, height: ch, canvasWidth: cw, canvasHeight: ch };
  }
}

export function buildNormalizeOptionsForPhoto(
  photo: PhotoAsset,
  presetWidth: number,
  presetHeight: number,
  globalBackground: BackgroundMode
) {
  const aspect = resolveAspectRatio(photo);
  const dims = resolveExportDimensions(presetWidth, presetHeight, aspect);
  return {
    ...dims,
    backgroundMode: resolveFrameMode(photo, globalBackground),
    quality: 90,
  };
}

export const SLIDE_DURATION_PRESETS = [3, 5, 8, 10, 15] as const;

export function resolveSlideDuration(photo: PhotoAsset, defaultSeconds: number): number {
  const v = photo.slideDurationSeconds;
  if (v !== undefined && v > 0 && v <= 300) return v;
  return defaultSeconds;
}

export function patchPhoto(
  photo: PhotoAsset,
  patch: Partial<Pick<PhotoAsset, "frameMode" | "aspectRatio" | "slideDurationSeconds">>
): PhotoAsset {
  const next = { ...photo, ...patch };
  if (patch.slideDurationSeconds === undefined && "slideDurationSeconds" in patch) {
    delete next.slideDurationSeconds;
  }
  return next;
}
