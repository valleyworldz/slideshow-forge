/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { STORAGE_KEYS } from "./constants";
import type { CardGridDensity, HistoryItem, SlideshowPreset } from "./types";

export interface PersistedSettings {
  preset: SlideshowPreset;
  backgroundMode: "black-bars" | "blurred-fill" | "crop-fill";
  musicEnabled: boolean;
  musicTrackId: string;
  musicPath?: string;
  albumName: string;
  cardGridDensity: CardGridDensity;
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items.slice(0, 50)));
}

export function loadSettings(): Partial<PersistedSettings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? (JSON.parse(raw) as PersistedSettings) : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: PersistedSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}
