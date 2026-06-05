# 🏗️ ARCHITECTURE & QUALITY GUIDE — Slideshow Forge v3.0.0

> **Plain-language architecture contract.** Every contributor and AI agent must align with these rules.

| Meta | Value |
|------|-------|
| Tag | `[META]` `[ELITE]` |
| Authority | [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) |
| Score target | **10+/10** all dimensions → [SCORECARD.md](./SCORECARD.md) |

---

## 1. Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│  🟡 PRESENTATION  src/components/*  src/App.tsx             │
├─────────────────────────────────────────────────────────────┤
│  🟣 DESKTOP IPC   electron/*  src/bridge/electron.ts        │
├─────────────────────────────────────────────────────────────┤
│  🔷 SURFACES      src/cli/*  src/server/*  export.browser   │
├─────────────────────────────────────────────────────────────┤
│  🔵 DOMAIN        src/core/types  cardFormat  presets       │
├─────────────────────────────────────────────────────────────┤
│  🟠 IO            exporter  processor  ffmpeg  scanner.node │
└─────────────────────────────────────────────────────────────┘
```

### Layer rules

| Layer | May import | Must NOT |
|-------|------------|----------|
| `[UI]` | domain types, browser adapters | Node fs, FFmpeg, sharp in components |
| `[IPC]` | core Node modules | React |
| `[API]` | core Node | React |
| `[CORE]` | other core only | React, Electron |
| `[IO]` | core | UI frameworks |

---

## 2. Core Module Responsibilities

| Module | Tag | Single responsibility |
|--------|-----|----------------------|
| `types.ts` | `[CORE]` | Canonical TypeScript contracts |
| `constants.ts` | `[CORE]` | App name, version (sync with package.json) |
| `presets.ts` | `[CORE]` | Samsung-safe resolution/FPS/bitrate presets |
| `cardFormat.ts` | `[CORE]` | Per-card frame, aspect, duration resolution |
| `exportMode.ts` | `[CORE]` | Preset ↔ export mode mapping |
| `scanner.node.ts` | `[IO]` | Filesystem scan + hash dedupe |
| `scanner.browser.ts` | `[UI]` | File API scan |
| `processor.node.ts` | `[IO]` | Sharp JPEG normalize to TV canvas |
| `processor.browser.ts` | `[UI]` | Canvas preview normalize |
| `ffmpeg.ts` | `[IO]` | FFmpeg detect + MP4 render |
| `exporter.node.ts` | `[IO]` | **Orchestrator** — only entry for disk export |
| `manifest.ts` | `[CORE]` | Manifest + TV README generation |
| `project.ts` | `[CORE]` | Project JSON load/save |
| `session.browser.ts` | `[UI]` | Browser session persistence |
| `workspace.ts` | `[WORKSPACE]` | Elite folder paths |
| `doctor.node.ts` | `[GATE]` | Environment validation |

---

## 3. Dual-Runtime Pattern

Many capabilities exist in **browser** and **Node** pairs:

| Concern | Browser | Node |
|---------|---------|------|
| Scan | `scanner.browser.ts` | `scanner.node.ts` |
| Process preview | `processor.browser.ts` | `processor.node.ts` |
| Dedupe | `dedupe.browser.ts` | `dedupe.node.ts` |
| Export | `export.browser.ts` (ZIP) | `exporter.node.ts` (full) |

**Rule:** Shared logic lives in `[CORE]` (types, cardFormat, presets). Never duplicate preset math.

---

## 4. Export Modes (single truth)

| Mode | JPEG folder | MP4 | Requires FFmpeg |
|------|-------------|-----|-----------------|
| `folder` | ✅ | ❌ | No |
| `mp4` | ❌ (frames internal) | ✅ | Yes |
| `both` | ✅ | ✅ | Yes |

Preset IDs map via `exportMode.ts` — UI preset dropdown must stay in sync.

---

## 5. Quality Standards (elite)

### Code quality

- TypeScript strict (`npm run lint`)
- No mock MP4 or fake success paths
- Errors surface to user/agent via `errors[]` in export result
- Idempotent export: `rm` album dir before write

### Documentation quality

- Every public module: elite metadata block (see [METADATA_CONVENTIONS.md](./METADATA_CONVENTIONS.md))
- Behavior change → update PIPELINE + E2E_MAP if user-visible
- Version in `constants.ts`, `package.json`, `metadata.json` must match

### Test quality

- 27 E2E steps minimum before merge
- Elite approve = doctor + build all surfaces + workspace scan + e2e
- Report JSON for machine parsing

### Security

- No secrets in repo (`.env*` gitignored, `.env.example` only)
- Electron: CSP in production only; dev allows Vite HMR
- No silent filesystem writes outside user-selected paths

---

## 6. Anti-Patterns (do not introduce)

| ❌ Anti-pattern | ✅ Instead |
|----------------|-----------|
| FFmpeg in React component | Call API / Electron IPC |
| Duplicate preset constants | Import from `presets.ts` |
| New export path bypassing `exporter.node` | Extend exporter |
| Contradicting docs | Update SOURCE_OF_TRUTH first |
| Committing workspace JPGs | Keep in `.gitignore` |

---

## 7. Release Checklist

```bash
npm run lint
npm run test:e2e
npm run elite:approve
npm run audit:consistency
```

Update `ELITE_APPROVED.md` date if gate re-run for release.

---

## 🔗 Cross-links

- [PIPELINE.md](./PIPELINE.md)
- [DIRECTORY_TREE.md](./DIRECTORY_TREE.md)
- [FLOW_MAP.md](../FLOW_MAP.md)
