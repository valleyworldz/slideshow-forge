# 📋 KANBAN & GIT REPO TRACKER — Slideshow Forge

> **Developer Kanban work style.** Actionable board synced to GitHub Issues & labels.

| Meta | Value |
|------|-------|
| Tag | `[META]` Project management |
| Repo | https://github.com/valleyworldz/slideshow-forge |
| Scope lock | **GitHub Issue #1** (created on doc pass) |

---

## 🏷️ Label Convention

| Label | Color intent | Use |
|-------|--------------|-----|
| `phase-0-foundation` | 🟢 | v3.0.0 core shipped |
| `phase-1-docs` | ⚪ | Documentation & metadata |
| `phase-2-hardening` | 🔴 | CI, codec, Samsung fixes |
| `phase-3-enhancements` | 🟡 | Transitions, UX polish |
| `elite-gate` | 🔴 | Must pass elite:approve |
| `core` | 🔵 | src/core |
| `ui` | 🟡 | React |
| `ipc` | 🟣 | Electron |
| `docs` | ⚪ | Markdown only |
| `blocked` | ⛔ | Waiting on external |

---

## 📌 Board Columns

### ✅ DONE (Phase 0 — Foundation)

| ID | Task | Artifact |
|----|------|----------|
| P0-1 | Core export pipeline (Sharp + FFmpeg) | `exporter.node.ts` |
| P0-2 | Electron desktop + IPC | `electron/` |
| P0-3 | CLI JSON for agents | `src/cli/` |
| P0-4 | Card format UI (grid, bulk, drag) | `ReviewPanel.tsx` |
| P0-5 | 25-step E2E + elite gate | `scripts/e2e.ts` |
| P0-6 | Elite workspace `photos for use` | `WORKSPACE.md` |
| P0-7 | Initial git push | `master` on GitHub |

### ✅ DONE (Phase 1 — Documentation Elite)

| ID | Task | Link |
|----|------|------|
| P1-1 | SOURCE_OF_TRUTH + root maps | [docs/SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) |
| P1-2 | Architecture & quality guide | [ARCHITECTURE_QUALITY_GUIDE.md](./ARCHITECTURE_QUALITY_GUIDE.md) |
| P1-3 | Metadata blocks on core files | [METADATA_CONVENTIONS.md](./METADATA_CONVENTIONS.md) |
| P1-4 | Consistency audit script | `npm run audit:consistency` |
| P1-5 | GitHub scope lock Issue #1 | [#1](https://github.com/valleyworldz/slideshow-forge/issues/1) |

### 🔄 IN PROGRESS (Phase 2 — Hardening)

| ID | Task | Status | Artifact |
|----|------|--------|----------|
| P2-1 | GitHub Actions CI | ✅ | `.github/workflows/elite-ci.yml` |
| P2-2 | MP4 yuv420p Samsung fix | ✅ | `ffmpeg.ts` + E2E pix_fmt check |
| P2-3 | Issue templates | ✅ | bug, feature, elite-gate, scope-lock |

### 📋 TODO (Phase 2 — remaining)

### 📋 TODO (Phase 3 — Enhancements)

| ID | Task | Status |
|----|------|--------|
| P3-1 | True inter-slide crossfade | ✅ `transitions.node.ts` + E2E |
| P3-2 | CHANGELOG automation | ✅ `CHANGELOG.md` + `changelog:check` |

---

## 🔀 Git Workflow

```
master (protected intent)
  │
  ├── feature/<id>-<short-name>
  ├── fix/<id>-<short-name>
  └── docs/<id>-<short-name>
```

| Step | Command |
|------|---------|
| Sync | `git pull origin master` |
| Branch | `git checkout -b docs/P1-1-source-of-truth` |
| Verify | `npm run test:production` |
| Consistency | `npm run audit:consistency` |
| PR | Link issue `#1` or phase issue |

---

## 📅 Milestone Map

| Milestone | Target | Exit criteria |
|-----------|--------|---------------|
| **M0: v3.0.0 GA** | ✅ Done | elite:approve pass, USB export works |
| **M1: Doc Elite** | ✅ Done | All docs linked, audit:consistency pass |
| **M2: CI Hardening** | ✅ Done | GitHub Actions green, yuv420p E2E |
| **M3: TV Pixel-perfect** | ✅ Done | yuv420p + true crossfade |

---

## 🔗 Issue Tracker Sync

After push, update this table with live issue URLs:

| Issue | Title | Phase |
|-------|-------|-------|
| [#1](https://github.com/valleyworldz/slideshow-forge/issues/1) | `[SCOPE LOCK] Slideshow Forge v3.x — Phases & Acceptance` | All |

Create labels (one-time):

```bash
gh label create "phase-1-docs" --color "0E8A16" --description "Documentation elite pass"
gh label create "elite-gate" --color "B60205" --description "Requires npm run elite:approve"
```

---

## ✅ Weekly Elite Ritual

1. `npm run workspace:export` — smoke export  
2. `npm run elite:approve` — full gate  
3. Update [SCORECARD.md](./SCORECARD.md) if scores change  
4. Move KANBAN items DONE → verify issue closed  
