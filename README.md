# Slideshow Forge

Convert photo folders into **Samsung Smart TV–ready** USB slideshows:

- **Numbered JPEG folder** — native TV photo slideshow mode  
- **H.264 MP4** — press Play on one file (requires FFmpeg)  
- **CLI with JSON output** — built for humans and AI agents  

## Requirements

- **Node.js 20+**
- **FFmpeg** on PATH (for MP4 / “both” mode) — [ffmpeg.org](https://ffmpeg.org/download.html)
- Windows: `winget install ffmpeg` or add `ffmpeg.exe` to PATH

Verify:

```bash
npm run doctor
slideshow-forge doctor --json
```

## Quick start (Desktop — recommended)

```bash
npm install
npm run electron:dev
```

Opens the **Electron** app with native access to `photos for use`, FFmpeg MP4 export, and USB folder picker.

## Quick start (Web UI)

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:full     # UI + export API (MP4 in browser)
```

1. **Import** photos or a folder  
2. **Review** order and rotation  
3. **Settings** — resolution, timing, background  
4. **Export** — folder mode works offline; MP4 needs `npm run api` or CLI  

Copy the downloaded ZIP to your USB stick ( **exFAT** recommended ). Extract so `Samsung_Slideshows/YourAlbum/` is on the drive.

## CLI (AI-agent friendly)

All commands support **`--json`** for structured output.

```bash
# Help for agents
npm run cli -- help-agent

# Scan folder
npm run cli -- scan ./photos --json -o project.json

# Export to disk (full quality + real MP4)
npm run cli -- export -i ./photos -o ./output --mode both --name "Summer_2024" --json

# From saved project
npm run cli -- export -p project.json -o ./output --mode mp4 --json
```

### Install global CLI (optional)

```bash
npm run build
npm link
slideshow-forge export -i C:\Photos\Vacation -o D:\exports --mode both --json
```

### Common flags

| Flag | Values |
|------|--------|
| `--mode` | `folder`, `mp4`, `both` |
| `--preset` | `samsung-safe-1080p`, `samsung-4k` |
| `--background` | `black-bars`, `blurred-fill`, `crop-fill` |
| `--duration` | seconds per slide (default 5) |
| `--transition` | `none`, `crossfade`, `fade-to-black` |
| `--music` | path to audio file (optional) |

### JSON response shape

```json
{
  "ok": true,
  "command": "export",
  "data": {
    "success": true,
    "outputDir": "C:\\output\\Samsung_Slideshows\\Summer_2024",
    "manifest": { ... },
    "files": ["000001.jpg", "Samsung_Slideshow_Video.mp4"],
    "errors": []
  }
}
```

## Export API (for web MP4)

```bash
npm run api    # http://127.0.0.1:3847
```

Endpoints:

- `GET /api/health` — FFmpeg / Sharp status  
- `POST /api/export` — multipart upload → ZIP download  

The Vite dev server proxies `/api` to this port when using `npm run dev:full`.

## Architecture

| Layer | Role |
|-------|------|
| `src/core/` | Shared types, EXIF, scan, Sharp processing, FFmpeg, manifest |
| `src/cli/` | Node CLI (`slideshow-forge`) |
| `src/server/` | Local export API |
| `src/components/` | React UI |

## Elite approval

```bash
npm run elite:approve
```

Runs doctor, builds (web + CLI + Electron), workspace scan, and E2E. Exit code `0` = **elite approved** (see `ELITE_APPROVED.md`).

## Elite workspace: `photos for use`

Your production photo library lives at **`photos for use/`** in the project root (~188 JPGs). This is the default for tests, CLI, and the recommended web import folder.

```bash
npm run workspace:scan    # writes photos for use/workspace.project.json
npm run workspace:export  # → output/Samsung_Slideshows/Elite_Slideshow/
```

See `photos for use/WORKSPACE.md` for the full elite playbook.

## E2E tests

Production E2E (`scripts/e2e.ts`) runs **25 checks** on `photos for use/` (subset of 8 photos by default):

- Environment (doctor, FFmpeg, Sharp)
- Card format helpers + project JSON round-trip
- Exports: folder / MP4 / both, per-card frame/aspect/duration, all background modes, 4K + folder-only presets
- CLI `--json` (doctor, scan, export)
- API health + ZIP export
- Electron + web + CLI artifacts

```bash
npm run test:e2e              # ~5–8 min, 25/25
npm run test:e2e:full         # + export all 188 photos
npm run test:production       # lint + e2e + elite:approve
npm run test:production:full  # lint + full e2e + elite (long)
```

Report: `e2e-output/e2e-report.json`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run elite:approve` | **Full approval gate** (build + e2e) |
| `npm run electron:dev` | **Desktop app** (full native export) |
| `npm run electron:start` | Production desktop build |
| `npm run workspace:scan` | Scan elite workspace → project file |
| `npm run workspace:export` | Export workspace to `./output` |
| `npm run test:e2e` | Production E2E (24 checks, subset) |
| `npm run test:production` | Lint + E2E + elite approval gate |
| `npm run dev` | Web UI only |
| `npm run dev:full` | Web UI + API |
| `npm run api` | Export API server |
| `npm run cli -- <cmd>` | Run CLI |
| `npm run build` | Production web + CLI bundle |
| `npm run doctor` | Environment check |

## License

Apache-2.0
