/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { app, BrowserWindow, ipcMain, dialog, shell, session } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { mkdir } from "node:fs/promises";
import { runDoctor } from "../src/core/doctor.node.ts";
import { runExport } from "../src/core/exporter.node.ts";
import { scanFolder } from "../src/core/scanner.node.ts";
import { loadProject, saveProject, createEmptyProject } from "../src/core/project.ts";
import {
  getProjectRoot,
  getWorkspacePhotosDir,
  getWorkspaceProjectPath,
} from "../src/core/workspace.ts";
import { WORKSPACE_ALBUM_NAME } from "../src/core/workspace.shared.ts";
import { createPreset } from "../src/core/presets.ts";
import type { BackgroundMode, ExportMode, PhotoAsset, ScanOptions, SlideshowPreset } from "../src/core/types.ts";

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function toFileUrls(photos: PhotoAsset[]): PhotoAsset[] {
  return photos.map((p) => {
    if (
      p.originalPath.startsWith("file:") ||
      p.originalPath.startsWith("http:") ||
      p.originalPath.startsWith("https:") ||
      p.originalPath.startsWith("blob:")
    ) {
      return p;
    }
    return { ...p, originalPath: pathToFileURL(p.originalPath).href };
  });
}

let mainWindow: BrowserWindow | null = null;

function getPreloadPath(): string {
  const isBuiltMain = __filename.replace(/\\/g, "/").endsWith("dist-electron/main.cjs");
  return isBuiltMain
    ? path.join(__dirname, "preload.cjs")
    : path.join(__dirname, "..", "dist-electron", "preload.cjs");
}

function toLocalPath(originalPath: string): string {
  if (originalPath.startsWith("file://")) {
    return fileURLToPath(originalPath);
  }
  return originalPath;
}

function setupContentSecurityPolicy() {
  // Dev uses Vite HMR (needs unsafe-eval) — CSP headers break the dev server; prod only.
  if (isDev) return;

  const prodCsp =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' file: blob: data:; connect-src 'self'; font-src 'self' data:";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [prodCsp],
      },
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: "Slideshow Forge",
    backgroundColor: "#020617",
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
      console.error(`[electron] did-fail-load ${code} ${desc} ${url}`);
    });
    void mainWindow.loadURL(devUrl).catch((err) => {
      console.error("[electron] loadURL failed:", err);
    });
    if (process.env.SLIDESHOW_DEVTOOLS === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  setupContentSecurityPolicy();
  const out = path.join(getProjectRoot(), "output");
  await mkdir(out, { recursive: true });
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function registerIpc() {
  ipcMain.handle("app:getPaths", () => ({
    projectRoot: getProjectRoot(),
    workspacePhotos: getWorkspacePhotosDir(),
    workspaceProject: getWorkspaceProjectPath(),
    defaultOutput: path.join(getProjectRoot(), "output"),
  }));

  ipcMain.handle("doctor:run", () => runDoctor());

  ipcMain.handle("workspace:load", async () => {
    const dir = getWorkspacePhotosDir();
    const projectPath = getWorkspaceProjectPath();
    const scanOpts: ScanOptions = {
      recursive: false,
      dedupe: true,
      fixRotation: true,
      autoConvert: true,
    };

    try {
      const project = await loadProject(projectPath);
      return {
        folder: dir,
        photos: toFileUrls(project.photos),
        stats: {
          total: project.photos.length,
          ready: project.photos.filter((p) => p.status === "ready").length,
          duplicate: project.photos.filter((p) => p.status === "duplicate").length,
          unsupported: project.photos.filter((p) => p.status === "unsupported").length,
        },
        fromProject: true,
      };
    } catch {
      const result = await scanFolder(dir, scanOpts);
      const project = createEmptyProject(dir, WORKSPACE_ALBUM_NAME);
      project.photos = result.photos;
      project.preset = createPreset("samsung-safe-1080p");
      await saveProject(projectPath, project);
      return { folder: dir, photos: toFileUrls(result.photos), stats: result.stats, fromProject: false };
    }
  });

  ipcMain.handle(
    "workspace:save",
    async (
      _e,
      payload: {
        photos: PhotoAsset[];
        preset: SlideshowPreset;
        backgroundMode: BackgroundMode;
        musicEnabled: boolean;
        musicTrackId: string;
        albumName: string;
      }
    ) => {
      const projectPath = getWorkspaceProjectPath();
      try {
        const project = await loadProject(projectPath);
        project.photos = payload.photos.map((p) => ({
          ...p,
          originalPath: toLocalPath(p.originalPath),
        }));
        project.preset = payload.preset;
        project.backgroundMode = payload.backgroundMode;
        project.musicEnabled = payload.musicEnabled;
        project.musicTrackId = payload.musicTrackId;
        project.name = payload.albumName || project.name;
        await saveProject(projectPath, project);
        return true;
      } catch {
        return false;
      }
    }
  );

  ipcMain.handle("folder:scan", async (_e, folderPath: string, options: ScanOptions) => {
    const result = await scanFolder(path.resolve(folderPath), options);
    return { ...result, photos: toFileUrls(result.photos) };
  });

  ipcMain.handle("dialog:pickFolder", async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const r = await dialog.showOpenDialog(win!, {
      properties: ["openDirectory"],
      title: "Select photo folder",
    });
    if (r.canceled || !r.filePaths[0]) return null;
    return r.filePaths[0];
  });

  ipcMain.handle("dialog:pickOutput", async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const r = await dialog.showOpenDialog(win!, {
      properties: ["openDirectory", "createDirectory"],
      title: "Select export destination (USB or folder)",
      defaultPath: path.join(getProjectRoot(), "output"),
    });
    if (r.canceled || !r.filePaths[0]) return null;
    return r.filePaths[0];
  });

  ipcMain.handle("dialog:pickMusic", async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const r = await dialog.showOpenDialog(win!, {
      properties: ["openFile"],
      title: "Select background music (MP3, AAC, M4A)",
      filters: [{ name: "Audio", extensions: ["mp3", "aac", "m4a", "wav"] }],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    return r.filePaths[0];
  });

  ipcMain.handle("shell:openPath", async (_e, targetPath: string) => {
    await shell.openPath(targetPath);
  });

  ipcMain.handle("shell:showItemInFolder", async (_e, targetPath: string) => {
    shell.showItemInFolder(targetPath);
  });

  ipcMain.handle(
    "export:run",
    async (
      event,
      payload: {
        photos: PhotoAsset[];
        preset: SlideshowPreset;
        backgroundMode: BackgroundMode;
        mode: ExportMode;
        albumName: string;
        outputDir: string;
        inputFolder: string;
        musicPath?: string;
        musicEnabled: boolean;
      }
    ) => {
      const logs: string[] = [];
      const sender = event.sender;

      const result = await runExport(
        payload.photos.map((p) => ({
          ...p,
          originalPath: toLocalPath(p.originalPath),
        })),
        {
          outputDir: payload.outputDir,
          albumName: payload.albumName.replace(/[^\w\- ]/g, "_").replace(/\s+/g, "_"),
          mode: payload.mode,
          preset: payload.preset,
          backgroundMode: payload.backgroundMode,
          musicEnabled: payload.musicEnabled,
          musicPath: payload.musicPath,
          inputFolder: payload.inputFolder,
          onLog: (m) => {
            logs.push(m);
            sender.send("export:log", m);
          },
          onProgress: (p) => sender.send("export:progress", p),
        }
      );

      try {
        const projectPath = getWorkspaceProjectPath();
        const project = await loadProject(projectPath);
        project.photos = payload.photos.map((p) => ({
          ...p,
          originalPath: toLocalPath(p.originalPath),
        }));
        project.preset = payload.preset;
        project.backgroundMode = payload.backgroundMode;
        project.musicEnabled = payload.musicEnabled;
        await saveProject(projectPath, project);
      } catch {
        /* workspace project optional */
      }

      return { result, logs };
    }
  );
}
