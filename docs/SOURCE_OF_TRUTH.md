# 🏛️ SOURCE OF TRUTH — Slideshow Forge v3.1.0

> **Single canonical index.** If any document contradicts this file, **this file wins** until updated via PR + elite audit.

| Field | Value |
|-------|-------|
| **Product** | Slideshow Forge |
| **Version** | `3.1.0` |
| **Repo** | [github.com/valleyworldz/slideshow-forge](https://github.com/valleyworldz/slideshow-forge) |
| **License** | Apache-2.0 |
| **Primary output** | Samsung Smart TV USB slideshows (numbered JPEG folder + optional H.264 MP4) |
| **Elite workspace** | `photos for use/` (~188 JPGs, gitignored) |
| **Default album** | `Elite_Slideshow` |
| **Approval gate** | `npm run elite:approve` → exit `0` |

---

## 🎨 Color / Tag Legend (use everywhere)

| Tag | Color | Meaning | Example paths |
|-----|-------|---------|---------------|
| `[ELITE]` | 🟢 Green | Production-approved, gate-tested | `ELITE_APPROVED.md`, elite scripts |
| `[CORE]` | 🔵 Blue | Domain logic, shared types, no UI | `src/core/*` |
| `[UI]` | 🟡 Yellow | React presentation | `src/components/*`, `App.tsx` |
| `[IPC]` | 🟣 Purple | Electron main/preload/bridge | `electron/*`, `src/bridge/*` |
| `[IO]` | 🟠 Orange | Filesystem, FFmpeg, Sharp | `exporter.node.ts`, `ffmpeg.ts` |
| `[API]` | 🔷 Cyan | HTTP server + CLI surface | `src/server/*`, `src/cli/*` |
| `[GATE]` | 🔴 Red | Tests, audits, quality | `scripts/e2e.ts`, `scripts/elite-check.ts` |
| `[META]` | ⚪ Gray | Documentation only | `docs/*`, `README.md` |
| `[WORKSPACE]` | 🟤 Brown | Canonical photo library | `photos for use/` |

---

## 📚 Document Map (read order)

| # | Document | Audience | Purpose |
|---|----------|----------|---------|
| 1 | [README.md](../README.md) | Everyone | Master entry, quick start, score summary |
| 2 | [ELITE_DEV_HANDOFF.md](./ELITE_DEV_HANDOFF.md) | Incoming dev / release owner | Full onboarding + P4–P8 roadmap |
| 3 | [E2E_MAP.md](../E2E_MAP.md) | Devs, QA, AI | End-to-end journey map |
| 4 | [FLOW_MAP.md](../FLOW_MAP.md) | Architects | Data/control flow diagrams |
| 5 | [docs/ARCHITECTURE_QUALITY_GUIDE.md](./ARCHITECTURE_QUALITY_GUIDE.md) | Elite devs | Layers, responsibilities, quality rules |
| 6 | [docs/PIPELINE.md](./PIPELINE.md) | Export engineers | Scan → normalize → encode → manifest |
| 7 | [docs/DIRECTORY_TREE.md](./DIRECTORY_TREE.md) | Onboarding | Annotated tree |
| 8 | [docs/SCORECARD.md](./SCORECARD.md) | Stakeholders | 10+ aspect scores |
| 9 | [docs/KANBAN_TRACKER.md](./KANBAN_TRACKER.md) | PM / dev | Phases, issues, git tracker |
| 10 | [docs/METADATA_CONVENTIONS.md](./METADATA_CONVENTIONS.md) | Contributors | File header blocks |
| 11 | [docs/ELITE_CONSISTENCY_AUDIT.md](./ELITE_CONSISTENCY_AUDIT.md) | Release | Consistency checklist + script |
| 12 | [CHANGELOG.md](../CHANGELOG.md) | Release | Version history (Keep a Changelog) |
| 13 | [AGENTS.md](../AGENTS.md) | AI agents | JSON CLI contract |
| 14 | [ELITE_APPROVED.md](../ELITE_APPROVED.md) | Release | Last gate status |

---

## 🧱 Structural Intent (why this repo exists)

```
INPUT:  Folder of photos (JPG/PNG/HEIC…)
           ↓
PROCESS: Scan → dedupe → EXIF → per-card format → normalize (Sharp)
           ↓
OUTPUT: Samsung_Slideshows/<Album>/
           ├── 000001.jpg … 000NNN.jpg   [TV folder mode]
           ├── Samsung_Slideshow_Video.mp4 [optional MP4]
           ├── slideshow_manifest.json
           └── README_TV_INSTRUCTIONS.txt
```

**Non-goals (locked):** cloud upload, mock MP4, silent USB write without user consent, committing user photos.

---

## 🔗 GitHub Tracker

| Artifact | Link |
|----------|------|
| **Scope lock issue** | [GitHub Issue #1](https://github.com/valleyworldz/slideshow-forge/issues/1) |
| **Labels** | `phase-*`, `elite-gate`, `docs`, `core`, `ui`, `blocked` |
| **Branch** | `master` (protected workflow: lint → e2e → elite) |

---

## ✅ Definition of Done (global)

1. Code change includes updated doc cross-links if behavior changed  
2. `npm run lint` passes  
3. `npm run test:e2e` passes (27/27)  
4. `npm run elite:approve` exit `0`  
5. `npm run audit:consistency` exit `0`
6. `npm run changelog:check` exit `0`
7. No contradiction with this SOURCE OF TRUTH

---

*Last updated: v3.1.0 — Elite Dev Handoff + P4 release engineering*
