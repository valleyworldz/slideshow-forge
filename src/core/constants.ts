/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [CORE] App Constants
 * ───────────────────────────────────────────────────────────────────────────
 * @file     constants.ts
 * @purpose  APP_VERSION, APP_NAME — must sync with package.json + metadata.json
 * @layer    CORE
 * @depends  none
 * @consumers all layers, consistency-audit
 * @status   ELITE ✅
 * @see      docs/METADATA_CONVENTIONS.md § Version Sync
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const APP_VERSION = "3.0.0";
export const APP_NAME = "Slideshow Forge";

export const SUPPORTED_EXTENSIONS = new Set([
  "JPG",
  "JPEG",
  "PNG",
  "HEIC",
  "HEIF",
  "WEBP",
  "BMP",
  "GIF",
  "TIFF",
  "TIF",
]);

export const IMAGE_GLOB = "**/*.{jpg,jpeg,png,heic,heif,webp,bmp,gif,tiff,tif}";

export const DEFAULT_PRESET_ID = "samsung-safe-1080p" as const;

export const STORAGE_KEYS = {
  history: "slideshow-forge-history-v3",
  project: "slideshow-forge-project-v3",
  settings: "slideshow-forge-settings-v3",
} as const;
