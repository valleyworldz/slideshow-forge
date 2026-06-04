/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AppPaths, ExportPayload, ScanOptions, WorkspaceLoadResult } from "../types/electron";

export function isElectron(): boolean {
  return typeof window !== "undefined" && window.slideshowForge?.isElectron === true;
}

export function getElectronApi() {
  if (!isElectron()) return null;
  return window.slideshowForge!;
}

export async function electronGetPaths(): Promise<AppPaths | null> {
  return (await getElectronApi()?.getPaths()) ?? null;
}

export async function electronLoadWorkspace(): Promise<WorkspaceLoadResult | null> {
  return (await getElectronApi()?.loadWorkspace()) ?? null;
}

export interface WorkspaceSavePayload {
  photos: import("../types").PhotoAsset[];
  preset: import("../types").SlideshowPreset;
  backgroundMode: import("../types").BackgroundMode;
  musicEnabled: boolean;
  musicTrackId: string;
  albumName: string;
}

export async function electronSaveWorkspace(payload: WorkspaceSavePayload): Promise<boolean> {
  return (await getElectronApi()?.saveWorkspace(payload)) ?? false;
}

export async function electronScanFolder(folderPath: string, options: ScanOptions) {
  const api = getElectronApi();
  if (!api) return null;
  return api.scanFolder(folderPath, options);
}

export async function electronPickFolder(): Promise<string | null> {
  return (await getElectronApi()?.pickFolder()) ?? null;
}

export async function electronPickOutput(): Promise<string | null> {
  return (await getElectronApi()?.pickOutputDirectory()) ?? null;
}

export async function electronPickMusic(): Promise<string | null> {
  return (await getElectronApi()?.pickMusicFile()) ?? null;
}

export async function electronExport(payload: ExportPayload, handlers?: { onLog?: (m: string) => void; onProgress?: (n: number) => void }) {
  const api = getElectronApi();
  if (!api) return null;

  const unsubLog = handlers?.onLog ? api.onExportLog(handlers.onLog) : undefined;
  const unsubProg = handlers?.onProgress ? api.onExportProgress(handlers.onProgress) : undefined;
  try {
    return await api.exportSlideshow(payload);
  } finally {
    unsubLog?.();
    unsubProg?.();
  }
}

export async function electronDoctor() {
  return (await getElectronApi()?.doctor()) ?? null;
}

export async function electronRevealOutput(outputDir: string) {
  const api = getElectronApi();
  if (!api) return;
  await api.showItemInFolder(outputDir);
}
