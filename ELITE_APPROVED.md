# Elite Approval — Slideshow Forge v3.0.0

> **Tag:** `[ELITE]` `[GATE]` · **Scorecard:** [docs/SCORECARD.md](./docs/SCORECARD.md)

**Status:** ✅ **APPROVED** (gate passed — `npm run elite:approve`)

| Gate | Result |
|------|--------|
| Workspace `photos for use` | ✅ |
| FFmpeg + Sharp | ✅ |
| Electron + Web + CLI builds | ✅ |
| E2E (25 checks, subset + MP4 + both) | ✅ |
| Consistency audit | ✅ `npm run audit:consistency` |

Re-verify anytime: `npm run elite:approve`  
Full 188-photo stress test: `npm run elite:approve:full`

## Elite stack (complete)

| Layer | Capability | Status |
|-------|------------|--------|
| **Workspace** | `photos for use/` canonical library | ✅ |
| **CLI** | scan, export, workspace, doctor, `--json` | ✅ |
| **Desktop** | Electron — native scan, FFmpeg MP4, USB picker | ✅ |
| **Web** | Vite UI, folder ZIP, API MP4 | ✅ |
| **Export** | Real JPEG normalize (Sharp), real H.264 (FFmpeg) | ✅ |
| **EXIF** | Orientation + dates via exifr | ✅ |
| **E2E** | Automated against workspace photos | ✅ |
| **Docs** | SOURCE_OF_TRUTH + maps + scorecard | ✅ |

## Elite workflow

```bash
# One-command approval (doctor + build + e2e)
npm run elite:approve

# Doc/version consistency
npm run audit:consistency

# Daily use (desktop)
npm run electron:dev

# Headless / AI agents
npm run workspace:export
```

## Output contract

```
output/Samsung_Slideshows/Elite_Slideshow/
  000001.jpg …
  Samsung_Slideshow_Video.mp4   (mode mp4/both)
  slideshow_manifest.json
  README_TV_INSTRUCTIONS.txt
```

## Requirements

- Node.js 20+
- FFmpeg on PATH
- Windows/macOS/Linux

## Not in scope (by design)

- Direct USB write without user picking folder (Electron: user selects drive)
- Cloud upload / Gemini (removed in v3)
- Mock MP4 or fake USB drives (removed in v3)

See also: [docs/KANBAN_TRACKER.md](./docs/KANBAN_TRACKER.md) · [GitHub Issue #1](https://github.com/valleyworldz/slideshow-forge/issues/1)

---

*Last gate: run `npm run elite:approve` and confirm exit code 0.*
