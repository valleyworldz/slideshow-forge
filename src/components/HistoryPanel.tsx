/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { History, FileSpreadsheet, HardDrive, Calendar, CheckSquare, Layers, Download } from "lucide-react";
import { HistoryItem } from "../types";

interface HistoryPanelProps {
  history: HistoryItem[];
}

export default function HistoryPanel({ history }: HistoryPanelProps) {
  const downloadManifestJson = (item: HistoryItem) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item.manifest, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `slideshow_manifest_${item.id}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" id="panel-history">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">History & Manifest Logs</h2>
        <p className="text-slate-400 text-sm mt-1">
          Review previous export events, structures, and download original compliance manifests.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="border border-slate-800 bg-slate-900/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <History className="w-12 h-12 text-slate-700 stroke-1 mb-3" />
          <h3 className="text-slate-300 font-medium text-sm">No Exports Logged Yet</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">
            Ejected TV-safe slideshows are tracked here with comprehensive compliance audits. Run an export to populate the queue.
          </p>
        </div>
      ) : (
        <div className="space-y-4" id="history-items">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
              id={`history-item-${item.id}`}
            >
              {/* Event Metadata */}
              <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 pr-0 md:pr-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-green-950/40 border border-green-900/40 flex items-center justify-center text-green-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase truncate max-w-[130px]" title={item.name}>
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.timestamp}</p>
                </div>
              </div>

              {/* Composition config details */}
              <div className="md:col-span-2 grid grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Preset</span>
                  <span className="text-slate-300 truncate font-semibold block uppercase">{item.preset.replace("Samsung ", "")}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Photos</span>
                  <span className="text-indigo-400 font-bold block">{item.photosCount} files</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">USB Stick Format</span>
                  <span className="text-green-500 font-bold block uppercase">{item.manifest.usbFormat || "exFAT"}</span>
                </div>
              </div>

              {/* Actions & Manifest Trigger */}
              <div className="md:col-span-1 flex flex-row md:flex-col justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => downloadManifestJson(item)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700 rounded-xl font-mono text-[10px] font-bold tracking-wide uppercase flex items-center justify-center space-x-1.5 transition flex-1 md:flex-none cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>MANIFEST JSON</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manifest Specification Guide */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-3 font-sans">
        <h4 className="text-sm font-semibold text-white tracking-wide flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          <span>About compliant JSON Manifests</span>
        </h4>
        <p className="text-slate-400 text-xs leading-relaxed">
          Samsung Smart TVs run on highly optimized <strong>Tizen OS file systems</strong>. When browsing photo folders, index buffer stalls or lag can happen if the device reads directory counts out of logic order. 
          Slideshow Forge writes a standardized <code className="text-indigo-400">slideshow_manifest.json</code> alongside your media files. This acts as a localized ledger describing:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-500 pl-4 list-disc">
          <li>Deterministic alphanumeric photo sequences.</li>
          <li>Original pre-transcode properties for safe storage records.</li>
          <li>Pruned duplicate and corrupted block count indicators.</li>
          <li>Target canvas widths and exact rendering bitrates.</li>
        </ul>
      </div>
    </div>
  );
}
