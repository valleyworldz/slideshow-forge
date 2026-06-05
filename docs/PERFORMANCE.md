# Performance — Slideshow Forge

> **Tag:** `[META]` `[IO]` · **Phase:** P5 Performance & scale

Authority: [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md)

---

## Export pipeline timing

Disk exports log phase timings via `onLog`:

```
⏱ Normalize phase: 45230ms (188 photos, concurrency 8)
⏱ Encode phase: 124000ms
⏱ Export timing — normalize 45230ms | frames 8200ms | encode 124000ms | total 177430ms
```

Programmatic access: `ExportResult.timing` from `runExport()`:

| Field | Meaning |
|-------|---------|
| `normalizeMs` | Parallel Sharp JPEG normalize |
| `framesMs` | Hold-frame copy + crossfade blend |
| `encodeMs` | FFmpeg H.264 encode (0 if folder-only) |
| `totalMs` | Wall clock end-to-end |
| `photoCount` | Ready photos exported |
| `concurrency` | Sharp pool size used |

---

## Parallel normalize (P5-2)

`exporter.node.ts` runs a **two-phase** export:

1. **Normalize** — `mapWithConcurrency` over all slides (default pool: `min(8, os.cpus())`)
2. **Frames** — sequential hold copies + crossfade blends (order-dependent)
3. **Encode** — FFmpeg (unchanged)

Override pool size:

```typescript
runExport(photos, { ...opts, normalizeConcurrency: 4 });
```

CLI / JSON consumers receive `data.timing` on export when using `--json`.

---

## Reference hardware baseline

Document local full-workspace runs with `E2E_FULL=1` or `npm run workspace:export`:

| Environment | Photos | Mode | Total | Notes |
|-------------|--------|------|-------|-------|
| *Fill after first benchmark* | 188 | both + crossfade | — | `npm run workspace:export -- --json` |

**Target (P5 DoD):** full 188-photo export under 25 minutes on reference HW, or documented baseline with no E2E regression.

---

## Stress commands

```bash
npm run workspace:export -- --mode both --json   # logs timing in data.timing
npm run test:e2e:full                            # full inventory folder export
npm run elite:approve:full                       # gate + full E2E
```

---

## Related

- [PIPELINE.md](./PIPELINE.md) — stage breakdown
- [ELITE_DEV_HANDOFF.md](./ELITE_DEV_HANDOFF.md) — P5 acceptance criteria
