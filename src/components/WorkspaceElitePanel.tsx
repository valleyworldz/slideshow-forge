/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, FolderOpen, Terminal, Copy, Check, Zap } from "lucide-react";
import { WORKSPACE_DIR_NAME, WORKSPACE_ALBUM_NAME, WORKSPACE_CLI_HINTS } from "../core/workspace.shared";
import { isElectron } from "../bridge/electron";

interface WorkspaceElitePanelProps {
  onBrowseWorkspace: () => void;
  onLoadWorkspaceNative?: () => void;
  photosLoaded: number;
  loading?: boolean;
}

export default function WorkspaceElitePanel({
  onBrowseWorkspace,
  onLoadWorkspaceNative,
  photosLoaded,
  loading,
}: WorkspaceElitePanelProps) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const desktop = isElectron();

  const copyCmd = (key: keyof typeof WORKSPACE_CLI_HINTS, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-800/50 rounded-2xl p-5 space-y-4"
      id="elite-workspace-panel"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Elite workspace</h3>
          <span className="text-[10px] font-mono uppercase bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
            {WORKSPACE_DIR_NAME}
          </span>
          {desktop && (
            <span className="text-[10px] font-mono uppercase bg-green-950 text-green-400 px-2 py-0.5 rounded border border-green-800">
              Desktop
            </span>
          )}
        </div>
        {photosLoaded > 0 && <span className="text-[10px] font-mono text-green-400">{photosLoaded} loaded</span>}
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        {desktop
          ? "Instant load from disk — full FFmpeg export to any folder or USB drive."
          : "Production library at project root. Use Electron for full native export."}
      </p>

      {desktop && onLoadWorkspaceNative && (
        <button
          type="button"
          onClick={onLoadWorkspaceNative}
          disabled={loading}
          className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          id="btn-load-workspace-native"
        >
          <Zap className="w-4 h-4" />
          {loading ? "Loading workspace…" : `Load "${WORKSPACE_DIR_NAME}" instantly`}
        </button>
      )}

      <button
        type="button"
        onClick={onBrowseWorkspace}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        id="btn-load-workspace-folder"
      >
        <FolderOpen className="w-4 h-4" />
        {desktop ? "Pick another folder…" : `Browse "${WORKSPACE_DIR_NAME}"`}
      </button>

      {!desktop && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
            <Terminal className="w-3 h-3" /> CLI
          </span>
          {(Object.entries(WORKSPACE_CLI_HINTS) as [keyof typeof WORKSPACE_CLI_HINTS, string][]).map(([key, cmd]) => (
            <button
              key={key}
              type="button"
              onClick={() => copyCmd(key, cmd)}
              className="w-full text-left p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-indigo-300 flex justify-between items-center gap-2"
            >
              <span className="truncate">{cmd}</span>
              {copied === key ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-600" />}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Album: <strong className="text-slate-400">{WORKSPACE_ALBUM_NAME}</strong>
        {desktop ? " → pick USB or output/ on export" : " → output/Samsung_Slideshows/"}
      </p>
    </div>
  );
}
