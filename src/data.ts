/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhotoAsset } from "./types";

export const SAMPLE_PHOTOS: PhotoAsset[] = [
  {
    id: "sample-1",
    originalPath: "https://picsum.photos/id/10/1200/800",
    filename: "DSC_1082_LAKE.JPG",
    extension: "JPG",
    width: 1200,
    height: 800,
    dateTaken: "2026-05-15T14:22:10Z",
    dateModified: "2026-05-15T14:30:00Z",
    orientation: 1, // Normal landscape
    hash: "h-lk8219x0",
    status: "ready",
    warnings: [],
    fileSize: 4210980
  },
  {
    id: "sample-2",
    originalPath: "https://picsum.photos/id/14/1200/800",
    filename: "DSC_1085_BEACH.JPG",
    extension: "JPG",
    width: 1200,
    height: 800,
    dateTaken: "2026-05-15T15:10:45Z",
    dateModified: "2026-05-15T15:15:00Z",
    orientation: 1,
    hash: "h-bc9921z3",
    status: "ready",
    warnings: [],
    fileSize: 3982400
  },
  {
    id: "sample-3",
    originalPath: "https://picsum.photos/id/15/1200/800",
    filename: "DSC_1090_ROCKS.JPG",
    extension: "JPG",
    width: 1200,
    height: 800,
    dateTaken: "2026-05-16T09:45:12Z",
    dateModified: "2026-05-16T10:00:00Z",
    orientation: 1,
    hash: "h-rk9031p1",
    status: "ready",
    warnings: [],
    fileSize: 4451290
  },
  {
    id: "sample-4-sideways",
    originalPath: "https://picsum.photos/id/29/1000/1500",
    filename: "IMG_6654_PORTRAIT_SIDEWAYS.JPG",
    extension: "JPG",
    width: 1000,
    height: 1500,
    dateTaken: "2026-05-16T11:02:18Z",
    dateModified: "2026-05-16T11:20:00Z",
    orientation: 6, // Rotated 90 CW (sideways phone picture!)
    hash: "h-sp0065w4",
    status: "ready",
    warnings: ["Sideways orientation detected in EXIF. Auto-rotation will correct this."],
    fileSize: 2891230
  },
  {
    id: "sample-5",
    originalPath: "https://picsum.photos/id/16/1200/675",
    filename: "DSC_1099_MIST.PNG",
    extension: "PNG",
    width: 1200,
    height: 675,
    dateTaken: "2026-05-16T18:30:00Z",
    dateModified: "2026-05-16T18:40:00Z",
    orientation: 1,
    hash: "h-ms1099f7",
    status: "ready",
    warnings: ["PNG with transparency/high-depth. Normalizing to compressed TV-safe sub-sampling JPEG."],
    fileSize: 6125430
  },
  {
    id: "sample-6-duplicate",
    originalPath: "https://picsum.photos/id/16/1200/675",
    filename: "DSC_1099_MIST_COPY.PNG",
    extension: "PNG",
    width: 1200,
    height: 675,
    dateTaken: "2026-05-16T18:30:00Z",
    dateModified: "2026-05-16T18:40:00Z",
    orientation: 1,
    hash: "h-ms1099f7", // Same hash!
    status: "duplicate",
    warnings: ["Duplicate of DSC_1099_MIST.PNG. Marked for skipping."],
    fileSize: 6125430
  },
  {
    id: "sample-7-heic",
    originalPath: "https://picsum.photos/id/43/1000/1500",
    filename: "IMG_3120_GARDEN.HEIC",
    extension: "HEIC",
    width: 1000,
    height: 1500,
    dateTaken: "2026-05-17T08:14:22Z",
    dateModified: "2026-05-17T08:20:00Z",
    orientation: 1,
    hash: "h-hc3120g2",
    status: "ready",
    warnings: ["HEIC format has spotty Samsung TV support before Tizen 6.0 (2021). Converting to Universal JPEG."],
    fileSize: 1845920
  },
  {
    id: "sample-8-unsupported",
    originalPath: "https://picsum.photos/id/28/1200/800",
    filename: "CORRUPTED_TEMP_TEMP.TMP",
    extension: "TMP",
    width: 0,
    height: 0,
    dateTaken: undefined,
    dateModified: "2026-05-17T12:00:00Z",
    orientation: undefined,
    hash: "h-cr8871t0",
    status: "unsupported",
    warnings: ["Unsupported file extension (TMP). File will be excluded from the TV slideshow."],
    fileSize: 240
  },
  {
    id: "sample-9",
    originalPath: "https://picsum.photos/id/54/1200/800",
    filename: "IMG_4901_RIDGE.WEBP",
    extension: "WEBP",
    width: 1200,
    height: 800,
    dateTaken: "2026-05-18T11:00:00Z",
    dateModified: "2026-05-18T11:15:00Z",
    orientation: 1,
    hash: "h-wb4901r7",
    status: "ready",
    warnings: ["WebP file format conversion requested. Normalizing to baseline TV JPEG."],
    fileSize: 1450200
  },
  {
    id: "sample-10",
    originalPath: "https://picsum.photos/id/1047/1200/800",
    filename: "DSC_1120_SHEEP.JPG",
    extension: "JPG",
    width: 1200,
    height: 800,
    dateTaken: "2026-05-18T16:45:10Z",
    dateModified: "2026-05-18T17:00:00Z",
    orientation: 1,
    hash: "h-sh4710s2",
    status: "ready",
    warnings: [],
    fileSize: 4125032
  },
  {
    id: "sample-11-sideways-ccw",
    originalPath: "https://picsum.photos/id/1043/1000/1500",
    filename: "IMG_8820_PORTRAIT_SIDEWAYS2.JPG",
    extension: "JPG",
    width: 1000,
    height: 1500,
    dateTaken: "2026-05-19T10:11:00Z",
    dateModified: "2026-05-19T10:20:00Z",
    orientation: 8, // Rotated 90 CCW (requires 270 deg CW rotation to correct)
    hash: "h-sp8820c8",
    status: "ready",
    warnings: ["Sideways orientation (90° CCW) detected in EXIF. Auto-rotation will correct this."],
    fileSize: 3105000
  },
  {
    id: "sample-12",
    originalPath: "https://picsum.photos/id/1044/1200/800",
    filename: "DSC_1210_CAMPFIRE.JPG",
    extension: "JPG",
    width: 1200,
    height: 800,
    dateTaken: "2026-05-20T21:30:15Z",
    dateModified: "2026-05-20T21:45:00Z",
    orientation: 1,
    hash: "h-cf1210x3",
    status: "ready",
    warnings: [],
    fileSize: 4950000
  }
];

export const AUDIO_TRACKS = [
  { id: "nature", label: "Mountain Serenade (Acoustic Guitar)", duration: "3:45", url: "" },
  { id: "ambient", label: "Sunset Breeze (Ambient Synth/Pad)", duration: "5:20", url: "" },
  { id: "jazz", label: "Lazy Fireplace (Chill Lofi Jazz Beat)", duration: "4:12", url: "" },
  { id: "classical", label: "Moonlight Sonata (Soft Piano)", duration: "6:10", url: "" }
];
