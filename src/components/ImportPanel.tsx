/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { FolderOpen, Upload, ClipboardCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { PhotoAsset } from "../types";
import { processBrowserFiles } from "../core/scanner.browser";
import { applyPersistedEdits, clearPhotoSession, loadPhotoSession, revokePhotoObjectUrls } from "../core/session.browser";
import { WORKSPACE_DIR_NAME } from "../core/workspace.shared";
import WorkspaceElitePanel from "./WorkspaceElitePanel";
import { isElectron, electronPickFolder, electronScanFolder } from "../bridge/electron";
import { SAMPLE_PHOTOS } from "../data";

interface ImportPanelProps {
  photos: PhotoAsset[];
  setPhotos: (photos: PhotoAsset[]) => void;
  onContinue: () => void;
  onLoadWorkspaceNative?: () => void;
  workspaceLoading?: boolean;
}

export default function ImportPanel({
  photos,
  setPhotos,
  onContinue,
  onLoadWorkspaceNative,
  workspaceLoading,
}: ImportPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [recursive, setRecursive] = useState(true);
  const [dedupe, setDedupe] = useState(true);
  const [fixRotation, setFixRotation] = useState(true);
  const [autoConvert, setAutoConvert] = useState(true);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const scanOptions = {
    recursive,
    dedupe,
    fixRotation,
    autoConvert,
  };

  const processFiles = async (files: FileList) => {
    setScanning(true);
    try {
      const fileArray = Array.from(files);
      const filtered = recursive
        ? fileArray
        : fileArray.filter((f) => !f.webkitRelativePath || !f.webkitRelativePath.includes("/"));

      const assets = await processBrowserFiles(filtered, photos, scanOptions);
      setPhotos(applyPersistedEdits([...photos, ...assets]));
    } finally {
      setScanning(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
  };

  const loadSampleAlbum = () => setPhotos(SAMPLE_PHOTOS);

  const pickFolderNative = async () => {
    const folder = await electronPickFolder();
    if (!folder) return;
    setScanning(true);
    try {
      const result = await electronScanFolder(folder, scanOptions);
      if (result) setPhotos([...photos, ...result.photos]);
    } finally {
      setScanning(false);
    }
  };

  const clearAllPhotos = () => {
    if (confirm("Clear all scanned photos?")) {
      revokePhotoObjectUrls(photos);
      clearPhotoSession();
      setPhotos([]);
    }
  };

  const savedSession = !isElectron() ? loadPhotoSession() : null;

  const readyPhotos = photos.filter((p) => p.status === "ready");
  const duplicatePhotos = photos.filter((p) => p.status === "duplicate");
  const unsupportedPhotos = photos.filter((p) => p.status === "unsupported");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" id="panel-import">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Import Photo Folders</h2>
          <p className="text-slate-400 text-sm mt-1">Photos stay on your device until export. EXIF orientation is read when enabled.</p>
        </div>
        {photos.length > 0 && (
          <button
            onClick={clearAllPhotos}
            className="text-xs text-red-400 hover:text-red-300 border border-red-900/40 px-3 py-1.5 rounded-lg font-mono"
            id="btn-clear-photos"
          >
            CLEAR SCANNED
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer min-h-[350px] ${
              isDragging ? "border-indigo-500 bg-indigo-500/5" : "border-slate-800 bg-slate-900/20 hover:border-slate-700"
            }`}
            id="drag-drop-zone"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden" />
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFileSelect}
              multiple
              {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
              className="hidden"
              id="workspace-folder-input"
            />
            <Upload className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-base font-medium text-slate-200">
              {scanning ? "Scanning…" : "Drag your folder or files here"}
            </h3>
            <p className="text-slate-500 text-xs mt-1 text-center">JPG, PNG, HEIC, WebP, BMP — use CLI for bulk HEIC on Windows</p>
            <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium"
              >
                Browse Files
              </button>
              <button
                type="button"
                id="btn-import-workspace-folder"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="px-4 py-2 bg-indigo-950 text-indigo-200 border border-indigo-700 rounded-xl text-sm font-medium"
              >
                {WORKSPACE_DIR_NAME}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm"
              >
                Other folder
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadSampleAlbum();
                }}
                className="px-4 py-2 bg-slate-900 text-indigo-300 border border-slate-800 rounded-xl text-sm"
              >
                Load Samples
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-xs text-slate-400 flex items-start space-x-3">
            <ClipboardCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Elite export:</span>{" "}
              <code className="text-indigo-300">npm run workspace:export</code>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {savedSession && photos.length === 0 && (
        <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl px-4 py-3 text-xs text-indigo-200">
          Previous card edits are saved ({savedSession.order.length} photos). Re-import the same folder to restore order and formatting.
        </div>
      )}

      <WorkspaceElitePanel
            photosLoaded={readyPhotos.length}
            loading={workspaceLoading}
            onLoadWorkspaceNative={onLoadWorkspaceNative}
            onBrowseWorkspace={() => (isElectron() ? pickFolderNative() : folderInputRef.current?.click())}
          />
          <div className="bg-slate-900/45 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase border-b border-slate-800 pb-2">Scan options</h4>
            {[
              { key: "recursive", label: "Include subfolders", state: recursive, set: setRecursive },
              { key: "dedupe", label: "Deduplicate", state: dedupe, set: setDedupe },
              { key: "fixRotation", label: "Read EXIF orientation", state: fixRotation, set: setFixRotation },
              {
                key: "autoConvert",
                label: isElectron() ? "Transcode HEIC/WebP on export" : "Allow HEIC/WebP (off = skip in browser)",
                state: autoConvert,
                set: setAutoConvert,
              },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center space-x-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={opt.state}
                  onChange={(e) => opt.set(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 w-4 h-4 bg-slate-950"
                />
                <span className="text-slate-200">{opt.label}</span>
              </label>
            ))}
          </div>

          {photos.length > 0 && (
            <div className="bg-slate-900/45 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase border-b border-slate-800 pb-2">Scan report</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">TOTAL</span>
                  <span className="text-white text-lg font-bold">{photos.length}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-green-500 block">READY</span>
                  <span className="text-green-400 text-lg font-bold">{readyPhotos.length}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-yellow-500 block">DUPLICATES</span>
                  <span className="text-yellow-500 text-lg font-bold">{duplicatePhotos.length}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-red-500 block">SKIPPED</span>
                  <span className="text-red-400 text-lg font-bold">{unsupportedPhotos.length}</span>
                </div>
              </div>
              {unsupportedPhotos.length > 0 && (
                <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3 text-[11px] text-red-300 flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {unsupportedPhotos.length} unsupported file(s) skipped.
                </div>
              )}
              <button
                onClick={onContinue}
                disabled={readyPhotos.length === 0}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Proceed with {readyPhotos.length} photos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
