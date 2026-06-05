# 🗺️ E2E MAP — Slideshow Forge v3.0.0

> **End-to-end map:** every actor, surface, and artifact from photo folder to Samsung TV USB.

| Meta | Value |
|------|-------|
| Tag | `[META]` + `[GATE]` |
| Companion | [FLOW_MAP.md](./FLOW_MAP.md) · [docs/PIPELINE.md](./docs/PIPELINE.md) |
| Verify | `npm run test:e2e` → `e2e-output/e2e-report.json` |

---

## 🎯 Actors

| Actor | Surface | Primary command |
|-------|---------|-----------------|
| **Human (desktop)** | Electron app | `npm run electron:dev` |
| **Human (web)** | Browser UI | `npm run dev:full` |
| **AI / automation** | CLI JSON | `slideshow-forge workspace export --json` |
| **CI / release** | Elite gate | `npm run elite:approve` |
| **Samsung TV** | USB consumer | Copy `Samsung_Slideshows/<Album>/` to exFAT stick |

---

## 🟢 Stage 0 — Environment

```
Node 20+ ──► npm install ──► npm run doctor
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
              FFmpeg OK?                   Sharp OK?
              (MP4 path)                   (JPEG normalize)
```

**Gate:** `[GATE]` doctor + E2E steps 1–26  
**Fail fast:** No FFmpeg → folder-only export still works; MP4/both blocked with clear message.

---

## 🔵 Stage 1 — Ingest

| Path | Scanner | Session persist |
|------|---------|-----------------|
| Electron | `scanner.node` via IPC | `workspace.project.json` + debounced autosave |
| CLI | `scanner.node` | `-o project.json` |
| Web | `scanner.browser` + File API | `session.browser` / localStorage |
| Elite workspace | `photos for use/` | `npm run workspace:scan` |

**Outputs:** `PhotoAsset[]` with status `ready|duplicate|unsupported|error`

---

## 🟡 Stage 2 — Review & Format (UI)

```
ImportPanel ──► ReviewPanel ──► SettingsPanel
                    │                │
                    │    per-card: frame, aspect, duration
                    │    bulk apply, drag-drop reorder
                    └────► TvPreviewWidget (live preview)
```

**Core helpers:** `[CORE]` `cardFormat.ts`, `session.browser.ts`  
**E2E:** card format round-trip, bulk apply, variable duration MP4

---

## 🟠 Stage 3 — Export Pipeline

```
PhotoAsset[] + preset + backgroundMode
        │
        ▼
┌─────────────────── exporter.node [IO] ───────────────────┐
│ 1. normalizePhotoToJpeg (Sharp) → 000001.jpg …         │
│ 2. optional _frames/ expansion (per-slide duration)    │
│ 3. renderSlideshowMp4 (FFmpeg) if mode mp4|both         │
│ 4. buildManifest + README_TV_INSTRUCTIONS.txt          │
└────────────────────────────────────────────────────────┘
        │
        ▼
output/Samsung_Slideshows/<AlbumName>/
```

**Surfaces that call export:**

| Surface | Entry | Mode |
|---------|-------|------|
| Electron IPC | `electron/main.ts` → `runExport` | folder, mp4, both |
| CLI | `src/cli/index.ts export` | all |
| API | `POST /api/export` → ZIP | folder + mp4 via server |
| Web ZIP | `export.browser.ts` | folder (client-side) |

---

## 🔷 Stage 4 — Delivery

```
Export folder ──► User copies to USB (exFAT) ──► Samsung TV
                      │
                      ├── Photo mode: open numbered JPG folder
                      └── Video mode: play Samsung_Slideshow_Video.mp4
```

**Manifest:** `slideshow_manifest.json` records `sequence[]` for audit/repro.

---

## 🔴 Stage 5 — Quality Gates (automated E2E — 27 checks)

| # | Check | Layer |
|---|-------|-------|
| 1 | doctor | `[GATE]` |
| 2 | card-format-helpers | `[CORE]` |
| 3–4 | artifacts-cli, artifacts-electron | `[API]` `[IPC]` |
| 5–7 | scan-full-inventory, prepare-subset, project-card-fields-roundtrip | `[CORE]` |
| 8–12 | export-folder/mp4/both subset, pix_fmt yuv420p, crossfade | `[IO]` |
| 13 | session-persist-roundtrip | `[CORE]` |
| 14–15 | export-card-formats mp4 + folder | `[IO]` |
| 16–18 | export-background (black-bars, blurred-fill, crop-fill) | `[IO]` |
| 19–20 | export-preset-4k-mp4, export-preset-folder-only | `[IO]` |
| 21–23 | cli-doctor/scan/export JSON | `[API]` |
| 24–25 | api-health, api-export-zip | `[API]` |
| 26 | export-full-inventory-folder (skipped unless `E2E_FULL=1`) | `[IO]` |
| 27 | artifacts-web-dist | `[UI]` |

**Full stress:** `E2E_FULL=1` → all ~188 workspace photos (step 26 runs instead of skip).

---

## 📦 Artifact Traceability

```
photos for use/*.jpg          (gitignored INPUT)
        ↓
workspace.project.json        (generated, gitignored)
        ↓
e2e-output/ or output/        (gitignored OUTPUT)
        ↓
e2e-output/e2e-report.json    (gitignored REPORT)
```

---

## 🔗 Quick Links

- [SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md)
- [FLOW_MAP.md](./FLOW_MAP.md)
- [scripts/e2e.ts](./scripts/e2e.ts)
