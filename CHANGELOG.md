# Changelog

All notable changes to **Slideshow Forge** are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Authority: [docs/SOURCE_OF_TRUTH.md](docs/SOURCE_OF_TRUTH.md)

---

## [Unreleased]

### Added

- **Parallel Sharp normalize** during export — configurable pool via `normalizeConcurrency` (`concurrency.node.ts`)
- Export phase **timing benchmarks** logged and returned as `ExportResult.timing`
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md) — baseline template and stress commands

### Changed

- Export pipeline: two-phase normalize (parallel) then frame assembly (sequential); eliminates duplicate Sharp pass per slide

## [3.1.0] - 2026-05-24

### Added

- **True inter-slide crossfade** for MP4 — Sharp blends overlap frames between slides (`transitions.node.ts`)
- E2E step `export-crossfade-transitions` (27 total checks)
- `CHANGELOG.md` and `npm run changelog:check` version sync gate

### Changed

- Crossfade no longer uses FFmpeg fade-in only; transitions are baked into `_frames/` before encode
- Settings panel copy reflects real crossfade behavior
- Version bump 3.0.0 → 3.1.0

---

## [3.0.0] - 2026-05-24

### Added

- Electron desktop app with native scan, export, USB picker
- CLI with `--json` for AI agents (`slideshow-forge`)
- Web UI + local Export API
- Per-card format: frame, aspect, duration, bulk apply, drag-drop reorder
- Elite workspace `photos for use/` workflow
- 26-step production E2E + elite approval gate
- Full documentation hub (SOURCE_OF_TRUTH, E2E_MAP, FLOW_MAP, scorecard, kanban)
- GitHub Actions Elite CI workflow
- Samsung MP4 hardening: `yuv420p`, BT.709, ffprobe E2E check
- Issue templates: scope lock, bug, feature, elite gate

### Removed

- Mock MP4 blobs and cloud upload paths (by design)

---

[Unreleased]: https://github.com/valleyworldz/slideshow-forge/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/valleyworldz/slideshow-forge/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/valleyworldz/slideshow-forge/releases/tag/v3.0.0
