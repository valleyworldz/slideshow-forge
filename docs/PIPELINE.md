# ⚙️ EXPORT PIPELINE — Slideshow Forge v3.0.0

> **Step-by-step export pipeline** — the heart of the product.

| Meta | Value |
|------|-------|
| Tag | `[IO]` `[CORE]` |
| Orchestrator | `src/core/exporter.node.ts` |
| Entry surfaces | CLI · Electron IPC · API server |

---

## Pipeline Overview

```
┌─────────┐   ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐
│  SCAN   │──►│ FILTER  │──►│ NORMALIZE│──►│  ENCODE │──►│ MANIFEST │
│ ready   │   │ ready   │   │  Sharp   │   │ FFmpeg  │   │ + README │
└─────────┘   └─────────┘   └──────────┘   └─────────┘   └──────────┘
```

---

## Stage 1 — Input Validation

**File:** `exporter.node.ts` → `runExport`

| Check | On fail |
|-------|---------|
| `photos.filter(status===ready).length > 0` | Return `success: false`, error message |
| Output dir writable | Node throws → caught in caller |
| FFmpeg if mode `mp4`/`both` | `doctor` / runtime check |

---

## Stage 2 — Directory Setup

```
outputDir/Samsung_Slideshows/<albumName>/
  _frames/          ← temporary (mp4 path)
  000001.jpg …      ← final numbered JPEGs (folder/both)
```

- Previous album dir **removed** (`rm recursive`) for idempotency
- `albumOutputPath()` from `processor.node.ts`

---

## Stage 3 — JPEG Normalize (Sharp)

**File:** `processor.node.ts` → `normalizePhotoToJpeg`

| Input | Processing |
|-------|------------|
| Source file path | EXIF orientation applied |
| Global `backgroundMode` | black-bars / blurred-fill / crop-fill |
| Per-card overrides | `cardFormat.buildNormalizeOptionsForPhoto` |
| Target preset | 1080p or 4K dimensions |

**Output:** `000001.jpg`, `000002.jpg`, … sequential numbering

---

## Stage 4 — Frame Expansion (variable duration)

**File:** `exporter.node.ts` + `cardFormat.resolveSlideDuration`

When slides have different `slideDurationSeconds`:

- Duplicate frame files in `_frames/` at `framesInputFps`
- FFmpeg reads expanded sequence

**TV folder mode:** JPEGs only — TV uses its own timing; manifest records intended durations.

---

## Stage 5 — MP4 Encode (FFmpeg)

**File:** `ffmpeg.ts` → `renderSlideshowMp4`

| Parameter | Source |
|-----------|--------|
| Codec | H.264 + AAC |
| FPS | preset.fps (30) |
| Bitrate | preset.bitrateMbps |
| Transitions | fade-in per slide (crossfade: future) |
| Music | optional `--music` path |

**Output:** `Samsung_Slideshow_Video.mp4`

---

## Stage 6 — Manifest & TV README

**File:** `manifest.ts`

| Artifact | Contents |
|----------|----------|
| `slideshow_manifest.json` | version, counts, preset, `sequence[]`, files |
| `README_TV_INSTRUCTIONS.txt` | Human steps for Samsung USB |

---

## Stage 7 — Cleanup

- Remove `_frames/` after successful MP4
- Return `ExportResult`: `{ success, outputDir, manifest, files, errors }`

---

## Surface-Specific Notes

| Surface | Pipeline variant |
|---------|------------------|
| **CLI** | Full pipeline to disk |
| **Electron** | Full pipeline; user picks output via dialog |
| **API** | Full pipeline → ZIP via `server/zip.ts` |
| **Web browser** | Client ZIP of JPEGs only (`export.browser.ts`) — no FFmpeg in browser |

---

## 🔗 Related

- [E2E_MAP.md](../E2E_MAP.md) Stage 3
- [ARCHITECTURE_QUALITY_GUIDE.md](./ARCHITECTURE_QUALITY_GUIDE.md) § Export modes
- [cardFormat.ts](../src/core/cardFormat.ts)
