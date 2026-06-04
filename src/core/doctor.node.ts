/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import sharp from "sharp";
import { detectFfmpeg } from "./ffmpeg";
import type { DoctorReport } from "./types";

export async function runDoctor(): Promise<DoctorReport> {
  const messages: string[] = [];
  const ffmpeg = await detectFfmpeg();

  if (!ffmpeg.installed) {
    messages.push("FFmpeg not found. Install from https://ffmpeg.org and add to PATH.");
  } else {
    messages.push(`FFmpeg OK: ${ffmpeg.version}`);
  }

  let sharpOk = true;
  let heic = false;
  try {
    const formats = sharp.format;
    heic = Boolean(formats.heif?.input?.buffer || formats.heif?.input?.file);
    messages.push(heic ? "Sharp HEIC/HEIF support: yes" : "Sharp HEIC/HEIF: limited on this platform");
  } catch (e) {
    sharpOk = false;
    messages.push(`Sharp error: ${e instanceof Error ? e.message : String(e)}`);
  }

  const ok = ffmpeg.installed && sharpOk;

  return {
    ok,
    ffmpeg: { installed: ffmpeg.installed, version: ffmpeg.version, path: ffmpeg.path },
    sharp: { ok: sharpOk, heic },
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    messages,
  };
}
