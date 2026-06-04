/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Eye,
  Settings,
  Tv,
  History,
  HelpCircle,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  photosCount: number;
}

export default function Sidebar({ currentTab, setTab, photosCount }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "import", label: "Import Photos", icon: FolderOpen, count: photosCount > 0 ? photosCount : undefined },
    { id: "review", label: "Review & Sort", icon: Eye },
    { id: "settings", label: "Slideshow Settings", icon: Settings },
    { id: "export", label: "Export to USB", icon: Tv },
    { id: "history", label: "History & Logs", icon: History },
    { id: "help", label: "TV Compatibility", icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between h-full select-none" id="app-sidebar">
      <div>
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white leading-tight">Slideshow Forge</h1>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">Elite v3.0</span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 outline-none ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 pl-2.5"
                    : "hover:bg-slate-800/60 hover:text-slate-100 text-slate-400"
                }`}
                id={`btn-tab-${item.id}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Panel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="text-slate-500 font-mono text-[10px] flex justify-between">
          <span>SYSTEM READY</span>
          <span className="text-green-500 font-bold animate-pulse">● LOCAL</span>
        </div>
        <p className="text-slate-400 mt-1 font-sans leading-relaxed">
          Optimized for Samsung Smart TV engines (Tizen T6+ & UHD Standards).
        </p>
      </div>
    </div>
  );
}
