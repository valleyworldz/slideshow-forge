/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HelpCircle, HardDrive, Cpu, RefreshCw, Folder, Stethoscope } from "lucide-react";
import { isElectron, electronDoctor } from "../bridge/electron";
import { checkApiServer } from "../core/export.browser";

export default function HelpSettingsPanel() {
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorResult, setDoctorResult] = useState<string | null>(null);

  const runEnvironmentCheck = async () => {
    setDoctorLoading(true);
    setDoctorResult(null);
    try {
      if (isElectron()) {
        const d = await electronDoctor();
        if (!d) {
          setDoctorResult("Doctor unavailable.");
          return;
        }
        setDoctorResult(
          `Electron · FFmpeg ${d.ffmpeg.installed ? "✓" : "✗"} · Sharp ${d.sharp.ok ? "✓" : "✗"} · HEIC ${d.sharp.heic ? "✓" : "✗"}`
        );
      } else {
        const api = await checkApiServer();
        setDoctorResult(
          api.available
            ? `API ✓ v${api.version} · FFmpeg ${api.ffmpeg ? "✓" : "✗ (MP4 needs FFmpeg)"}`
            : "API offline — run: npm run dev:full for MP4 in browser, or npm run electron:dev"
        );
      }
    } finally {
      setDoctorLoading(false);
    }
  };

  const specs = [
    {
      title: "Preferred USB Format",
      safe: "exFAT",
      desc: "Samsung TVs support FAT, NTFS, and exFAT on newer UHD/QLED models. exFAT is highly recommended for individual slideshows > 4GB.",
      icon: HardDrive,
    },
    {
      title: "Direct Connection Only",
      safe: "Direct USB Ports",
      desc: "Avoid connecting USB hubs or extension strips. Samsung warns that multi-hub routing can block high-bandwidth streams.",
      icon: Cpu,
    },
    {
      title: "Maximum Folder Volume",
      safe: "Under 1,000 files per directory",
      desc: "Samsung Smart TVs exhibit explorer list crashes or stalls when reading folders holding > 1,000 images. Limit indices securely.",
      icon: Folder,
    },
    {
      title: "Optimal Core Encoder",
      safe: "H.264 (AVC) + Stereo AAC",
      desc: "MP4 container compiled under YUV420p chromatic sub-sampling triggers hardware decoding engines. Exceeding 40 Mbps can stutter.",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" id="panel-help">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Samsung Compatibility Rules</h2>
        <p className="text-slate-400 text-sm mt-1">
          Reference list of tested technical parameters conforming with Tizen Smart TV engines.
        </p>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void runEnvironmentCheck()}
          disabled={doctorLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-xl flex items-center gap-2"
        >
          <Stethoscope className="w-4 h-4" />
          {doctorLoading ? "Checking…" : "Run environment check"}
        </button>
        {doctorResult && <span className="text-xs font-mono text-slate-300">{doctorResult}</span>}
        <p className="text-[10px] text-slate-500 w-full">
          CLI: <code className="text-indigo-300">npm run doctor</code> · Full test:{" "}
          <code className="text-indigo-300">npm run test:production</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specs.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-start space-x-4"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1 truncate">
                <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                <div className="flex items-center space-x-1 font-mono text-[9px] font-bold text-green-400 uppercase bg-green-950/40 px-1.5 py-0.5 rounded w-max border border-green-900/20">
                  <span>SAFE DEFAULT:</span>
                  <span>{item.safe}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mt-2 select-text">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900/15 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Frequently Asked Samsung TV Playback FAQ</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <h5 className="font-semibold text-slate-200">Q: Why did my phone&apos;s portrait video play sideways on the TV?</h5>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Smartphones store rotation in EXIF tags. Many TVs ignore EXIF. Slideshow Forge bakes rotation into exported JPEGs and MP4 frames.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-200">Q: Per-card timing in Review — does the TV use it?</h5>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Per-photo seconds are written to <code className="text-indigo-300">slideshow_manifest.json</code> and used for MP4 length. Numbered JPEG folders use the TV&apos;s slideshow interval unless you play the bundled MP4.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-200">Q: Best workflow for ~200 photos?</h5>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Use <code className="text-indigo-300">npm run electron:dev</code> or <code className="text-indigo-300">npm run workspace:export</code> — browser ZIP is for smaller sets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
