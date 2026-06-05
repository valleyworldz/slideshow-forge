# Slideshow Forge — Agent integration

> **Tag:** `[API]` `[META]` · **Authority:** [docs/SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md)

Use the **CLI with `--json`** for all automated workflows.

## Prerequisites

```bash
npm install
npm run cli -- doctor --json
```

Ensure `data.ok === true` and FFmpeg is installed before MP4 exports.

## Documentation for agents

| Doc | Use when |
|-----|----------|
| [SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md) | Resolving contradictions |
| [ELITE_DEV_HANDOFF.md](./docs/ELITE_DEV_HANDOFF.md) | Onboarding + phase roadmap |
| [E2E_MAP.md](./E2E_MAP.md) | Understanding full pipeline |
| [PIPELINE.md](./docs/PIPELINE.md) | Export stage details |
| [TV_VALIDATION.md](./docs/TV_VALIDATION.md) | Samsung USB + tv-probe checks |
| [METADATA_CONVENTIONS.md](./docs/METADATA_CONVENTIONS.md) | Reading `@meta` blocks in source |

## Elite approval

```bash
npm run test:production      # lint + 27-step E2E + elite gate
npm run elite:approve        # standard gate (exit 0 = approved)
npm run audit:consistency    # doc/version sync
npm run elite:approve:full   # includes full 188-photo export (~30+ min)
```

Exports include `slideshow_manifest.json` with a `sequence[]` array (per-card frame, aspect, duration).

## Elite workspace (default)

Canonical photos: **`photos for use/`** at repo root.

```bash
slideshow-forge workspace scan --json
slideshow-forge workspace export --mode both --json
```

Or: `npm run workspace:scan` then `npm run workspace:export`  
Desktop: `npm run electron:dev`

## Recommended flows

### 1. Workspace export (preferred)

```bash
slideshow-forge workspace scan --json
slideshow-forge workspace export --mode both --json
```

### 2. Scan then export (custom folder)

```bash
slideshow-forge scan "photos for use" --json -o "photos for use/workspace.project.json"
slideshow-forge export -p "photos for use/workspace.project.json" -o ./output --mode both --json
```

### 3. Discover commands

```bash
slideshow-forge help-agent
```

## JSON contract

- Top-level: `{ "ok": boolean, "command": string, "data"?: T, "error"?: string }`
- Exit code `0` on success, `1` on failure
- Parse `data.errors` on export for per-file issues

## Output layout

```
output/
  Samsung_Slideshows/
  <AlbumName>/
    000001.jpg
    000002.jpg
    ...
    Samsung_Slideshow_Video.mp4   # when mode is mp4 or both
    slideshow_manifest.json
    README_TV_INSTRUCTIONS.txt
```

## Web UI vs CLI

| Feature | Web | CLI |
|---------|-----|-----|
| JPEG folder ZIP | Yes | Yes (writes to disk) |
| MP4 | Needs `npm run api` | Yes (FFmpeg) |
| Large libraries | Prefer CLI | Preferred |
| EXIF | Browser (exifr) | Node (exifr + sharp) |

## Do not

- Rely on mock MP4 blobs (removed in v3)
- Commit user photos or API keys
- Assume USB direct write from browser (user copies ZIP/folder manually)
- Contradict [SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md) without updating it first
