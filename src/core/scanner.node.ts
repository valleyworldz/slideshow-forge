/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { SUPPORTED_EXTENSIONS } from "./constants";
import { readExifFromFile } from "./exif";
import { hashFileContent } from "./dedupe.node";
import type { PhotoAsset, ScanOptions } from "./types";

async function walkDir(dir: string, recursive: boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...(await walkDir(full, recursive)));
      }
      continue;
    }
    if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

export async function scanFolder(
  inputFolder: string,
  options: ScanOptions
): Promise<{ photos: PhotoAsset[]; stats: { total: number; ready: number; duplicate: number; unsupported: number } }> {
  const absInput = path.resolve(inputFolder);
  const allFiles = await walkDir(absInput, options.recursive);
  const seenHashes = new Set<string>();
  const seenNames = new Set<string>();
  const photos: PhotoAsset[] = [];

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const filename = path.basename(filePath);
    const ext = (path.extname(filename).slice(1) || "").toUpperCase();
    const st = await stat(filePath);
    const fileSize = st.size;
    const fileHash = options.dedupe ? await hashFileContent(filePath, fileSize) : `n-${i}`;

    const warnings: string[] = [];
    let status: PhotoAsset["status"] = "ready";

    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      status = "unsupported";
      warnings.push(`Unsupported extension (${ext}).`);
    } else if (options.dedupe && (seenHashes.has(fileHash) || seenNames.has(filename))) {
      status = "duplicate";
      warnings.push(`Duplicate: ${filename}`);
    } else {
      if (["HEIC", "HEIF"].includes(ext) && !options.autoConvert) {
        warnings.push("HEIC/HEIF — enable auto-convert for best TV compatibility.");
      }
      if (ext === "PNG" && options.autoConvert) {
        warnings.push("PNG will be transcoded to baseline JPEG.");
      }
    }

    let orientation = 1;
    let dateTaken: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (status === "ready" && options.fixRotation) {
      const exif = await readExifFromFile(filePath);
      orientation = exif.orientation;
      dateTaken = exif.dateTaken;
      width = exif.width;
      height = exif.height;
      if (orientation !== 1) {
        warnings.push(`EXIF orientation ${orientation} — will be normalized on export.`);
      }
    }

    photos.push({
      id: `scan-${i}-${fileHash}`,
      originalPath: filePath,
      filename,
      extension: ext,
      width,
      height,
      dateTaken: dateTaken ?? new Date(st.mtime).toISOString(),
      dateModified: new Date(st.mtime).toISOString(),
      orientation: options.fixRotation ? orientation : 1,
      hash: fileHash,
      status,
      warnings,
      fileSize,
    });

    if (status === "ready") {
      seenHashes.add(fileHash);
      seenNames.add(filename);
    }
  }

  return {
    photos,
    stats: {
      total: photos.length,
      ready: photos.filter((p) => p.status === "ready").length,
      duplicate: photos.filter((p) => p.status === "duplicate").length,
      unsupported: photos.filter((p) => p.status === "unsupported").length,
    },
  };
}
