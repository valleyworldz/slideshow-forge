/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from "node:path";
import { access } from "node:fs/promises";
import {
  WORKSPACE_DIR_NAME,
  WORKSPACE_ALBUM_NAME,
  WORKSPACE_PROJECT_FILENAME,
} from "./workspace.shared";

export { WORKSPACE_DIR_NAME, WORKSPACE_ALBUM_NAME, WORKSPACE_PROJECT_FILENAME };

/** Set by Electron main before any IPC; falls back to cwd for CLI. */
export function getProjectRoot(): string {
  return process.env.SLIDESHOW_PROJECT_ROOT ?? process.cwd();
}

export function getWorkspacePhotosDir(root = getProjectRoot()): string {
  return path.join(root, WORKSPACE_DIR_NAME);
}

export function getWorkspaceProjectPath(root = getProjectRoot()): string {
  return path.join(getWorkspacePhotosDir(root), WORKSPACE_PROJECT_FILENAME);
}

export async function workspaceExists(root = getProjectRoot()): Promise<boolean> {
  try {
    await access(getWorkspacePhotosDir(root));
    return true;
  } catch {
    return false;
  }
}
