/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SUPPORTED_EXTENSIONS } from "./constants";
import { readExifFromBuffer } from "./exif";
import { hashBrowserFile } from "./dedupe.browser";
import type { PhotoAsset, ScanOptions } from "./types";

export async function processBrowserFiles(
  files: FileList | File[],
  existing: PhotoAsset[],
  options: ScanOptions
): Promise<PhotoAsset[]> {
  const fileArray = Array.from(files as FileList);
  const seenHashes = new Set(existing.map((p) => p.hash).filter(Boolean) as string[]);
  const seenNames = new Set(existing.map((p) => p.filename));
  const newAssets: PhotoAsset[] = [];

  for (let index = 0; index < fileArray.length; index++) {
    const file = fileArray[index];
    const ext = (file.name.split(".").pop() ?? "").toUpperCase();
    const isSupported = SUPPORTED_EXTENSIONS.has(ext);
    const fileHash = options.dedupe ? await hashBrowserFile(file) : `f-${index}`;

    const warnings: string[] = [];
    let status: PhotoAsset["status"] = "ready";

    if (!isSupported) {
      status = "unsupported";
      warnings.push(`Unsupported extension (${ext}).`);
    } else if (options.dedupe && (seenHashes.has(fileHash) || seenNames.has(file.name))) {
      status = "duplicate";
      warnings.push(`Duplicate: ${file.name}`);
    } else if (["HEIC", "HEIF", "WEBP"].includes(ext) && !options.autoConvert) {
      status = "unsupported";
      warnings.push(`${ext} requires transcode — enable "Transcode on export" or use Electron/CLI (npm run electron:dev).`);
    } else {
      if (["HEIC", "HEIF"].includes(ext)) {
        warnings.push("HEIC/HEIF — browser export converts via canvas; Electron/CLI recommended for large albums.");
      }
    }

    const originalPath = URL.createObjectURL(file);
    let width = 0;
    let height = 0;
    let orientation = 1;
    let dateTaken: string | undefined;

    if (isSupported && status === "ready") {
      try {
        const buffer = await file.arrayBuffer();
        if (options.fixRotation) {
          const exif = await readExifFromBuffer(buffer);
          orientation = exif.orientation;
          dateTaken = exif.dateTaken;
          if (exif.width) width = exif.width;
          if (exif.height) height = exif.height;
        }
        const dims = await loadImageDimensions(originalPath);
        width = dims.w || width;
        height = dims.h || height;
        if (orientation !== 1) {
          warnings.push(`EXIF orientation ${orientation} will be applied on export.`);
        }
      } catch {
        warnings.push("Could not read full metadata.");
      }
    }

    if (height > width) {
      warnings.push("Portrait photo — will use selected background padding for 16:9 TV.");
    }

    newAssets.push({
      id: `uploaded-${Date.now()}-${index}`,
      originalPath,
      sourceFile: file,
      filename: file.name,
      extension: ext,
      width: width || undefined,
      height: height || undefined,
      dateTaken: dateTaken ?? new Date(file.lastModified).toISOString(),
      dateModified: new Date(file.lastModified).toISOString(),
      orientation: options.fixRotation ? orientation : 1,
      hash: fileHash,
      status,
      warnings,
      fileSize: file.size,
    });

    if (status === "ready") {
      seenHashes.add(fileHash);
      seenNames.add(file.name);
    }
  }

  return newAssets;
}

function loadImageDimensions(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = reject;
    img.src = src;
  });
}
