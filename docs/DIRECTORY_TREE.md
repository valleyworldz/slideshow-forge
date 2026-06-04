# 🌳 DIRECTORY TREE — Slideshow Forge v3.0.0

> Annotated layout. `[tag]` = layer from [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md).

```
slideshow-forge/                          [META] Repository root
│
├── 📄 README.md                          [META] Master entry — start here
├── 📄 E2E_MAP.md                         [META] End-to-end journey map
├── 📄 FLOW_MAP.md                        [META] Mermaid flow diagrams
├── 📄 AGENTS.md                          [META] AI agent JSON contract
├── 📄 ELITE_APPROVED.md                  [ELITE] Gate status snapshot
├── 📄 metadata.json                      [META] App metadata (version sync)
├── 📄 package.json                       [META] Scripts, deps, version 3.0.0
├── 📄 .env.example                       [META] Env template (no secrets)
├── 📄 .gitignore                         [META] output/, photos, e2e-output/
├── 📄 index.html                         [UI] Vite HTML shell
├── 📄 vite.config.ts                     [UI] Dev server + API proxy
├── 📄 tsconfig.json                      [META] TypeScript config
│
├── 📁 docs/                              [META] Documentation hub
│   ├── SOURCE_OF_TRUTH.md                ★ Canonical index
│   ├── ARCHITECTURE_QUALITY_GUIDE.md     Layers + quality rules
│   ├── SCORECARD.md                      10+ aspect scores
│   ├── KANBAN_TRACKER.md                 Phases + git tracker
│   ├── PIPELINE.md                       Export stages
│   ├── DIRECTORY_TREE.md                 This file
│   ├── METADATA_CONVENTIONS.md           File header standard
│   └── ELITE_CONSISTENCY_AUDIT.md        Audit checklist
│
├── 📁 .github/                           [META] GitHub templates
│   └── ISSUE_TEMPLATE/
│       └── scope-lock.yml                Scope lock issue template
│
├── 📁 electron/                          [IPC] Desktop shell
│   ├── main.ts                           IPC handlers, export, CSP
│   └── preload.ts                        contextBridge API
│
├── 📁 scripts/                           [GATE] Automation
│   ├── e2e.ts                            25 production checks
│   ├── elite-check.ts                    7-gate approval
│   └── consistency-audit.ts              Doc/version consistency
│
├── 📁 photos for use/                    [WORKSPACE] Elite photo library
│   ├── WORKSPACE.md                      Workspace playbook (tracked)
│   ├── *.jpg                             (gitignored ~188 photos)
│   └── workspace.project.json            (gitignored generated)
│
├── 📁 src/
│   ├── main.tsx                          [UI] React entry
│   ├── App.tsx                           [UI] Root state, tabs, autosave
│   ├── index.css                         [UI] Tailwind base
│   ├── data.ts                           [UI] Static help copy
│   ├── types.ts                          [UI] Re-exports / UI types
│   │
│   ├── 📁 bridge/
│   │   └── electron.ts                   [IPC] Renderer → preload wrappers
│   │
│   ├── 📁 types/
│   │   └── electron.d.ts                 [IPC] Window API types
│   │
│   ├── 📁 components/                    [UI] React panels
│   │   ├── Sidebar.tsx                   Navigation
│   │   ├── ImportPanel.tsx               File/folder import
│   │   ├── ReviewPanel.tsx               Grid, card format, reorder
│   │   ├── SettingsPanel.tsx             Preset, music, background
│   │   ├── ExportPanel.tsx               Export modes, progress
│   │   ├── TvPreviewWidget.tsx           Live TV frame preview
│   │   ├── HistoryPanel.tsx              Export history
│   │   ├── HelpSettingsPanel.tsx         Help + doctor check
│   │   └── WorkspaceElitePanel.tsx       Elite workspace shortcuts
│   │
│   ├── 📁 core/                          [CORE] + [IO] Domain
│   │   ├── types.ts                      ★ Canonical types
│   │   ├── constants.ts                  App name + version
│   │   ├── presets.ts                    Samsung presets
│   │   ├── cardFormat.ts                 Per-card format logic
│   │   ├── exportMode.ts                 Preset ↔ mode
│   │   ├── project.ts                    Project JSON I/O
│   │   ├── manifest.ts                   Export manifest + TV README
│   │   ├── workspace.ts                  Workspace paths (Node)
│   │   ├── workspace.shared.ts           Shared workspace constants
│   │   ├── exif.ts                       EXIF helpers
│   │   ├── doctor.node.ts                [GATE] Environment check
│   │   ├── scanner.node.ts               [IO] Folder scan
│   │   ├── scanner.browser.ts            [UI] Browser scan
│   │   ├── processor.node.ts             [IO] Sharp normalize
│   │   ├── processor.browser.ts          [UI] Canvas preview
│   │   ├── exporter.node.ts              [IO] ★ Export orchestrator
│   │   ├── ffmpeg.ts                     [IO] MP4 render
│   │   ├── export.browser.ts             [UI] Client ZIP export
│   │   ├── session.browser.ts            [UI] Session persist
│   │   ├── storage.browser.ts            [UI] Settings/history
│   │   ├── dedupe.node.ts                [IO] Hash dedupe
│   │   └── dedupe.browser.ts             [UI] Browser dedupe
│   │
│   ├── 📁 cli/
│   │   └── index.ts                      [API] CLI + --json
│   │
│   └── 📁 server/
│       ├── index.ts                      [API] Express export API
│       └── zip.ts                        [API] ZIP builder
│
├── 📁 dist/                              (build) Web + cli.mjs
├── 📁 dist-electron/                     (build) main.cjs, preload.cjs
├── 📁 output/                            (gitignored) Export output
└── 📁 e2e-output/                        (gitignored) Test reports
```

---

## Quick navigation by task

| I want to… | Go to |
|------------|-------|
| Change export behavior | `src/core/exporter.node.ts` |
| Add CLI command | `src/cli/index.ts` |
| Fix Electron export | `electron/main.ts` |
| Edit review grid | `src/components/ReviewPanel.tsx` |
| Add E2E check | `scripts/e2e.ts` |
| Update docs | `docs/SOURCE_OF_TRUTH.md` first |
