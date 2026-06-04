/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ImportPanel from "./components/ImportPanel";
import ReviewPanel from "./components/ReviewPanel";
import SettingsPanel from "./components/SettingsPanel";
import ExportPanel from "./components/ExportPanel";
import HistoryPanel from "./components/HistoryPanel";
import HelpSettingsPanel from "./components/HelpSettingsPanel";
import TvPreviewWidget from "./components/TvPreviewWidget";
import { PhotoAsset, SlideshowPreset, HistoryItem, CardGridDensity } from "./types";
import { DEFAULT_PRESET } from "./core/presets";
import { loadHistory, saveHistory, loadSettings, saveSettings } from "./core/storage.browser";
import { savePhotoSession } from "./core/session.browser";
import { WORKSPACE_ALBUM_NAME } from "./core/workspace.shared";
import WorkspaceElitePanel from "./components/WorkspaceElitePanel";
import { isElectron, electronLoadWorkspace, electronSaveWorkspace } from "./bridge/electron";
import { Award, HelpCircle, Video, HardDrive, AlertTriangle, Monitor } from "lucide-react";

export default function App() {
  const [currentTab, setTab] = useState<string>("dashboard");
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [backgroundMode, setBackgroundMode] = useState<"black-bars" | "blurred-fill" | "crop-fill">("blurred-fill");
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false);
  const [musicTrackId, setMusicTrackId] = useState<string>("nature");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [albumName, setAlbumName] = useState(WORKSPACE_ALBUM_NAME);
  const [preset, setPreset] = useState<SlideshowPreset>(DEFAULT_PRESET);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [cardGridDensity, setCardGridDensity] = useState<CardGridDensity>("normal");
  const [musicPath, setMusicPath] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const desktop = isElectron();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistWorkspace = useCallback(async () => {
    if (photos.length === 0) return;
    if (desktop) {
      setSaveStatus("saving");
      const ok = await electronSaveWorkspace({
        photos,
        preset,
        backgroundMode,
        musicEnabled,
        musicTrackId,
        albumName,
      });
      setSaveStatus(ok ? "saved" : "error");
    } else {
      savePhotoSession(photos);
      setSaveStatus("saved");
    }
  }, [photos, preset, backgroundMode, musicEnabled, musicTrackId, albumName, desktop]);

  const loadWorkspaceNative = async () => {
    if (!desktop) return;
    setWorkspaceLoading(true);
    try {
      const result = await electronLoadWorkspace();
      if (result?.photos) {
        setPhotos(result.photos);
        setTab("dashboard");
      }
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    setHistory(loadHistory());
    const saved = loadSettings();
    if (saved?.preset) setPreset(saved.preset);
    if (saved?.backgroundMode) setBackgroundMode(saved.backgroundMode);
    if (saved?.musicEnabled !== undefined) setMusicEnabled(saved.musicEnabled);
    if (saved?.musicTrackId) setMusicTrackId(saved.musicTrackId);
    if (saved?.albumName) setAlbumName(saved.albumName);
    if (saved?.cardGridDensity) setCardGridDensity(saved.cardGridDensity);
    if (saved?.musicPath) setMusicPath(saved.musicPath);
  }, []);

  useEffect(() => {
    if (desktop) {
      loadWorkspaceNative();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop]);

  useEffect(() => {
    saveSettings({ preset, backgroundMode, musicEnabled, musicTrackId, albumName, cardGridDensity, musicPath });
  }, [preset, backgroundMode, musicEnabled, musicTrackId, albumName, cardGridDensity, musicPath]);

  useEffect(() => {
    if (photos.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistWorkspace();
    }, 1200);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [photos, persistWorkspace]);

  useEffect(() => {
    if (desktop || photos.length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [photos.length, desktop]);

  const readyPhotos = photos.filter((p) => p.status === "ready");
  const duplicatePhotos = photos.filter((p) => p.status === "duplicate");
  const unsupportedPhotos = photos.filter((p) => p.status === "unsupported");

  const handleExportFinished = (historyItem: HistoryItem) => {
    const next = [historyItem, ...history];
    setHistory(next);
    saveHistory(next);
    setTab("history");
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden" id="app-root-container">
      <Sidebar currentTab={currentTab} setTab={setTab} photosCount={readyPhotos.length} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <span className="text-xs uppercase tracking-wider font-mono font-bold text-indigo-400">Slideshow Workspace</span>
            <div className="flex items-center space-x-1.5 bg-indigo-950 border border-indigo-800/40 px-2.5 py-0.5 rounded-full">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold">
                {desktop ? "Desktop" : "Elite"} · v3.0
              </span>
            </div>
            {desktop && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-green-400 bg-green-950/40 px-2 py-0.5 rounded border border-green-900/50">
                <Monitor className="w-3 h-3" />
                Electron
              </div>
            )}
            {photos.length > 0 && saveStatus !== "idle" && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  saveStatus === "error"
                    ? "text-red-400 bg-red-950/40"
                    : saveStatus === "saving"
                      ? "text-yellow-400"
                      : "text-slate-500"
                }`}
              >
                {saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Edits saved"}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              className="text-xs font-mono bg-slate-950 border border-slate-800 rounded px-3 py-1 text-slate-300 w-40"
              title="Album folder name"
              placeholder="Album name"
            />
            <button onClick={() => setTab("help")} className="text-slate-400 hover:text-indigo-400" title="Help">
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-950">
          {currentTab === "dashboard" && (
            <div className="p-6 space-y-6 max-w-7xl mx-auto" id="hub-dashboard">
              <WorkspaceElitePanel
                photosLoaded={readyPhotos.length}
                loading={workspaceLoading}
                onLoadWorkspaceNative={loadWorkspaceNative}
                onBrowseWorkspace={() => {
                  setTab("import");
                  if (!desktop) {
                    setTimeout(() => document.getElementById("btn-import-workspace-folder")?.click(), 100);
                  }
                }}
              />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Metric icon={Video} label="PHOTOS" value={photos.length} />
                <Metric icon={Award} label="READY" value={readyPhotos.length} color="text-green-400" />
                <Metric icon={HardDrive} label="SKIPPED" value={duplicatePhotos.length} color="text-yellow-500" />
                <Metric icon={AlertTriangle} label="UNSUPPORTED" value={unsupportedPhotos.length} color="text-red-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-2">Sequence</h3>
                  {readyPhotos.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-500 mb-3">Import photos to begin.</p>
                      <button onClick={() => setTab("import")} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg">
                        Go to Import
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[380px] overflow-y-auto">
                      {readyPhotos.slice(0, 15).map((photo, index) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800">
                          <img src={photo.originalPath} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 text-[8px] bg-slate-950/70 px-1 rounded font-mono">#{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5">
                  <TvPreviewWidget
                    photos={photos}
                    preset={preset}
                    backgroundMode={backgroundMode}
                    musicEnabled={musicEnabled}
                    musicTrackId={musicTrackId}
                  />
                </div>

                <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs font-mono">
                  <h3 className="text-sm font-bold text-slate-200">Settings</h3>
                  <Row label="FORMAT" value={preset.label} />
                  <Row label="TIMING" value={`${preset.slideDurationSeconds}s`} />
                  <Row label="FILL" value={backgroundMode.replace("-", " ")} />
                  <button
                    onClick={() => setTab("export")}
                    className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                  >
                    Export →
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentTab === "import" && (
            <ImportPanel
              photos={photos}
              setPhotos={setPhotos}
              onContinue={() => setTab("review")}
              onLoadWorkspaceNative={loadWorkspaceNative}
              workspaceLoading={workspaceLoading}
            />
          )}
          {currentTab === "review" && (
            <ReviewPanel
              photos={photos}
              setPhotos={setPhotos}
              globalBackgroundMode={backgroundMode}
              defaultSlideSeconds={preset.slideDurationSeconds}
              cardGridDensity={cardGridDensity}
              setCardGridDensity={setCardGridDensity}
              onProceed={() => {
                if (desktop) {
                  void electronSaveWorkspace({
                    photos,
                    preset,
                    backgroundMode,
                    musicEnabled,
                    musicTrackId,
                    albumName,
                  });
                }
                setTab("settings");
              }}
            />
          )}
          {currentTab === "settings" && (
            <SettingsPanel
              preset={preset}
              setPreset={setPreset}
              backgroundMode={backgroundMode}
              setBackgroundMode={setBackgroundMode}
              musicEnabled={musicEnabled}
              setMusicEnabled={setMusicEnabled}
              musicTrackId={musicTrackId}
              setMusicTrackId={setMusicTrackId}
              musicPath={musicPath}
              setMusicPath={setMusicPath}
              onProceed={() => setTab("export")}
              onPreview={() => setTab("dashboard")}
            />
          )}
          {currentTab === "export" && (
            <ExportPanel
              photos={photos}
              preset={preset}
              backgroundMode={backgroundMode}
              musicEnabled={musicEnabled}
              musicTrackId={musicTrackId}
              musicPath={musicPath}
              albumName={albumName}
              onExportFinished={handleExportFinished}
            />
          )}
          {currentTab === "history" && <HistoryPanel history={history} />}
          {currentTab === "help" && <HelpSettingsPanel />}
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  color = "text-white",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <span className="text-[10px] text-slate-500 block font-mono">{label}</span>
        <span className={`text-xl font-bold font-mono ${color}`}>{value}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/45 p-2 rounded-lg border border-slate-900">
      <span className="text-[9px] text-slate-600 block">{label}</span>
      <span className="text-slate-200 font-bold capitalize">{value}</span>
    </div>
  );
}
