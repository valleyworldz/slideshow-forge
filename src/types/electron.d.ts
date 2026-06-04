/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BackgroundMode, DoctorReport, ExportMode, ExportResult, PhotoAsset, SlideshowPreset } from "../core/types";
import type { ScanOptions } from "../core/types";

export type { ScanOptions };

export interface ScanStats {
  total: number;
  ready: number;
  duplicate: number;
  unsupported: number;
}

export interface WorkspaceLoadResult {
  folder: string;
  photos: PhotoAsset[];
  stats: ScanStats;
  fromProject: boolean;
}

export interface AppPaths {
  projectRoot: string;
  workspacePhotos: string;
  workspaceProject: string;
  defaultOutput: string;
}

export interface ExportPayload {
  photos: PhotoAsset[];
  preset: SlideshowPreset;
  backgroundMode: BackgroundMode;
  mode: ExportMode;
  albumName: string;
  outputDir: string;
  inputFolder: string;
  musicEnabled: boolean;
  musicPath?: string;
}

export interface SlideshowForgeElectronApi {
  isElectron: true;
  getPaths: () => Promise<AppPaths>;
  doctor: () => Promise<DoctorReport>;
  loadWorkspace: () => Promise<WorkspaceLoadResult>;
  saveWorkspace: (payload: {
    photos: PhotoAsset[];
    preset: SlideshowPreset;
    backgroundMode: BackgroundMode;
    musicEnabled: boolean;
    musicTrackId: string;
    albumName: string;
  }) => Promise<boolean>;
  scanFolder: (folderPath: string, options: ScanOptions) => Promise<{ photos: PhotoAsset[]; stats: ScanStats }>;
  pickFolder: () => Promise<string | null>;
  pickOutputDirectory: () => Promise<string | null>;
  pickMusicFile: () => Promise<string | null>;
  exportSlideshow: (payload: ExportPayload) => Promise<{ result: ExportResult; logs: string[] }>;
  openPath: (targetPath: string) => Promise<void>;
  showItemInFolder: (targetPath: string) => Promise<void>;
  onExportLog: (callback: (message: string) => void) => () => void;
  onExportProgress: (callback: (percent: number) => void) => () => void;
}

declare global {
  interface Window {
    slideshowForge?: SlideshowForgeElectronApi;
  }
}

export {};
