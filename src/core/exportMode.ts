/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExportMode, SlideshowPreset } from "./types";

/** Map settings preset tile → default export mode. */
export function defaultExportModeForPreset(presetId: SlideshowPreset["id"]): ExportMode {
  if (presetId === "photo-folder-only") return "folder";
  return "both";
}

export function allowedExportModesForPreset(presetId: SlideshowPreset["id"]): ExportMode[] {
  if (presetId === "photo-folder-only") return ["folder"];
  return ["folder", "mp4", "both"];
}

export function clampExportMode(presetId: SlideshowPreset["id"], mode: ExportMode): ExportMode {
  const allowed = allowedExportModesForPreset(presetId);
  if (allowed.includes(mode)) return mode;
  return allowed[0];
}
