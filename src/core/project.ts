/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFile, writeFile } from "node:fs/promises";
import { APP_VERSION } from "./constants";
import { DEFAULT_PRESET } from "./presets";
import type { SlideshowProject } from "./types";

export async function loadProject(filePath: string): Promise<SlideshowProject> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as SlideshowProject;
}

export async function saveProject(filePath: string, project: SlideshowProject): Promise<void> {
  project.updatedAt = new Date().toISOString();
  await writeFile(filePath, JSON.stringify(project, null, 2), "utf-8");
}

export function createEmptyProject(inputFolder: string, name: string): SlideshowProject {
  const now = new Date().toISOString();
  return {
    version: APP_VERSION,
    name,
    createdAt: now,
    updatedAt: now,
    inputFolder,
    photos: [],
    preset: DEFAULT_PRESET,
    backgroundMode: "blurred-fill",
    musicEnabled: false,
    musicTrackId: "nature",
  };
}
