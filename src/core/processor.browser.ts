/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildNormalizeOptionsForPhoto } from "./cardFormat";
import type { BackgroundMode, PhotoAsset } from "./types";

export async function normalizePhotoOnCanvas(
  photo: PhotoAsset,
  presetWidth: number,
  presetHeight: number,
  globalBg: BackgroundMode
): Promise<Blob | null> {
  const opts = buildNormalizeOptionsForPhoto(photo, presetWidth, presetHeight, globalBg);
  return normalizePhotoOnCanvasRaw(photo, opts.canvasWidth, opts.canvasHeight, opts.width, opts.height, opts.backgroundMode);
}

async function normalizePhotoOnCanvasRaw(
  photo: PhotoAsset,
  canvasWidth: number,
  canvasHeight: number,
  innerWidth: number,
  innerHeight: number,
  bgStyle: BackgroundMode
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const orientation = photo.orientation || 1;
      let rotationAngleDeg = 0;
      if (orientation === 6) rotationAngleDeg = 90;
      else if (orientation === 3) rotationAngleDeg = 180;
      else if (orientation === 8) rotationAngleDeg = 270;

      const drawRenderedImage = (
        destX: number,
        destY: number,
        destWidth: number,
        destHeight: number,
        applyFilter = false
      ) => {
        ctx.save();
        if (applyFilter) ctx.filter = "blur(18px) brightness(0.65)";
        ctx.translate(destX + destWidth / 2, destY + destHeight / 2);
        if (rotationAngleDeg !== 0) ctx.rotate((rotationAngleDeg * Math.PI) / 180);
        const isRotated90 = orientation === 6 || orientation === 8;
        const drawW = isRotated90 ? destHeight : destWidth;
        const drawH = isRotated90 ? destWidth : destHeight;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      };

      const imageRatio = img.width / img.height;

      const offX = (canvasWidth - innerWidth) / 2;
      const offY = (canvasHeight - innerHeight) / 2;

      if (bgStyle === "crop-fill") {
        let drawW = innerWidth;
        let drawH = innerWidth / imageRatio;
        if (drawH < innerHeight) {
          drawH = innerHeight;
          drawW = innerHeight * imageRatio;
        }
        drawRenderedImage(offX + (innerWidth - drawW) / 2, offY + (innerHeight - drawH) / 2, drawW, drawH);
      } else if (bgStyle === "blurred-fill") {
        let bgW = innerWidth;
        let bgH = innerWidth / imageRatio;
        if (bgH < innerHeight) {
          bgH = innerHeight;
          bgW = innerHeight * imageRatio;
        }
        drawRenderedImage(offX + (innerWidth - bgW) / 2, offY + (innerHeight - bgH) / 2, bgW, bgH, true);
        let drawW = innerWidth;
        let drawH = innerWidth / imageRatio;
        if (drawH > innerHeight) {
          drawH = innerHeight;
          drawW = innerHeight * imageRatio;
        }
        drawRenderedImage(offX + (innerWidth - drawW) / 2, offY + (innerHeight - drawH) / 2, drawW, drawH);
      } else {
        let drawW = innerWidth;
        let drawH = innerWidth / imageRatio;
        if (drawH > innerHeight) {
          drawH = innerHeight;
          drawW = innerHeight * imageRatio;
        }
        drawRenderedImage(offX + (innerWidth - drawW) / 2, offY + (innerHeight - drawH) / 2, drawW, drawH);
      }

      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    };
    img.onerror = () => resolve(null);
    img.src = photo.originalPath;
  });
}

export function numberedJpegName(index: number): string {
  return `${String(index + 1).padStart(6, "0")}.jpg`;
}
