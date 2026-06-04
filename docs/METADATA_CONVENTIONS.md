# 🏷️ METADATA CONVENTIONS — Slideshow Forge

> **Elite metadata blocks** on source files — readable by humans, elites, beginners, and AI.

| Meta | Value |
|------|-------|
| Tag | `[META]` |
| Required on | All `src/core/*`, `electron/*`, `src/cli/*`, `src/server/*`, `scripts/*` |

---

## Standard Block (TypeScript / JavaScript)

Place **immediately after** license header:

```typescript
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * @meta SLIDESHOW FORGE — [LAYER TAG]
 * ───────────────────────────────────────────────────────────────────────────
 * @file     exporter.node.ts
 * @purpose  One-line: what this file does
 * @layer    CORE | IO | UI | IPC | API | GATE
 * @depends  comma-separated modules
 * @consumers who calls this
 * @status   ELITE ✅ | WIP 🚧
 * @see      docs/PIPELINE.md
 * ═══════════════════════════════════════════════════════════════════════════
 */
```

---

## Layer Tags (must match ARCHITECTURE guide)

| Tag | When to use |
|-----|-------------|
| `[CORE]` | Pure domain — types, presets, cardFormat |
| `[IO]` | Filesystem, Sharp, FFmpeg, export orchestration |
| `[UI]` | React, browser-only adapters |
| `[IPC]` | Electron main, preload, bridge |
| `[API]` | CLI, HTTP server |
| `[GATE]` | e2e, elite-check, doctor, audits |
| `[WORKSPACE]` | Elite photo folder helpers |

---

## Markdown Docs Header

Every doc in `docs/` starts with:

```markdown
# [emoji] TITLE — Slideshow Forge v3.0.0

> One-sentence purpose.

| Meta | Value |
|------|-------|
| Tag | `[META]` … |
| Authority | link to SOURCE_OF_TRUTH if applicable |
```

---

## Version Sync Points

These **must** show identical `3.0.0` (or current):

- `package.json` → `version`
- `metadata.json` → `version`
- `src/core/constants.ts` → `APP_VERSION`
- Doc titles `v3.0.0`

Verified by: `npm run audit:consistency`

---

## Color in Prose (markdown)

Use consistent emoji prefixes:

| Emoji | Meaning |
|-------|---------|
| 🟢 | Elite / approved / done |
| 🔵 | Core domain |
| 🟡 | UI |
| 🟣 | IPC |
| 🟠 | IO |
| 🔷 | API |
| 🔴 | Gate / test |
| ⚪ | Meta / docs |
| 🟤 | Workspace |
| ⛔ | Blocked / do not |

---

## AI Parsing Hint

When an AI agent reads a file, it should extract:

1. `@layer` → import rules
2. `@purpose` → whether to edit this file for a task
3. `@see` → full context doc
4. `@consumers` → blast radius of changes

---

## 🔗 References

- [ARCHITECTURE_QUALITY_GUIDE.md](./ARCHITECTURE_QUALITY_GUIDE.md)
- [ELITE_CONSISTENCY_AUDIT.md](./ELITE_CONSISTENCY_AUDIT.md)
