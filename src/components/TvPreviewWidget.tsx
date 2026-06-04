/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, Maximize2, AlertCircle, Info, Disc } from "lucide-react";
import { PhotoAsset, SlideshowPreset } from "../types";
import { resolveFrameMode, resolveSlideDuration, resolveAspectRatio, THUMB_ASPECT_CLASS } from "../core/cardFormat";

interface TvPreviewWidgetProps {
  photos: PhotoAsset[];
  preset: SlideshowPreset;
  backgroundMode: "black-bars" | "blurred-fill" | "crop-fill";
  musicEnabled: boolean;
  musicTrackId: string;
}

export default function TvPreviewWidget({
  photos,
  preset,
  backgroundMode,
  musicEnabled,
  musicTrackId,
}: TvPreviewWidgetProps) {
  const readyPhotos = photos.filter((p) => p.status === "ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCrtFilter, setIsCrtFilter] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const safeIndex = readyPhotos.length > 0 ? currentIndex % readyPhotos.length : 0;
  const previewPhoto = readyPhotos[safeIndex];
  const slideSeconds = previewPhoto?.slideDurationSeconds ?? preset.slideDurationSeconds;

  // Auto progression trigger
  useEffect(() => {
    if (isPlaying && readyPhotos.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % readyPhotos.length);
      }, slideSeconds * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, readyPhotos.length, slideSeconds]);

  // Reset indices if image list changes or is emptied
  useEffect(() => {
    setCurrentIndex(0);
  }, [readyPhotos.length]);

  const togglePlay = () => {
    if (readyPhotos.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (readyPhotos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % readyPhotos.length);
  };

  const handlePrev = () => {
    if (readyPhotos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + readyPhotos.length) % readyPhotos.length);
  };

  if (readyPhotos.length === 0) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[350px] aspect-[16/9] shadow-inner" id="preview-empty">
        <AlertCircle className="w-12 h-12 text-slate-700 stroke-1 mb-3 animate-pulse" />
        <h4 className="text-slate-400 font-semibold text-sm">TV Preview Monitor Offline</h4>
        <p className="text-slate-600 text-xs mt-1.5 max-w-xs leading-relaxed">
          Please import your photos or load the sample album to spin up the TV simulator feed.
        </p>
      </div>
    );
  }

  const currentPhoto = previewPhoto!;
  const effectiveFrame = resolveFrameMode(currentPhoto, backgroundMode);
  const aspectBoxClass = THUMB_ASPECT_CLASS[resolveAspectRatio(currentPhoto)];

  // Rotate helper in CSS classes
  const getRotationAngleClass = (o?: number) => {
    if (o === 6) return "rotate-90";
    if (o === 3) return "rotate-180";
    if (o === 8) return "-rotate-90";
    return "";
  };

  // Duration in hours/minutes/seconds formatted
  const formatTotalDurationString = () => {
    const totalSecs = readyPhotos.reduce(
      (sum, p) => sum + resolveSlideDuration(p, preset.slideDurationSeconds),
      0
    );
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentSecondsPlayed = readyPhotos
    .slice(0, safeIndex)
    .reduce((sum, p) => sum + resolveSlideDuration(p, preset.slideDurationSeconds), 0);
  const formatCurrentTimeString = () => {
    const mins = Math.floor(currentSecondsPlayed / 60);
    const secs = currentSecondsPlayed % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xl shadow-black/85" id="tv-preview-monitor">
      {/* Upper header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-slate-400 tracking-wider">SAMSUNG TV EMULATOR FEED</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono font-bold">
          <button
            onClick={() => setIsCrtFilter(!isCrtFilter)}
            className={`px-2 py-0.5 rounded border ${
              isCrtFilter
                ? "bg-indigo-950 text-indigo-400 border-indigo-800"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            CRT GRID
          </button>
          <span className="bg-indigo-950 text-indigo-400 border border-indigo-800/40 px-2 py-0.5 rounded">
            {preset.id === "samsung-4k" ? "3840 x 2160 (4K)" : "1920 x 1080 (FHD)"}
          </span>
        </div>
      </div>

      {/* 16:9 Display Canvas Container */}
      <div className={`relative aspect-[16/9] w-full bg-black rounded-lg overflow-hidden shadow-inner border border-slate-900 group select-none ${isCrtFilter ? "crt-ambient-scanner" : ""}`}>
        {/* Render fitting modes depending on backgroundMode selection */}
        {effectiveFrame === "blurred-fill" && (
          <div className="absolute inset-0 select-none overflow-hidden blur-[12px] opacity-40 scale-110 pointer-events-none">
            <img
              src={currentPhoto.originalPath}
              alt=""
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-[600ms] ${getRotationAngleClass(currentPhoto.orientation)}`}
            />
          </div>
        )}

        {/* Live slide representation */}
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 p-[8%]">
          <div className={`relative max-w-full max-h-full overflow-hidden bg-black ${aspectBoxClass}`}>
            <img
              src={currentPhoto.originalPath}
              alt={currentPhoto.filename}
              referrerPolicy="no-referrer"
              className={`w-full h-full transition-all duration-500 ${
                effectiveFrame === "crop-fill" ? "object-cover" : "object-contain"
              } ${getRotationAngleClass(currentPhoto.orientation)}`}
            />
          </div>
        </div>

        {/* Transition overlays simulator visually */}
        {preset.transition === "fade-to-black" && isPlaying && (
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply opacity-50 animate-pulse pointer-events-none"></div>
        )}

        {/* Samsung Smart TV OSD Overlay HUD */}
        <div className="absolute top-4 left-4 right-4 bg-slate-950/80 backdrop-blur border border-slate-800/40 p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-650/40 flex items-center justify-center text-indigo-400">
              <span className="font-mono text-xs font-bold">{currentIndex + 1}</span>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-slate-100 truncate max-w-[200px]">{currentPhoto.filename}</h5>
              <p className="text-[10px] text-slate-400 font-mono">
                {currentPhoto.width}x{currentPhoto.height} • {preset.transition === "none" ? "No transition" : preset.transition}
              </p>
            </div>
          </div>
          {musicEnabled && (
            <div className="flex items-center space-x-2 text-[10px] text-green-400 font-mono bg-green-950/20 px-2 py-1 rounded border border-green-900/30">
              <Disc className="w-3.5 h-3.5 animate-spin" />
              <span className="font-bold">Music Stream Active</span>
            </div>
          )}
        </div>

        {/* TV Progress Track bar */}
        <div className="absolute bottom-12 left-4 right-4 bg-slate-950/70 p-1.5 rounded-md flex items-center space-x-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] text-slate-400 font-mono">{formatCurrentTimeString()}</span>
          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(currentIndex / readyPhotos.length) * 100}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{formatTotalDurationString()}</span>
        </div>

        {/* Player Controls inside screen */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-slate-950/90 border border-slate-800/80 rounded-full py-1 px-4 flex items-center space-x-3.5 text-slate-400">
            <button onClick={handlePrev} className="hover:text-white transition">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePlay} className="p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition">
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>
            <button onClick={handleNext} className="hover:text-white transition">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Simulated CRT Screen scanlines */}
        {isCrtFilter && (
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]"></div>
        )}
      </div>

      {/* Control Instruction Bar */}
      <div className="flex items-start space-x-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-[10px] text-slate-500 leading-normal">
        <Info className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        <div>
          Samsung televisions loop lists in alphabetical or numerical sequence. Slideshow Forge exports numbered files (<code className="text-slate-400">000001.jpg</code>) and a standard playlist manifest so sequencing matches this preview perfectly.
        </div>
      </div>
    </div>
  );
}
