/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const WORKSPACE_DIR_NAME = "photos for use";
export const WORKSPACE_ALBUM_NAME = "Elite_Slideshow";
export const WORKSPACE_PROJECT_FILENAME = "workspace.project.json";

export const WORKSPACE_CLI_HINTS = {
  approve: "npm run elite:approve",
  desktop: "npm run electron:dev",
  scan: "npm run workspace:scan",
  export: "npm run workspace:export",
  exportBoth: "slideshow-forge workspace export --mode both --json",
} as const;
