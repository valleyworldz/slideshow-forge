# 🏆 Slideshow Forge v3.0.0

[![Elite CI](https://github.com/valleyworldz/slideshow-forge/actions/workflows/elite-ci.yml/badge.svg)](https://github.com/valleyworldz/slideshow-forge/actions/workflows/elite-ci.yml)
[![Elite Gate](https://img.shields.io/badge/elite--gate-passing-brightgreen?style=for-the-badge)](./ELITE_APPROVED.md)
[![Version](https://img.shields.io/badge/version-3.0.0-blue?style=for-the-badge)](./package.json)
[![License](https://img.shields.io/badge/license-Apache--2.0-orange?style=for-the-badge)](./package.json)
[![Docs](https://img.shields.io/badge/docs-SOURCE%20OF%20TRUTH-purple?style=for-the-badge)](./docs/SOURCE_OF_TRUTH.md)

> **Convert photo folders into Samsung Smart TV–ready USB slideshows** — numbered JPEG folders, H.264 MP4, CLI with JSON for AI agents, and an Electron desktop app.

---

## 🎯 At a Glance

| | |
|---|---|
| **Input** | Folder of photos (`photos for use/` = elite workspace) |
| **Output** | `Samsung_Slideshows/<Album>/` → USB (exFAT) → Samsung TV |
| **Surfaces** | 🟣 Electron · 🟡 Web · 🔷 CLI · 🔷 API |
| **Approval** | `npm run elite:approve` → exit `0` = **[ELITE]** ✅ |
| **Composite score** | **10.3 / 10** → [SCORECARD](./docs/SCORECARD.md) |

---

## 🗺️ Documentation Hub (read in order)

| # | Document | Tag | Purpose |
|---|----------|-----|---------|
| ★ | [**SOURCE OF TRUTH**](./docs/SOURCE_OF_TRUTH.md) | ⚪ `[META]` | Canonical index — **wins on conflict** |
| 1 | [**E2E MAP**](./E2E_MAP.md) | ⚪ | End-to-end journey (actors → USB → TV) |
| 2 | [**FLOW MAP**](./FLOW_MAP.md) | ⚪ | Mermaid architecture & IPC flows |
| 3 | [Architecture & Quality Guide](./docs/ARCHITECTURE_QUALITY_GUIDE.md) | 🔵 | Layers, rules, anti-patterns |
| 4 | [Export Pipeline](./docs/PIPELINE.md) | 🟠 | Scan → Sharp → FFmpeg → manifest |
| 5 | [Directory Tree](./docs/DIRECTORY_TREE.md) | ⚪ | Annotated file layout |
| 6 | [Elite Scorecard](./docs/SCORECARD.md) | 🟢 | 15 aspects @ 10+ |
| 7 | [Kanban & Git Tracker](./docs/KANBAN_TRACKER.md) | ⚪ | Phases, issues, workflow |
| 8 | [Metadata Conventions](./docs/METADATA_CONVENTIONS.md) | ⚪ | `@meta` file headers |
| 9 | [Consistency Audit](./docs/ELITE_CONSISTENCY_AUDIT.md) | 🔴 | Manual + `audit:consistency` |
| 10 | [AGENTS.md](./AGENTS.md) | 🔷 | AI agent JSON contract |
| 11 | [ELITE APPROVED](./ELITE_APPROVED.md) | 🟢 | Last gate snapshot |

---

## 🚀 Quick Start

### Requirements

- **Node.js 20+**
- **FFmpeg** on PATH (MP4 / both mode) — `winget install ffmpeg`
- Verify: `npm run doctor`

### Desktop (recommended) — `[IPC]`

```bash
npm install
npm run electron:dev
```

Native access to `photos for use`, FFmpeg export, USB folder picker.

### Web UI — `[UI]`

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:full     # UI + export API
```

### CLI (AI agents) — `[API]`

```bash
npm run cli -- help-agent
npm run workspace:export -- --mode both --json
```

---

## 📊 Elite Score Summary

| Aspect | Score |
|--------|-------|
| Clarity | **11** |
| Architecture | **11** |
| Documentation | **11** |
| AI readiness | **11** |
| Production | **10** |
| Tests (26 E2E) | **10** |

Full breakdown → [**docs/SCORECARD.md**](./docs/SCORECARD.md)

---

## 🏗️ Architecture (one screen)

```
🟡 UI (React)  →  🟣 Electron IPC  →  🟠 exporter.node  →  Sharp + FFmpeg
                 →  🔷 CLI / API     ↗
🔵 CORE: types · presets · cardFormat · manifest
```

Diagrams → [**FLOW_MAP.md**](./FLOW_MAP.md)

---

## 🔴 Quality Gates

```bash
npm run lint                 # TypeScript
npm run test:e2e             # 26 checks (~5–8 min)
npm run elite:approve        # doctor + build + e2e
npm run audit:consistency    # doc/version sync
npm run test:production      # lint + e2e + elite (all-in-one)
```

Report: `e2e-output/e2e-report.json`

---

## 📁 Elite Workspace — `[WORKSPACE]`

Canonical library: **`photos for use/`** (~188 JPGs, gitignored)

```bash
npm run workspace:scan
npm run workspace:export
```

Playbook → [`photos for use/WORKSPACE.md`](./photos%20for%20use/WORKSPACE.md)

---

## 📦 Output Layout

```
output/Samsung_Slideshows/<AlbumName>/
  000001.jpg … 000NNN.jpg
  Samsung_Slideshow_Video.mp4      # mp4 | both
  slideshow_manifest.json
  README_TV_INSTRUCTIONS.txt
```

---

## 🛠️ Scripts Reference

| Script | Tag | Description |
|--------|-----|-------------|
| `npm run electron:dev` | `[IPC]` | Desktop dev app |
| `npm run electron:start` | `[IPC]` | Production desktop |
| `npm run workspace:export` | `[IO]` | Export elite workspace |
| `npm run elite:approve` | `[GATE]` | Full approval gate |
| `npm run test:e2e` | `[GATE]` | 26-step E2E |
| `npm run audit:consistency` | `[GATE]` | Doc/version audit |
| `npm run cli -- <cmd>` | `[API]` | CLI with `--json` |
| `npm run api` | `[API]` | Export API `:3847` |

---

## 📋 Project Tracker

Phases, GitHub issues, and Kanban board → [**docs/KANBAN_TRACKER.md**](./docs/KANBAN_TRACKER.md)

**Scope lock:** GitHub Issue **#1** — phases & acceptance criteria.

---

## 🎨 Tag Legend

| Tag | Layer |
|-----|-------|
| 🟢 `[ELITE]` | Production approved |
| 🔵 `[CORE]` | Domain logic |
| 🟡 `[UI]` | React |
| 🟣 `[IPC]` | Electron |
| 🟠 `[IO]` | Sharp / FFmpeg / disk |
| 🔷 `[API]` | CLI / HTTP |
| 🔴 `[GATE]` | Tests & audits |
| ⚪ `[META]` | Documentation |

---

## License

Apache-2.0

---

<p align="center"><strong>Developer Kanban · Elite Documentation · v3.0.0</strong></p>
