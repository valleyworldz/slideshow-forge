/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

async function addDirectory(zip: JSZip, dirPath: string, zipPath: string): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    const rel = zipPath ? `${zipPath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await addDirectory(zip, full, rel);
    } else {
      zip.file(rel.replace(/\\/g, "/"), await readFile(full));
    }
  }
}

/** Zip a directory; top-level folder name preserved from basename. */
export async function zipDirectory(dirPath: string): Promise<Buffer> {
  const zip = new JSZip();
  const rootName = path.basename(dirPath);
  const root = zip.folder(rootName);
  if (!root) throw new Error("Failed to create zip root");
  await addDirectory(root, dirPath, "");
  return Buffer.from(await zip.generateAsync({ type: "arraybuffer" }));
}
