/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlideshowPreset } from "./types";

export const PRESET_DEFINITIONS: Record<
  SlideshowPreset["id"],
  Omit<SlideshowPreset, "slideDurationSeconds" | "transition">
> = {
  "samsung-safe-1080p": {
    id: "samsung-safe-1080p",
    label: "Samsung Safe 1080p",
    width: 1920,
    height: 1080,
    fps: 30,
    videoCodec: "h264",
    audioCodec: "aac",
    bitrateMbps: 10,
  },
  "samsung-4k": {
    id: "samsung-4k",
    label: "Samsung 4K Premium",
    width: 3840,
    height: 2160,
    fps: 30,
    videoCodec: "h264",
    audioCodec: "aac",
    bitrateMbps: 30,
  },
  "photo-folder-only": {
    id: "photo-folder-only",
    label: "Numbered Photo Album Folder",
    width: 1920,
    height: 1080,
    fps: 30,
    videoCodec: "h264",
    audioCodec: "aac",
    bitrateMbps: 0,
  },
  both: {
    id: "both",
    label: "Video + Photo Folder",
    width: 1920,
    height: 1080,
    fps: 30,
    videoCodec: "h264",
    audioCodec: "aac",
    bitrateMbps: 10,
  },
};

export function createPreset(
  id: SlideshowPreset["id"],
  overrides?: Partial<Pick<SlideshowPreset, "slideDurationSeconds" | "transition" | "bitrateMbps">>
): SlideshowPreset {
  const base = PRESET_DEFINITIONS[id];
  return {
    ...base,
    slideDurationSeconds: overrides?.slideDurationSeconds ?? 5,
    transition: overrides?.transition ?? "crossfade",
    bitrateMbps: overrides?.bitrateMbps ?? base.bitrateMbps,
  };
}

export const DEFAULT_PRESET = createPreset("samsung-safe-1080p");
