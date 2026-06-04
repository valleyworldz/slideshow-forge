/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import multer from "multer";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { APP_VERSION } from "../core/constants";
import { runDoctor } from "../core/doctor.node";
import { runExport } from "../core/exporter.node";
import { createPreset } from "../core/presets";
import type { BackgroundMode, ExportMode, PhotoAsset, SlideshowPreset } from "../core/types";
import { zipDirectory } from "./zip";

const PORT = parseInt(process.env.SLIDESHOW_API_PORT ?? "3847", 10);
const upload = multer({ dest: path.join(os.tmpdir(), "slideshow-forge-uploads") });

export async function createApiServer() {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/health", async (_req, res) => {
    const doctor = await runDoctor();
    res.json({ ok: doctor.ok, version: APP_VERSION, doctor });
  });

  app.post("/api/export", upload.array("files"), async (req, res) => {
    const workDir = path.join(os.tmpdir(), `sf-export-${Date.now()}`);
    try {
      const body = req.body as Record<string, string>;
      const files = (req.files as Express.Multer.File[]) ?? [];
      const mode = (body.mode ?? "both") as ExportMode;
      const backgroundMode = (body.backgroundMode ?? "blurred-fill") as BackgroundMode;
      const albumName = (body.albumName ?? "Web_Export").replace(/[^\w\- ]/g, "_").replace(/\s+/g, "_");
      const preset = JSON.parse(body.preset ?? "{}") as SlideshowPreset;
      const photosMeta = JSON.parse(body.photos ?? "[]") as PhotoAsset[];
      const musicEnabled = body.musicEnabled === "1" || body.musicEnabled === "true";
      const musicPath = body.musicPath?.trim() || undefined;

      const outDir = path.join(workDir, "out");
      await mkdir(outDir, { recursive: true });

      const readyMeta = photosMeta.filter((p) => p.status === "ready");
      const missingUpload = readyMeta.filter(
        (p) => !files.some((f) => f.originalname === p.filename)
      );
      if (missingUpload.length > 0) {
        res.status(400).json({
          ok: false,
          error: `Missing uploads for: ${missingUpload.map((p) => p.filename).slice(0, 5).join(", ")}${missingUpload.length > 5 ? "…" : ""}`,
        });
        return;
      }

      const photos: PhotoAsset[] = photosMeta.map((p) => {
        const uploaded = files.find((f) => f.originalname === p.filename);
        return { ...p, originalPath: uploaded?.path ?? p.originalPath };
      });

      const logs: string[] = [];
      const result = await runExport(
        photos.filter((p) => p.status === "ready"),
        {
          outputDir: outDir,
          albumName,
          mode,
          preset: preset?.width ? preset : createPreset("samsung-safe-1080p"),
          backgroundMode,
          musicEnabled,
          musicPath: musicEnabled ? musicPath : undefined,
          inputFolder: "browser-upload",
          onLog: (m) => logs.push(m),
        }
      );

      const albumRoot = result.outputDir;
      const samsungDir = path.dirname(albumRoot);
      const zipBuf = await zipDirectory(samsungDir);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="Slideshow_Forge_${albumName}.zip"`);
      res.setHeader("X-Slideshow-Logs", Buffer.from(JSON.stringify(logs)).toString("base64"));
      res.setHeader("X-Slideshow-Ok", result.success ? "1" : "0");
      res.send(zipBuf);
    } catch (e) {
      res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  return app;
}

export function startApiServer(port = PORT) {
  return createApiServer().then((app) => {
    return new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const server = app.listen(port, "127.0.0.1", () => {
        console.log(`[slideshow-forge] API listening on http://127.0.0.1:${port}`);
        resolve(server);
      });
    });
  });
}

import { pathToFileURL } from "node:url";

const isMain =
  process.argv[1] &&
  (import.meta.url === pathToFileURL(process.argv[1]).href ||
    process.argv[1].replace(/\\/g, "/").endsWith("/server/index.ts"));

if (isMain) {
  startApiServer();
}
