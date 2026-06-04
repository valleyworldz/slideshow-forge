/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PhotoStatus = "ready" | "unsupported" | "duplicate" | "error";
export type BackgroundMode = "black-bars" | "blurred-fill" | "crop-fill";
export type CardFrameMode = "default" | "black-bars" | "blurred-fill" | "crop-fill";
export type CardAspectRatio = "16:9" | "4:3" | "1:1" | "original";
export type CardGridDensity = "compact" | "normal" | "large";
export type ExportMode = "folder" | "mp4" | "both";
export type TransitionMode = "none" | "crossfade" | "fade-to-black";

export interface PhotoAsset {
  id: string;
  originalPath: string;
  /** Browser-only reference for API/CLI handoff; omitted from saved projects */
  sourceFile?: File;
  filename: string;
  extension: string;
  width?: number;
  height?: number;
  dateTaken?: string;
  dateModified: string;
  orientation?: number;
  hash?: string;
  status: "ready" | "unsupported" | "duplicate" | "error";
  warnings: string[];
  fileSize?: number;
  /** Per-card frame; `default` uses global slideshow background */
  frameMode?: CardFrameMode;
  /** Per-card aspect inside TV canvas */
  aspectRatio?: CardAspectRatio;
  /** Optional override seconds for this slide (MP4 timing hint) */
  slideDurationSeconds?: number;
}

export interface SlideshowPreset {
  id: "samsung-safe-1080p" | "samsung-4k" | "photo-folder-only" | "both";
  label: string;
  width: number;
  height: number;
  fps: 30;
  slideDurationSeconds: number;
  transition: TransitionMode;
  videoCodec: "h264";
  audioCodec: "aac";
  bitrateMbps: number;
}

export interface ManifestSlideEntry {
  index: number;
  filename: string;
  frameMode?: CardFrameMode;
  aspectRatio?: CardAspectRatio;
  slideDurationSeconds?: number;
}

export interface ExportManifest {
  appVersion: string;
  createdAt: string;
  inputFolder: string;
  outputFolder: string;
  totalFound: number;
  totalExported: number;
  skipped: {
    duplicates: number;
    unsupported: number;
    errors: number;
  };
  preset: SlideshowPreset;
  outputFiles: string[];
  /** Ordered export sequence with per-card formatting (MP4 honors durations; TV folder uses TV timing). */
  sequence?: ManifestSlideEntry[];
  usbFormat?: string;
  exportMode: ExportMode;
  backgroundMode: BackgroundMode;
  musicTrack?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  name: string;
  preset: string;
  photosCount: number;
  outputType: ExportMode;
  usbTarget: string;
  manifest: ExportManifest;
}

export interface ScanOptions {
  recursive: boolean;
  dedupe: boolean;
  fixRotation: boolean;
  autoConvert: boolean;
}

export interface ExportOptions {
  outputDir: string;
  albumName: string;
  mode: ExportMode;
  preset: SlideshowPreset;
  backgroundMode: BackgroundMode;
  musicPath?: string;
  musicEnabled: boolean;
  inputFolder: string;
  onLog?: (message: string) => void;
  onProgress?: (percent: number) => void;
}

export interface ExportResult {
  success: boolean;
  outputDir: string;
  manifest: ExportManifest;
  files: string[];
  errors: string[];
}

export interface SlideshowProject {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  inputFolder: string;
  photos: PhotoAsset[];
  preset: SlideshowPreset;
  backgroundMode: BackgroundMode;
  musicEnabled: boolean;
  musicTrackId: string;
  musicPath?: string;
}

export interface DoctorReport {
  ok: boolean;
  ffmpeg: { installed: boolean; version?: string; path?: string };
  sharp: { ok: boolean; heic: boolean };
  node: string;
  platform: string;
  messages: string[];
}

export interface CliJsonResponse<T> {
  ok: boolean;
  command: string;
  data?: T;
  error?: string;
}
