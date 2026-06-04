/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { STORAGE_KEYS } from "./constants";
import type { CardAspectRatio, CardFrameMode, PhotoAsset } from "./types";

export interface PhotoEditOverride {
  frameMode?: CardFrameMode;
  aspectRatio?: CardAspectRatio;
  slideDurationSeconds?: number;
  orientation?: number;
}

export interface PersistedPhotoSession {
  order: string[];
  overrides: Record<string, PhotoEditOverride>;
  savedAt: string;
}

let memorySession: string | null = null;

function readRaw(): string | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(STORAGE_KEYS.project);
    return memorySession;
  } catch {
    return memorySession;
  }
}

function writeRaw(value: string): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEYS.project, value);
    else memorySession = value;
  } catch {
    memorySession = value;
  }
}

function removeRaw(): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEYS.project);
    else memorySession = null;
  } catch {
    memorySession = null;
  }
}

export function loadPhotoSession(): PersistedPhotoSession | null {
  try {
    const raw = readRaw();
    return raw ? (JSON.parse(raw) as PersistedPhotoSession) : null;
  } catch {
    return null;
  }
}

export function savePhotoSession(photos: PhotoAsset[]): void {
  const ready = photos.filter((p) => p.status === "ready");
  const session: PersistedPhotoSession = {
    order: ready.map((p) => p.filename),
    overrides: {},
    savedAt: new Date().toISOString(),
  };
  for (const p of ready) {
    if (
      p.frameMode ||
      p.aspectRatio ||
      p.slideDurationSeconds !== undefined ||
      (p.orientation && p.orientation !== 1)
    ) {
      session.overrides[p.filename] = {
        frameMode: p.frameMode,
        aspectRatio: p.aspectRatio,
        slideDurationSeconds: p.slideDurationSeconds,
        orientation: p.orientation,
      };
    }
  }
  writeRaw(JSON.stringify(session));
}

export function clearPhotoSession(): void {
  removeRaw();
}

export function applyPersistedEdits(photos: PhotoAsset[]): PhotoAsset[] {
  const session = loadPhotoSession();
  if (!session) return photos;

  const withEdits = photos.map((p) => {
    const o = session.overrides[p.filename];
    if (!o) return p;
    return {
      ...p,
      ...(o.frameMode !== undefined ? { frameMode: o.frameMode } : {}),
      ...(o.aspectRatio !== undefined ? { aspectRatio: o.aspectRatio } : {}),
      ...(o.slideDurationSeconds !== undefined ? { slideDurationSeconds: o.slideDurationSeconds } : {}),
      ...(o.orientation !== undefined ? { orientation: o.orientation } : {}),
    };
  });

  if (session.order.length === 0) return withEdits;

  const rank = new Map(session.order.map((name, i) => [name, i]));
  return [...withEdits].sort((a, b) => {
    const ra = rank.get(a.filename) ?? 9999;
    const rb = rank.get(b.filename) ?? 9999;
    return ra - rb;
  });
}

export function revokePhotoObjectUrls(photos: PhotoAsset[]): void {
  for (const p of photos) {
    if (p.originalPath.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(p.originalPath);
      } catch {
        /* ignore */
      }
    }
  }
}
