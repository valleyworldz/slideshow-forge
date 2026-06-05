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
| P0-5 | 27-step E2E + elite gate | `scripts/e2e.ts` |
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

### ✅ DONE (Phase 2 — Hardening)

| ID | Task | Artifact |
|----|------|----------|
| P2-1 | GitHub Actions CI | `.github/workflows/elite-ci.yml` |
| P2-2 | MP4 yuv420p Samsung fix | `ffmpeg.ts` + E2E pix_fmt check |
| P2-3 | Issue templates | bug, feature, elite-gate, scope-lock |

### ✅ DONE (Phase 3 — Enhancements)

| ID | Task | Artifact |
|----|------|----------|
| P3-1 | True inter-slide crossfade | `transitions.node.ts` + E2E |
| P3-2 | CHANGELOG automation | `CHANGELOG.md` + `changelog:check` |
| P3-3 | Elite Dev Handoff doc | [ELITE_DEV_HANDOFF.md](./ELITE_DEV_HANDOFF.md) |

### 📋 TODO (Phase 4 — Release engineering)

| ID | Task | Status |
|----|------|--------|
| P4-1 | Git tag `v3.1.0` on GitHub | ✅ [v3.1.0](https://github.com/valleyworldz/slideshow-forge/releases/tag/v3.1.0) |
| P4-2 | GitHub Release from CHANGELOG | ✅ |
| P4-3 | Branch protection + Elite CI required | ✅ `Lint · Audit · Build · E2E` on `master` |
| P4-4 | electron-builder Windows `.exe` (optional) | Deferred → [#3](https://github.com/valleyworldz/slideshow-forge/issues/3) |
| P4-5 | Update Issue #1 phases | ✅ |

### 📋 TODO (Phase 5 — Performance & scale)

| ID | Task | Status |
|----|------|--------|
| P5-1 | 188-photo export benchmark | ✅ timing in logs + `ExportResult.timing` |
| P5-2 | Parallel Sharp normalize | ✅ `concurrency.node.ts` + two-phase export |
| P5-3 | Export progress UI polish | ✅ finer progress during normalize/frames |
| P5-4 | E2E timing budget or HW doc | ✅ [PERFORMANCE.md](./PERFORMANCE.md) |

### 📋 TODO (Phase 6 — TV validation)

| ID | Task | Status |
|----|------|--------|
| P6-1 | `docs/TV_VALIDATION.md` | TODO |
| P6-2 | Manual Samsung USB sign-off | TODO |
| P6-3 | Optional `scripts/tv-probe.ts` | TODO |

### 📋 TODO (Phase 7 — fade-to-black bake)

| ID | Task | Status |
|----|------|--------|
| P7-1 | Bake fade in `transitions.node.ts` | TODO |
| P7-2 | Wire exporter + E2E | TODO |

### 📋 TODO (Phase 8 — Distribution & agents)

| ID | Task | Status |
|----|------|--------|
| P8-1 | `docs/AGENT_RECIPES.md` | TODO |
| P8-2 | OpenAPI for Export API | TODO |
| P8-3 | Dockerfile headless export | TODO |

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
