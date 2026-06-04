/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Copy, Terminal, HardDrive, AlertTriangle, CheckCircle2, Download, RefreshCw, FileText, FolderOpen } from "lucide-react";
import { PhotoAsset, SlideshowPreset, HistoryItem, ExportMode } from "../types";
import {
  checkApiServer,
  runApiExport,
  runBrowserFolderExport,
  buildCliExportCommand,
  validateApiUploadReady,
} from "../core/export.browser";
import { allowedExportModesForPreset, clampExportMode } from "../core/exportMode";
import {
  isElectron,
  electronExport,
  electronPickOutput,
  electronGetPaths,
  electronRevealOutput,
  electronDoctor,
} from "../bridge/electron";

interface ExportPanelProps {
  photos: PhotoAsset[];
  preset: SlideshowPreset;
  backgroundMode: "black-bars" | "blurred-fill" | "crop-fill";
  musicEnabled: boolean;
  musicTrackId: string;
  musicPath: string;
  albumName: string;
  onExportFinished: (historyItem: HistoryItem) => void;
}

export default function ExportPanel({
  photos,
  preset,
  backgroundMode,
  musicEnabled,
  musicTrackId,
  musicPath,
  albumName,
  onExportFinished,
}: ExportPanelProps) {
  const readyPhotos = photos.filter((p) => p.status === "ready");
  const desktop = isElectron();

  const [exportMode, setExportMode] = useState<ExportMode>("both");
  const [outputDir, setOutputDir] = useState<string>("");
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);
  const [lastOutputDir, setLastOutputDir] = useState<string>("");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [engineStatus, setEngineStatus] = useState<{ ffmpeg?: boolean; electron?: boolean; sharp?: boolean }>({});
  const [exportError, setExportError] = useState<string | null>(null);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const allowedModes = allowedExportModesForPreset(preset.id);

  useEffect(() => {
    if (desktop) {
      electronGetPaths().then((p) => p && setOutputDir(p.defaultOutput));
      electronDoctor().then((d) =>
        setEngineStatus({ ffmpeg: d?.ffmpeg.installed, electron: true, sharp: d?.sharp.ok })
      );
    } else {
      checkApiServer().then((api) => setEngineStatus({ ffmpeg: api.ffmpeg, electron: false }));
    }
  }, [desktop]);

  useEffect(() => {
    setExportMode((m) => clampExportMode(preset.id, m));
  }, [preset.id]);

  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  const estimateOutputSizeMB = () => {
    if (exportMode === "folder") return parseFloat((readyPhotos.length * 1.8).toFixed(1));
    const factor = preset.id === "samsung-4k" ? 4.5 : 1.2;
    return parseFloat((readyPhotos.length * factor).toFixed(1));
  };

  const handlePickOutput = async () => {
    if (desktop) {
      const picked = await electronPickOutput();
      if (picked) setOutputDir(picked);
    }
  };

  const handleRenderStart = async () => {
    if (readyPhotos.length === 0 || isRendering) return;

    setIsRendering(true);
    setRenderProgress(0);
    setRenderComplete(false);
    setExportError(null);
    setConsoleLogs([]);

    const log = (msg: string) => setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    try {
      log(`Starting export: ${exportMode} | ${readyPhotos.length} photos`);
      log(`Preset: ${preset.label} (${preset.width}x${preset.height})`);

      if (desktop) {
        const paths = await electronGetPaths();
        let dest = outputDir || paths?.defaultOutput || "";
        if (dest) setOutputDir(dest);
        if (!dest) throw new Error("No output folder selected");

        log(`Output: ${dest}`);
        log("Engine: Electron native (Sharp + FFmpeg)");

        const response = await electronExport(
          {
            photos,
            preset,
            backgroundMode,
            mode: exportMode,
            albumName: albumName || "Elite_Slideshow",
            outputDir: dest,
            inputFolder: paths?.workspacePhotos ?? "photos for use",
            musicEnabled,
            musicPath: musicEnabled && musicPath ? musicPath : undefined,
          },
          { onLog: log, onProgress: setRenderProgress }
        );

        if (!response) throw new Error("Export failed");

        const { result } = response;
        if (result.errors.length) {
          for (const e of result.errors) log(`⚠ ${e}`);
        }

        setLastOutputDir(result.outputDir);
        setRenderProgress(100);
        setRenderComplete(true);
        log(result.success ? "✨ Export complete — open folder below" : "Finished with warnings");

        onExportFinished({
          id: `history-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          name: `${albumName} (${exportMode})`,
          preset: preset.label,
          photosCount: readyPhotos.length,
          outputType: exportMode,
          usbTarget: dest,
          manifest: result.manifest,
        });
        return;
      }

      const exportOpts = {
        photos,
        preset,
        backgroundMode,
        mode: exportMode,
        albumName: albumName || "Elite_Slideshow",
        inputFolder: "browser-import",
        musicEnabled,
        musicPath: musicEnabled && musicPath ? musicPath : undefined,
        onLog: log,
        onProgress: setRenderProgress,
      };

      let result;
      if (exportMode === "folder") {
        result = await runBrowserFolderExport(exportOpts);
      } else {
        const upload = validateApiUploadReady(photos);
        if (!upload.ok) {
          throw new Error(
            `${upload.missing.length} photo(s) lack file data for server MP4. Re-import your folder (not sample URLs).`
          );
        }
        const api = await checkApiServer();
        if (!api.available || !api.ffmpeg) {
          const cmd = buildCliExportCommand(exportOpts.albumName, exportMode);
          setExportError(`MP4 needs API + FFmpeg. Run: npm run dev:full — or ${cmd}`);
          log("⚠ Start API: npm run dev:full (Vite + API) or npm run electron:dev");
          log(cmd);
          return;
        }
        if (musicEnabled && !musicPath) {
          log("⚠ Music enabled but no file — export will be silent (pick music in Settings on desktop).");
        }
        log("Using local export API + FFmpeg…");
        result = await runApiExport(exportOpts);
      }

      if (result.errors.length) {
        for (const e of result.errors) log(`⚠ ${e}`);
      }

      setRenderProgress(100);
      setRenderComplete(true);
      log(result.success ? "✨ Export complete" : "Export finished with warnings");

      onExportFinished({
        id: `history-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        name: `${albumName} (${exportMode})`,
        preset: preset.label,
        photosCount: readyPhotos.length,
        outputType: exportMode,
        usbTarget: "ZIP download",
        manifest: result.manifest,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setExportError(msg);
      log(`🛑 ${msg}`);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" id="panel-export">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Export Slideshow</h2>
        <p className="text-slate-400 text-sm mt-1">
          {desktop
            ? "Desktop mode — export directly to disk or USB with FFmpeg MP4."
            : "Browser mode — folder ZIP offline; MP4 needs API or Electron."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              {desktop ? "Export destination" : "Engine"}
            </h3>
            {desktop ? (
              <>
                <div className="text-[10px] font-mono text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
                  {outputDir || "Pick a folder…"}
                </div>
                <button
                  type="button"
                  onClick={handlePickOutput}
                  disabled={isRendering}
                  className="w-full py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Choose USB / output folder
                </button>
              </>
            ) : null}
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Mode</span>
                <span className="text-indigo-400">{desktop ? "Electron" : "Browser"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FFmpeg</span>
                <span className={engineStatus.ffmpeg ? "text-green-400" : "text-yellow-500"}>
                  {engineStatus.ffmpeg ? "ready" : "check doctor"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase flex items-center gap-2">
              <Copy className="w-4 h-4 text-indigo-400" />
              Output mode
            </h3>
            {[
              { id: "folder" as const, label: "TV Photo Folder", desc: "Numbered JPEGs for TV slideshow." },
              { id: "mp4" as const, label: "MP4 Video", desc: "Single H.264 file — press Play on TV." },
              { id: "both" as const, label: "Both (Elite)", desc: "JPEG folder + MP4 together." },
            ].map((m) => {
              const disabled = !allowedModes.includes(m.id);
              return (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs ${
                  disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                } ${exportMode === m.id ? "border-slate-700 bg-slate-800" : "border-slate-900 bg-slate-950/40"}`}
              >
                <input
                  type="radio"
                  name="exportMode"
                  checked={exportMode === m.id}
                  disabled={disabled || isRendering}
                  onChange={() => !isRendering && !disabled && setExportMode(m.id)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-slate-200 block">{m.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{m.desc}</span>
                </div>
              </label>
            );
            })}
            {preset.id === "photo-folder-only" && (
              <p className="text-[10px] text-slate-500 font-mono">Settings preset limits export to JPEG folder only.</p>
            )}

            <div className="text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">READY</span>
                <span className="text-indigo-400 font-bold">{readyPhotos.length}</span>
              </div>
              <div>
                <span className="text-slate-500 block">EST. SIZE</span>
                <span className="text-green-400 font-bold">~{estimateOutputSizeMB()} MB</span>
              </div>
            </div>

            <button
              onClick={handleRenderStart}
              disabled={isRendering || readyPhotos.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing… {renderProgress}%
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {desktop ? "Export to folder" : "Generate export"}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {exportError && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-xs text-red-200 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{exportError}</span>
            </div>
          )}

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
            <div className="h-1 bg-slate-850 rounded mb-2">
              <div className="bg-indigo-600 h-full transition-all" style={{ width: `${renderProgress}%` }} />
            </div>
            <span className="text-[10px] font-mono text-slate-500">{renderProgress}%</span>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-2xl flex flex-col p-4 h-[400px]">
            <div className="flex items-center gap-2 text-xs border-b border-slate-900 pb-3 text-slate-400">
              <Terminal className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase text-indigo-400">Export log</span>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs text-indigo-300 space-y-1.5 p-3 mt-3 bg-black/60 rounded-xl border border-slate-900">
              {consoleLogs.length === 0 ? (
                <p className="text-slate-600 text-center mt-20">Press export to start.</p>
              ) : (
                consoleLogs.map((line, i) => (
                  <div key={i} className="break-all">
                    {line}
                  </div>
                ))
              )}
              <div ref={consoleBottomRef} />
            </div>
          </div>

          {renderComplete && (
            <div className="bg-green-950/20 border border-green-500/40 p-4 rounded-2xl flex flex-wrap gap-3 items-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div className="flex-1">
                <h4 className="font-semibold text-white">Export ready for TV</h4>
                <p className="text-[11px] text-slate-400">Copy Samsung_Slideshows to USB root (exFAT).</p>
              </div>
              {desktop && lastOutputDir && (
                <button
                  type="button"
                  onClick={() => electronRevealOutput(lastOutputDir)}
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Show in Explorer
                </button>
              )}
              <a href="#help" className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Guide
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
