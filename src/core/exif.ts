/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import exifr from "exifr";

export interface ExifData {
  orientation: number;
  dateTaken?: string;
  width?: number;
  height?: number;
}

export async function readExifFromBuffer(buffer: ArrayBuffer | Buffer): Promise<ExifData> {
  try {
    const parsed = await exifr.parse(buffer, {
      pick: ["Orientation", "DateTimeOriginal", "CreateDate", "ImageWidth", "ImageHeight", "ExifImageWidth", "ExifImageHeight"],
    });
    if (!parsed) {
      return { orientation: 1 };
    }
    const orientation = normalizeOrientation(parsed.Orientation);
    const dateRaw = parsed.DateTimeOriginal ?? parsed.CreateDate;
    const dateTaken =
      dateRaw instanceof Date ? dateRaw.toISOString() : typeof dateRaw === "string" ? new Date(dateRaw).toISOString() : undefined;
    const width = parsed.ExifImageWidth ?? parsed.ImageWidth;
    const height = parsed.ExifImageHeight ?? parsed.ImageHeight;
    return {
      orientation,
      dateTaken,
      width: typeof width === "number" ? width : undefined,
      height: typeof height === "number" ? height : undefined,
    };
  } catch {
    return { orientation: 1 };
  }
}

export async function readExifFromFile(filePath: string): Promise<ExifData> {
  try {
    const parsed = await exifr.parse(filePath, {
      pick: ["Orientation", "DateTimeOriginal", "CreateDate", "ImageWidth", "ImageHeight", "ExifImageWidth", "ExifImageHeight"],
    });
    if (!parsed) {
      return { orientation: 1 };
    }
    const orientation = normalizeOrientation(parsed.Orientation);
    const dateRaw = parsed.DateTimeOriginal ?? parsed.CreateDate;
    const dateTaken =
      dateRaw instanceof Date ? dateRaw.toISOString() : typeof dateRaw === "string" ? new Date(dateRaw).toISOString() : undefined;
    return {
      orientation,
      dateTaken,
      width: parsed.ExifImageWidth ?? parsed.ImageWidth,
      height: parsed.ExifImageHeight ?? parsed.ImageHeight,
    };
  } catch {
    return { orientation: 1 };
  }
}

function normalizeOrientation(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? "1"), 10);
  if ([1, 3, 6, 8].includes(n)) return n;
  return 1;
}

export function orientationLabel(orientation: number): string {
  switch (orientation) {
    case 6:
      return "90° CW";
    case 8:
      return "90° CCW";
    case 3:
      return "180°";
    default:
      return "Normal";
  }
}
