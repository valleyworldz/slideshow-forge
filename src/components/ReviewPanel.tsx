/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Calendar,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  Check,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  PhotoAsset,
  BackgroundMode,
  CardAspectRatio,
  CardFrameMode,
  CardGridDensity,
} from "../types";
import {
  ASPECT_LABELS,
  FRAME_MODE_LABELS,
  GRID_DENSITY_CLASSES,
  THUMB_ASPECT_CLASS,
  patchPhoto,
  SLIDE_DURATION_PRESETS,
  resolveSlideDuration,
} from "../core/cardFormat";

interface ReviewPanelProps {
  photos: PhotoAsset[];
  setPhotos: (photos: PhotoAsset[]) => void;
  globalBackgroundMode: BackgroundMode;
  defaultSlideSeconds: number;
  cardGridDensity: CardGridDensity;
  setCardGridDensity: (d: CardGridDensity) => void;
  onProceed: () => void;
}

export default function ReviewPanel({
  photos,
  setPhotos,
  globalBackgroundMode,
  defaultSlideSeconds,
  cardGridDensity,
  setCardGridDensity,
  onProceed,
}: ReviewPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "warnings" | "duplicates">("all");
  const [sortBy, setSortBy] = useState<"date-asc" | "date-desc" | "name">("date-asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [bulkFrame, setBulkFrame] = useState<CardFrameMode>("default");
  const [bulkAspect, setBulkAspect] = useState<CardAspectRatio>("16:9");
  const [bulkSlide, setBulkSlide] = useState<string>("");

  const updatePhoto = (id: string, patch: Parameters<typeof patchPhoto>[1]) => {
    setPhotos(photos.map((p) => (p.id === id ? patchPhoto(p, patch) : p)));
  };

  const handleRotate = (id: string, amount: number) => {
    setPhotos(
      photos.map((photo) => {
        if (photo.id !== id) return photo;
        let current = photo.orientation || 1;
        let next = 1;
        if (amount === 90) {
          if (current === 1) next = 6;
          else if (current === 6) next = 3;
          else if (current === 3) next = 8;
          else next = 1;
        } else {
          if (current === 1) next = 8;
          else if (current === 8) next = 3;
          else if (current === 3) next = 6;
          else next = 1;
        }
        const newWarnings = photo.warnings.filter((w) => !w.includes("orientation") && !w.includes("Sideways"));
        if (next !== 1) {
          newWarnings.push(`Manual rotation: ${next === 6 ? "90° CW" : next === 3 ? "180°" : "90° CCW"}.`);
        }
        return { ...photo, orientation: next, warnings: newWarnings };
      })
    );
  };

  const handleDelete = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const reorder = (fromId: string, toId: string) => {
    const fromIdx = photos.findIndex((p) => p.id === fromId);
    const toIdx = photos.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const next = [...photos];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setPhotos(next);
  };

  const shiftIndex = (index: number, direction: "up" | "down") => {
    const list = sortedAndFilteredPhotos;
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= list.length) return;
    reorder(list[index].id, list[nextIndex].id);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllReady = () => {
    setSelected(new Set(photos.filter((p) => p.status === "ready").map((p) => p.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const applyBulk = (scope: "selected" | "all", patch: Parameters<typeof patchPhoto>[1]) => {
    setPhotos(
      photos.map((p) => {
        if (p.status !== "ready") return p;
        if (scope === "selected" && !selected.has(p.id)) return p;
        return patchPhoto(p, patch);
      })
    );
  };

  const sortedAndFilteredPhotos = useMemo(() => {
    let result = [...photos];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.filename.toLowerCase().includes(q));
    }
    if (filter === "ready") result = result.filter((p) => p.status === "ready");
    else if (filter === "warnings") result = result.filter((p) => p.warnings.length > 0 && p.status === "ready");
    else if (filter === "duplicates") result = result.filter((p) => p.status === "duplicate");

    if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.dateTaken ?? 0).getTime() - new Date(b.dateTaken ?? 0).getTime());
    } else if (sortBy === "date-desc") {
      result.sort((a, b) => new Date(b.dateTaken ?? 0).getTime() - new Date(a.dateTaken ?? 0).getTime());
    } else {
      result.sort((a, b) => a.filename.localeCompare(b.filename));
    }
    return result;
  }, [photos, search, filter, sortBy]);

  const readyPhotos = photos.filter((p) => p.status === "ready");

  const getOrientationRotationStyle = (o?: number) => {
    if (o === 6) return "rotate-90";
    if (o === 3) return "rotate-180";
    if (o === 8) return "-rotate-90";
    return "";
  };

  const frameLabel = (m?: CardFrameMode) => (m && m !== "default" ? FRAME_MODE_LABELS[m] : "Default");

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6" id="panel-review">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Review & Format Cards</h2>
          <p className="text-slate-400 text-sm mt-1">
            Drag to reorder, set per-card frame/aspect, bulk apply, then export with your formatting.
          </p>
        </div>
        <button
          onClick={onProceed}
          disabled={readyPhotos.length === 0}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center gap-2"
        >
          Continue to Settings →
        </button>
      </div>

      {/* Bulk + grid density toolbar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </span>
          {(["compact", "normal", "large"] as CardGridDensity[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setCardGridDensity(d)}
              className={`px-3 py-1 rounded-lg text-xs font-mono capitalize ${
                cardGridDensity === d ? "bg-indigo-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"
              }`}
            >
              {d}
            </button>
          ))}
          <span className="text-slate-700">|</span>
          <button type="button" onClick={selectAllReady} className="text-xs text-indigo-400 hover:underline">
            Select all ready
          </button>
          <button type="button" onClick={clearSelection} className="text-xs text-slate-500 hover:underline">
            Clear ({selected.size})
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs space-y-1">
            <span className="text-slate-500 font-mono block">Bulk frame</span>
            <select
              value={bulkFrame}
              onChange={(e) => setBulkFrame(e.target.value as CardFrameMode)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
            >
              {(Object.keys(FRAME_MODE_LABELS) as CardFrameMode[]).map((k) => (
                <option key={k} value={k}>
                  {FRAME_MODE_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500 font-mono block">Bulk aspect</span>
            <select
              value={bulkAspect}
              onChange={(e) => setBulkAspect(e.target.value as CardAspectRatio)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
            >
              {(Object.keys(ASPECT_LABELS) as CardAspectRatio[]).map((k) => (
                <option key={k} value={k}>
                  {ASPECT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => applyBulk("selected", { frameMode: bulkFrame, aspectRatio: bulkAspect })}
            disabled={selected.size === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs rounded-lg border border-slate-700"
          >
            Apply to selected
          </button>
          <button
            type="button"
            onClick={() => applyBulk("all", { frameMode: bulkFrame, aspectRatio: bulkAspect })}
            className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-xs rounded-lg border border-indigo-800"
          >
            Apply to all ready
          </button>
          <label className="text-xs space-y-1">
            <span className="text-slate-500 font-mono block">Bulk duration</span>
            <select
              value={bulkSlide}
              onChange={(e) => setBulkSlide(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
            >
              <option value="">— frame/aspect only —</option>
              <option value="default">Default ({defaultSlideSeconds}s)</option>
              {SLIDE_DURATION_PRESETS.map((s) => (
                <option key={s} value={String(s)}>
                  {s}s
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!bulkSlide || selected.size === 0}
            onClick={() => {
              const patch =
                bulkSlide === "default"
                  ? { slideDurationSeconds: undefined as undefined }
                  : { slideDurationSeconds: Number(bulkSlide) };
              applyBulk("selected", patch);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs rounded-lg border border-slate-700"
          >
            Apply duration to selected
          </button>
          <button
            type="button"
            disabled={!bulkSlide}
            onClick={() => {
              const patch =
                bulkSlide === "default"
                  ? { slideDurationSeconds: undefined as undefined }
                  : { slideDurationSeconds: Number(bulkSlide) };
              applyBulk("all", patch);
            }}
            className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-xs rounded-lg border border-indigo-800 disabled:opacity-40"
          >
            Apply duration to all ready
          </button>
        </div>
      </div>

      <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {(["all", "ready", "warnings", "duplicates"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                filter === f ? "bg-slate-800 text-slate-100 border border-slate-700" : "text-slate-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 md:justify-end">
          <span className="text-xs text-slate-500 font-mono">SORT</span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-950 border border-slate-800">
            <button type="button" onClick={() => setSortBy("date-asc")} className="p-1.5 rounded-md">
              <Calendar className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setSortBy("date-desc")} className="p-1.5 rounded-md">
              <Calendar className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setSortBy("name")} className="p-1.5 rounded-md">
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {sortedAndFilteredPhotos.length === 0 ? (
        <div className="border border-slate-800 bg-slate-900/10 rounded-2xl p-16 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 text-sm">No photos match filters</p>
        </div>
      ) : (
        <div className={GRID_DENSITY_CLASSES[cardGridDensity]} id="review-grid">
          {sortedAndFilteredPhotos.map((photo, index) => {
            const isRead = photo.status === "ready";
            const isDupe = photo.status === "duplicate";
            const isSel = selected.has(photo.id);
            const aspect = photo.aspectRatio ?? "16:9";

            return (
              <div
                key={photo.id}
                draggable={isRead}
                onDragStart={() => setDragId(photo.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) reorder(dragId, photo.id);
                  setDragId(null);
                }}
                className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col group transition ${
                  isSel ? "border-indigo-500 ring-1 ring-indigo-500/40" : "border-slate-800 hover:border-slate-600"
                } ${isDupe ? "opacity-70" : ""}`}
                id={`card-photo-${photo.id}`}
              >
                <div className={`relative bg-slate-950 flex items-center justify-center overflow-hidden ${THUMB_ASPECT_CLASS[aspect]}`}>
                  {isRead && (
                    <button
                      type="button"
                      onClick={() => toggleSelect(photo.id)}
                      className="absolute top-2 right-2 z-10 p-1 rounded bg-slate-950/90 border border-slate-700"
                    >
                      {isSel ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    </button>
                  )}
                  <div className={`w-full h-full ${getOrientationRotationStyle(photo.orientation)}`}>
                    <img
                      src={photo.originalPath}
                      alt=""
                      referrerPolicy="no-referrer"
                      className={`w-full h-full ${
                        (photo.frameMode ?? "default") === "crop-fill" || ((photo.frameMode ?? "default") === "default" && globalBackgroundMode === "crop-fill")
                          ? "object-cover"
                          : "object-contain"
                      }`}
                    />
                  </div>
                  <span className="absolute bottom-2 left-2 bg-slate-950/90 text-[10px] font-mono px-1.5 rounded border border-slate-800">
                    #{index + 1}
                  </span>
                </div>

                <div className="p-3 space-y-2 text-xs">
                  <p className="font-semibold text-slate-200 truncate" title={photo.filename}>
                    {photo.filename}
                  </p>

                  {isRead && (
                    <>
                      <label className="block">
                        <span className="text-[9px] text-slate-500 font-mono">FRAME</span>
                        <select
                          value={photo.frameMode ?? "default"}
                          onChange={(e) => updatePhoto(photo.id, { frameMode: e.target.value as CardFrameMode })}
                          className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                        >
                          {(Object.keys(FRAME_MODE_LABELS) as CardFrameMode[]).map((k) => (
                            <option key={k} value={k}>
                              {FRAME_MODE_LABELS[k]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[9px] text-slate-500 font-mono">ASPECT</span>
                        <select
                          value={photo.aspectRatio ?? "16:9"}
                          onChange={(e) => updatePhoto(photo.id, { aspectRatio: e.target.value as CardAspectRatio })}
                          className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                        >
                          {(Object.keys(ASPECT_LABELS) as CardAspectRatio[]).map((k) => (
                            <option key={k} value={k}>
                              {ASPECT_LABELS[k]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[9px] text-slate-500 font-mono">DURATION</span>
                        <select
                          value={
                            photo.slideDurationSeconds === undefined
                              ? ""
                              : String(photo.slideDurationSeconds)
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            updatePhoto(photo.id, {
                              slideDurationSeconds: v === "" ? undefined : Number(v),
                            });
                          }}
                          className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                        >
                          <option value="">Default ({defaultSlideSeconds}s)</option>
                          {SLIDE_DURATION_PRESETS.map((s) => (
                            <option key={s} value={String(s)}>
                              {s}s
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-[10px] text-indigo-400/80 font-mono">
                        Export: {frameLabel(photo.frameMode)} · {ASPECT_LABELS[aspect]} ·{" "}
                        {resolveSlideDuration(photo, defaultSlideSeconds)}s
                      </p>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    {isRead && (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => handleRotate(photo.id, -90)} className="p-1 bg-slate-800 rounded text-[10px]">
                          <RefreshCw className="w-3 h-3 -scale-y-100" />
                        </button>
                        <button type="button" onClick={() => handleRotate(photo.id, 90)} className="p-1 bg-slate-800 rounded text-[10px]">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => shiftIndex(index, "up")} disabled={index === 0} className="p-1 bg-slate-800 rounded disabled:opacity-30">
                          <ChevronUp className="w-3 h-3 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => shiftIndex(index, "down")}
                          disabled={index === sortedAndFilteredPhotos.length - 1}
                          className="p-1 bg-slate-800 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-3 h-3 -rotate-90" />
                        </button>
                      </div>
                    )}
                    <button type="button" onClick={() => handleDelete(photo.id)} className="p-1 text-slate-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
