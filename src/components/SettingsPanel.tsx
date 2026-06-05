/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sliders, Video, Folder, Settings, Music, Volume2, HelpCircle, Check, Play } from "lucide-react";
import { SlideshowPreset } from "../types";
import { AUDIO_TRACKS } from "../data";
import { isElectron, electronPickMusic } from "../bridge/electron";

interface SettingsPanelProps {
  preset: SlideshowPreset;
  setPreset: (preset: SlideshowPreset) => void;
  backgroundMode: "black-bars" | "blurred-fill" | "crop-fill";
  setBackgroundMode: (mode: "black-bars" | "blurred-fill" | "crop-fill") => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  musicTrackId: string;
  setMusicTrackId: (id: string) => void;
  musicPath: string;
  setMusicPath: (path: string) => void;
  onProceed: () => void;
  onPreview: () => void;
}

export default function SettingsPanel({
  preset,
  setPreset,
  backgroundMode,
  setBackgroundMode,
  musicEnabled,
  setMusicEnabled,
  musicTrackId,
  setMusicTrackId,
  musicPath,
  setMusicPath,
  onProceed,
  onPreview,
}: SettingsPanelProps) {
  const [customSlideSeconds, setCustomSlideSeconds] = useState(preset.slideDurationSeconds.toString());
  const [customEnabled, setCustomEnabled] = useState(false);

  const presetsList = [
    {
      id: "samsung-safe-1080p",
      label: "Samsung Safe 1080p",
      desc: "Full HD (1920x1080), 30fps. Maximum compatibility across older and newer Samsung Tizen televisions.",
      width: 1920,
      height: 1080,
      bitrate: "8–12 Mbps"
    },
    {
      id: "samsung-4k",
      label: "Samsung 4K Premium",
      desc: "UHD (3840x2160), 30fps. Exceptional sharpness for newer 4K TVs and QLED panels. High bitrates.",
      width: 3840,
      height: 2160,
      bitrate: "25–40 Mbps"
    },
    {
      id: "photo-folder-only",
      label: "Numbered Photo Album Folder only",
      desc: "Excludes video files. Standard folder export with normalized numbered list. Super-fast copy.",
      width: 3840,
      height: 2160,
      bitrate: "N/A"
    },
    {
      id: "both",
      label: "Both (Slideshow Video + Photo Folder)",
      desc: "Generates the complete MP4 slideshow file AND exports structured JPEG photos together.",
      width: 1920,
      height: 1080,
      bitrate: "10 Mbps"
    }
  ];

  const backgroundModes = [
    {
      id: "black-bars",
      label: "Black Bars (Letterbox)",
      desc: "Preserves the complete original picture ratio by centering the photo and padding remaining gaps with solid black bars.",
      demoBgClass: "bg-black"
    },
    {
      id: "blurred-fill",
      label: "Blurred Frame Padding",
      desc: "Creates an elegant modern framing by duplicating the photo in the background, scaling it to fill, and applying a heavy blur filter.",
      demoBgClass: "bg-indigo-950/25 banner-blur"
    },
    {
      id: "crop-fill",
      label: "Crop to Fill Canvas",
      desc: "Zooms and crops the photo so that it fits the entire 16:9 display canvas. Keeps screen empty of any borders but crops heads/tails.",
      demoBgClass: "bg-slate-700"
    }
  ];

  const changeSlideDuration = (sec: number) => {
    setCustomEnabled(false);
    setPreset({ ...preset, slideDurationSeconds: sec });
    setCustomSlideSeconds(sec.toString());
  };

  const handleCustomDurationChange = (val: string) => {
    setCustomSlideSeconds(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
      setPreset({ ...preset, slideDurationSeconds: parsed });
    }
  };

  const selectPresetId = (id: "samsung-safe-1080p" | "samsung-4k" | "photo-folder-only" | "both") => {
    const found = presetsList.find(p => p.id === id);
    if (found) {
      setPreset({
        ...preset,
        id,
        label: found.label,
        width: found.width,
        height: found.height,
        bitrateMbps: id === "samsung-4k" ? 30 : id === "photo-folder-only" ? 0 : 10
      });
    }
  };

  const currentTrack = AUDIO_TRACKS.find(t => t.id === musicTrackId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" id="panel-settings">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Slideshow Customizer</h2>
          <p className="text-slate-400 text-sm mt-1">
            Pick compatible playback formats, timings, visual transitions, and aesthetic canvas rules.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onPreview}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm border border-slate-700 transition flex items-center space-x-2 cursor-pointer"
            id="btn-settings-preview"
          >
            <Play className="w-4 h-4 fill-slate-200" />
            <span>Watch Live TV Preview</span>
          </button>
          <button
            onClick={onProceed}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm shadow-md transition flex items-center space-x-2"
            id="btn-settings-proceed"
          >
            <span>Proceed to Export</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presets and Timings Section (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preset Selector */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
              <Video className="w-4 h-4 text-indigo-400" />
              <span>1. Samsung TV Output Preset</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presetsList.map((pr) => {
                const isSelected = preset.id === pr.id;
                return (
                  <div
                    key={pr.id}
                    onClick={() => selectPresetId(pr.id as any)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-505/10 bg-indigo-600/5 shadow-lg shadow-indigo-950/20"
                        : "border-slate-800 bg-slate-900/30 hover:bg-slate-900/60"
                    }`}
                    id={`preset-option-${pr.id}`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          isSelected
                            ? "bg-indigo-950 text-indigo-400 border-indigo-800"
                            : "bg-slate-950 text-slate-500 border-slate-800"
                        }`}>
                          {pr.width ? `${pr.width}x${pr.height}` : "No Video"}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-2">{pr.label}</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{pr.desc}</p>
                    </div>
                    {pr.id === "photo-folder-only" && (
                      <p className="text-[10px] text-amber-400/90 mt-2 font-mono">Export panel will lock to JPEG folder only.</p>
                    )}
                    {pr.bitrate !== "N/A" && (
                      <div className="text-[10px] text-slate-400 font-mono mt-3 uppercase">
                        🔧 TARGET BITRATE: <strong className="text-indigo-400">{pr.bitrate}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timing / Slide Duration */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>2. Slide Duration Controls</span>
            </h3>

            <div className="flex flex-wrap gap-2.5 items-center">
              {[3, 5, 8, 10].map((sec) => (
                <button
                  key={sec}
                  onClick={() => changeSlideDuration(sec)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition ${
                    preset.slideDurationSeconds === sec && !customEnabled
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  {sec} SECONDS
                </button>
              ))}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setCustomEnabled(true);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition ${
                    customEnabled
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  CUSTOM
                </button>
                {customEnabled && (
                  <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={customSlideSeconds}
                      onChange={(e) => handleCustomDurationChange(e.target.value)}
                      className="w-10 bg-transparent text-center text-xs font-bold text-indigo-400 outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">sec</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              * Recommended value is <strong className="text-slate-400">5 seconds</strong> for viewing photos comfortably. Samsung Smart TV's native JPEG play rate is set to 5s by default.
            </p>
          </div>

          {/* Transitions Selector */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>3. Slide Transitions</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {(["none", "crossfade", "fade-to-black"] as const).map((tr) => {
                const active = preset.transition === tr;
                return (
                  <button
                    key={tr}
                    onClick={() => setPreset({ ...preset, transition: tr })}
                    className={`p-3 rounded-xl border text-center transition capitalize font-medium text-xs ${
                      active
                        ? "border-indigo-500 bg-indigo-650/10 text-indigo-400 bg-indigo-600/5 font-semibold"
                        : "border-slate-800 bg-slate-950 hover:bg-slate-805 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tr === "none" ? "None (Instant Cut)" : tr === "crossfade" ? "Crossfade ✨" : "Fade to Black 🎬"}
                  </button>
                );
              })}
            </div>
            <p className="text-slate-500 text-xs">
              MP4 only: <strong className="text-slate-400">Crossfade</strong> blends each slide into the next (0.5s overlap).{" "}
              <strong className="text-slate-400">Fade to black</strong> applies a cinematic fade on the video stream.{" "}
              JPEG folder export uses instant cuts — Samsung TV controls timing in slideshow mode.
            </p>
          </div>
        </div>

        {/* Visual Background Fitting & Music Setup Sidebars */}
        <div className="space-y-6">
          {/* Background Modes Filler */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>4. Background Padding (Ratio Fix)</span>
            </h3>

            <div className="space-y-3">
              {backgroundModes.map((bm) => {
                const isSelected = backgroundMode === bm.id;
                return (
                  <div
                    key={bm.id}
                    onClick={() => setBackgroundMode(bm.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition space-y-2 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-600/5 shadow"
                        : "border-slate-800 bg-slate-950 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-200">{bm.label}</h4>
                      {/* Interactive aspect ratio shape demonstration */}
                      <div className={`w-8 h-5 border border-slate-700 rounded overflow-hidden flex ${bm.demoBgClass}`}>
                        <div className="w-3 h-full bg-slate-400/80 mx-auto border-l border-r border-slate-700/30"></div>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{bm.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Music Integration */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
              <Music className="w-4 h-4 text-indigo-400" />
              <span>5. Background Ambiance Audio</span>
            </h3>

            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs text-slate-300">Play background music</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={musicEnabled}
                  onChange={(e) => setMusicEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650 peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            {musicEnabled && (
              <div className="space-y-2.5 pt-1">
                {isElectron() && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const picked = await electronPickMusic();
                        if (picked) setMusicPath(picked);
                      }}
                      className="w-full px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-xs font-mono rounded-lg border border-indigo-800"
                    >
                      {musicPath ? "Change music file…" : "Pick MP3 / AAC file (desktop)"}
                    </button>
                    {musicPath && (
                      <p className="text-[10px] text-green-400 font-mono truncate" title={musicPath}>
                        File: {musicPath.split(/[/\\]/).pop()}
                      </p>
                    )}
                    {!musicPath && (
                      <p className="text-[10px] text-slate-500">
                        Built-in tracks are labels only — pick a file above for real MP4 audio (desktop).
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs">
                  <Volume2 className="w-4 h-4 text-green-400 animate-pulse flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block">SELECTED TRACK</span>
                    <span className="text-slate-300 font-medium font-mono">
                      {musicPath && isElectron() ? musicPath.split(/[/\\]/).pop() : currentTrack?.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {AUDIO_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setMusicTrackId(track.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs font-mono transition flex justify-between items-center ${
                        musicTrackId === track.id
                          ? "bg-slate-800 text-indigo-400 border border-slate-700"
                          : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{track.label}</span>
                      <span className="text-[9px] text-slate-600 bg-slate-950 px-1 py-0.5 rounded ml-1">{track.duration}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!musicEnabled && (
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Adding background audio is optional. If disabled, slideshow generates silent video track which allows standard Smart TVs to mute/play independent radio feeds.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
