/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [IO] MP4 Transition Frames
 * ───────────────────────────────────────────────────────────────────────────
 * @file     transitions.node.ts
 * @purpose  Bake inter-slide crossfade frames before FFmpeg encode
 * @layer    IO
 * @depends  sharp
 * @consumers exporter.node
 * @status   ELITE ✅
 * @see      docs/PIPELINE.md § Stage 4
 * ═══════════════════════════════════════════════════════════════════════════
 */

import sharp from "sharp";

/** Default crossfade overlap (seconds) — matches legacy ffmpeg crossfade duration. */
export const CROSSFADE_SECONDS = 0.5;

export function crossfadeFrameCount(fps: number, crossfadeSec = CROSSFADE_SECONDS): number {
  return Math.max(2, Math.round(crossfadeSec * fps));
}

/** Linear blend: `from` at (1-alpha) + `to` at alpha. Both normalized to same canvas. */
export async function blendSlideJpegs(fromPath: string, toPath: string, alphaTo: number): Promise<Buffer> {
  const alpha = Math.min(1, Math.max(0, alphaTo));
  const fromMeta = await sharp(fromPath).metadata();
  const w = fromMeta.width ?? 1920;
  const h = fromMeta.height ?? 1080;

  const [fromRaw, toRaw] = await Promise.all([
    sharp(fromPath).resize(w, h, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(toPath).resize(w, h, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);

  const channels = 4;
  const pixelCount = w * h;
  const out = Buffer.alloc(pixelCount * channels);
  for (let px = 0; px < pixelCount; px++) {
    const i = px * channels;
    out[i] = Math.round(fromRaw.data[i] * (1 - alpha) + toRaw.data[i] * alpha);
    out[i + 1] = Math.round(fromRaw.data[i + 1] * (1 - alpha) + toRaw.data[i + 1] * alpha);
    out[i + 2] = Math.round(fromRaw.data[i + 2] * (1 - alpha) + toRaw.data[i + 2] * alpha);
    out[i + 3] = 255;
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

/** FFmpeg transition when crossfade is pre-baked into the frame sequence. */
export function ffmpegTransitionForPreset(transition: "none" | "crossfade" | "fade-to-black"): "none" | "fade-to-black" {
  if (transition === "crossfade") return "none";
  return transition;
}
