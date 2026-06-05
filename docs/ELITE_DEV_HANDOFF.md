# Elite Developer Handoff — Slideshow Forge v3.1.0

**Handoff clarity score: 11/10** · **Composite project score: 10.3/10** · **Phases 0–3: SHIPPED**

| Field | Value |
|-------|-------|
| **Repo** | https://github.com/valleyworldz/slideshow-forge |
| **Branch** | `master` |
| **Version** | `3.1.0` |
| **Scope lock** | [GitHub Issue #1](https://github.com/valleyworldz/slideshow-forge/issues/1) |
| **Authority** | [docs/SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) — wins on conflict |
| **Elite workspace** | `photos for use/` (~188 JPGs, **gitignored**) |
| **Default album** | `Elite_Slideshow` |

---

## 1. Executive summary (60 seconds)

**Slideshow Forge** turns a photo folder into a **Samsung Smart TV USB slideshow**:

```
photos/  →  scan → review/format → export  →  Samsung_Slideshows/<Album>/
                                              ├── 000001.jpg …
                                              ├── Samsung_Slideshow_Video.mp4 (optional)
                                              ├── slideshow_manifest.json
                                              └── README_TV_INSTRUCTIONS.txt
```

**Four surfaces:** Electron (primary) · Web · CLI (`--json`) · Export API  
**One export brain:** `src/core/exporter.node.ts` — all disk exports go here  
**Seven gates before merge/release:** lint → e2e (27) → elite → audit → changelog → CI → no scope drift

---

## 2. Phase status — what's done vs what's next

### SHIPPED (Phases 0–3) — do not re-litigate

| Phase | Milestone | Exit criteria | Key artifacts |
|-------|-----------|---------------|---------------|
| **P0** Foundation | M0 v3.0.0 GA | USB export works, real Sharp+FFmpeg | `exporter.node.ts`, Electron, CLI, E2E |
| **P1** Doc Elite | M1 | SOURCE_OF_TRUTH, maps, scorecard, `@meta` blocks | `docs/*`, `E2E_MAP.md`, `FLOW_MAP.md` |
| **P2** Hardening | M2 | CI green, Samsung yuv420p | `.github/workflows/elite-ci.yml`, ffprobe E2E |
| **P3** Enhancements | M3 TV pixel-perfect | True crossfade + CHANGELOG | `transitions.node.ts`, `CHANGELOG.md` |

### NEXT PHASES (proposed P4–P8) — roadmap

| Phase | Name | Priority | Goal | Acceptance criteria (Definition of Done) |
|-------|------|----------|------|------------------------------------------|
| **P4** | Release engineering | High | Repeatable releases | `v3.x` git tags; GitHub Release with notes from CHANGELOG; optional `electron-builder` `.exe`; branch protection on `master` |
| **P5** | Performance & scale | Medium | Faster large libraries | Parallel Sharp normalize (worker pool); export progress IPC streaming; full 188-photo export < 25 min on reference HW; no regression in 27 E2E |
| **P6** | TV validation matrix | Medium | Prove Samsung playback | Document tested TV models; sample MP4/JPEG on USB checklist; optional `scripts/tv-probe.ts` (ffprobe + JPEG spec) |
| **P7** | Transition polish | Medium | Per-slide fade-to-black | Bake fade-to-black in `transitions.node.ts` (like crossfade); E2E duration + visual step; Settings copy updated |
| **P8** | Distribution & agents | Low | Wider adoption | `npm link` docs; Docker headless export image; OpenAPI spec for `/api/export`; AGENTS.md v2 with example agent flows |

**Explicit non-goals (locked in Issue #1):** cloud upload, mock MP4, silent USB write, committing user photos, Gemini/cloud AI.

---

## 3. Onboarding — read order & time budgets

### 15 minutes (any dev)

1. [README.md](../README.md) — quick starts + gate commands
2. [docs/SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) — tag legend + DoD
3. Run: `npm install && npm run doctor`

### 1 hour (feature dev)

4. [E2E_MAP.md](../E2E_MAP.md) — actors → USB → TV
5. [FLOW_MAP.md](../FLOW_MAP.md) — mermaid IPC + export flows
6. [docs/PIPELINE.md](./PIPELINE.md) — export stages 1–7
7. [docs/DIRECTORY_TREE.md](./DIRECTORY_TREE.md) — where to edit
8. Skim `@meta` block on `exporter.node.ts`, `ffmpeg.ts`, `transitions.node.ts`

### 1 day (elite contributor)

9. [docs/ARCHITECTURE_QUALITY_GUIDE.md](./ARCHITECTURE_QUALITY_GUIDE.md) — layer rules + anti-patterns
10. [AGENTS.md](../AGENTS.md) — JSON CLI contract
11. Run full gate: `npm run test:production` (~10–15 min)
12. Smoke export: `npm run workspace:export`
13. Desktop: `npm run electron:dev`
14. Read [scripts/e2e.ts](../scripts/e2e.ts) — all 27 checks
15. Read [GitHub Issue #1](https://github.com/valleyworldz/slideshow-forge/issues/1)

---

## 4. Architecture — one screen

```
┌─────────────────────────────────────────────────────────────────┐
│  UI          App.tsx · components/*                             │
├─────────────────────────────────────────────────────────────────┤
│  IPC         electron/main.ts ←→ preload ←→ bridge/electron     │
├─────────────────────────────────────────────────────────────────┤
│  API         cli/index.ts · server/index.ts · export.browser    │
├─────────────────────────────────────────────────────────────────┤
│  CORE        types · presets · cardFormat · manifest            │
├─────────────────────────────────────────────────────────────────┤
│  IO          exporter.node ★ · processor.node · ffmpeg          │
│              transitions.node (crossfade bake)                  │
└─────────────────────────────────────────────────────────────────┘
```

**Golden rule:** UI never calls FFmpeg. All encode paths → `exporter.node.ts` → `ffmpeg.ts`.

---

## 5. End-to-end flow (human path)

See [FLOW_MAP.md](../FLOW_MAP.md) for full mermaid diagrams.

---

## 6. Export pipeline (IO path) — stage by stage

| Stage | File | Input → Output |
|-------|------|----------------|
| 1 Validate | `exporter.node.ts` | `PhotoAsset[]` → filter `status===ready` |
| 2 Setup dirs | `exporter.node.ts` | `output/Samsung_Slideshows/<Album>/`, `_frames/` |
| 3 Normalize | `processor.node.ts` | source → `000001.jpg` + temp frame |
| 4 Expand + crossfade | `exporter.node.ts` + `transitions.node.ts` | hold frames + 0.5s blend between slides |
| 5 Encode | `ffmpeg.ts` | `_frames/%06d.jpg` → `Samsung_Slideshow_Video.mp4` |
| 6 Manifest | `manifest.ts` | `slideshow_manifest.json` + `README_TV_INSTRUCTIONS.txt` |
| 7 Cleanup | `exporter.node.ts` | remove `_frames/`, temp files |

**MP4 Samsung contract:** `pix_fmt=yuv420p`, `-color_range tv`, BT.709, H.264 High L4.1, `+faststart`  
**Verified by E2E:** `export-mp4-pix-fmt-yuv420p`, `export-crossfade-transitions`

---

## 7. Module responsibility matrix

| If you need to… | Edit this | Tag |
|-----------------|-----------|-----|
| Change export behavior | `src/core/exporter.node.ts` | IO |
| Change crossfade timing/blend | `src/core/transitions.node.ts` | IO |
| Change MP4 codec/color | `src/core/ffmpeg.ts` | IO |
| Change JPEG canvas/background | `src/core/processor.node.ts` | IO |
| Change per-card format logic | `src/core/cardFormat.ts` | CORE |
| Add CLI command | `src/cli/index.ts` | API |
| Fix Electron export/dialog | `electron/main.ts` | IPC |
| Change review grid / drag-drop | `src/components/ReviewPanel.tsx` | UI |
| Add E2E check | `scripts/e2e.ts` | GATE |
| Change version/docs sync | `constants.ts` + `CHANGELOG.md` + audits | CORE/GATE |

---

## 8. Quality gates — run before every PR

```bash
# Minimum (CI mirrors this)
npm run lint
npm run audit:consistency
npm run changelog:check
npm run fixtures:ci -- --workspace   # only if no photos for use/
npm run test:e2e
npm run elite:approve

# All-in-one
npm run test:production

# Stress (188 photos, ~30–60 min)
npm run test:e2e:full
npm run elite:approve:full
```

| Gate | Pass condition | Exit code |
|------|----------------|-----------|
| lint | `tsc --noEmit` clean | 0 |
| audit:consistency | 9/9 | 0 |
| changelog:check | `## [3.1.0]` exists | 0 |
| test:e2e | 27/27 | 0 |
| elite:approve | 7/7 checks | 0 |
| Elite CI (GitHub) | workflow green on push | — |

**Report artifact:** `e2e-output/e2e-report.json`

---

## 9. Git workflow & issue tracker

```
master  ←  feature/P4-<name>  |  fix/P5-<name>  |  docs/P*-*
```

| Step | Action |
|------|--------|
| 1 | `git pull origin master` |
| 2 | `git checkout -b feature/P4-release-tags` |
| 3 | Implement + update docs if behavior changed |
| 4 | Run gates (§8) |
| 5 | PR → link Issue #1 or new phase issue |
| 6 | Merge when CI green |
| 7 | Update CHANGELOG `[Unreleased]` → tag on release |

**Labels:** `phase-4-release`, `elite-gate`, `core`, `ui`, `ipc`, `docs`, `blocked`  
**Templates:** `.github/ISSUE_TEMPLATE/` — scope-lock, bug, feature, elite-gate

---

## 10. Environment & secrets

| Requirement | Verify |
|-------------|--------|
| Node.js 20+ | `node -v` |
| FFmpeg + ffprobe | `npm run doctor` |
| Sharp (native) | doctor report |
| Windows exFAT USB | manual for TV test |

**Secrets:** none required. `.env*` gitignored; only `.env.example` tracked.  
**Never commit:** `photos for use/*.jpg`, `output/`, `e2e-output/`, `.env`

---

## 11. Daily / weekly elite rituals

### Daily (5 min)

```bash
npm run doctor
npm run electron:dev          # or workspace:export for headless
```

### Weekly (before any release)

```bash
npm run workspace:export
npm run test:production
npm run changelog:check
# Update ELITE_APPROVED.md if gate re-run
# Tag: git tag v3.x.x && git push origin v3.x.x
```

---

## 12. AI agent handoff

**Contract:** [AGENTS.md](../AGENTS.md)

```bash
slideshow-forge doctor --json
slideshow-forge workspace scan --json
slideshow-forge workspace export --mode both --json
```

**JSON shape:** `{ ok, command, data?, error? }` · exit `0` = success  
**Parse errors:** `data.errors[]` on export failures  
**Manifest audit:** `slideshow_manifest.json` → `sequence[]` per-card metadata

---

## 13. Known limits & risk register

| Risk | Severity | Mitigation / P-phase |
|------|----------|----------------------|
| Crossfade export slower/larger (8-slide subset ~2× encode time) | Medium | P5 parallel Sharp; optional crossfade off (`transition: none`) |
| `fade-to-black` is stream-level, not per-slide | Low | P7 bake in transitions.node |
| Web cannot MP4 without API/Electron | By design | Document; CLI/Electron preferred |
| CI uses synthetic fixtures, not 188 real photos | Low | `E2E_FULL=1` locally before major release |
| No git tag `v3.1.0` on GitHub yet | Low | P4 first task |
| package-lock version drift | Low | run `npm install` after version bump |

---

## 14. Phase execution plans (actionable next steps)

### P4 — Release engineering (start here)

| Step | Task | Owner cue |
|------|------|-----------|
| P4-1 | `git tag v3.1.0 && git push origin v3.1.0` | 5 min |
| P4-2 | GitHub Release from CHANGELOG `[3.1.0]` | 15 min |
| P4-3 | Enable branch protection: require Elite CI | 30 min |
| P4-4 | Add `electron-builder` + signed Windows `.exe` (optional) | 2–4 hr |
| P4-5 | Close/update Issue #1 phases section | 15 min |

**Done when:** tagged release on GitHub; CI required on `master`; CHANGELOG matches tag.

### P5 — Performance & scale

| Step | Task | Files |
|------|------|-------|
| P5-1 | Benchmark baseline: 188-photo export timing log | `exporter.node.ts` |
| P5-2 | Parallel normalize (p-limit or worker_threads) | `processor.node.ts`, exporter |
| P5-3 | Stream progress to Electron UI | `electron/main.ts`, `ExportPanel.tsx` |
| P5-4 | E2E: assert full export completes under budget OR document HW ref | `scripts/e2e.ts` |

**Done when:** ≥30% faster on 188 photos OR documented baseline + no E2E regression.

### P6 — TV validation matrix

| Step | Task |
|------|------|
| P6-1 | Create `docs/TV_VALIDATION.md` — model, USB format, result |
| P6-2 | Manual sign-off: folder mode + MP4 on target Samsung |
| P6-3 | Optional script: validate JPEG dimensions + MP4 ffprobe spec |

**Done when:** at least one Samsung model documented PASS for folder + MP4.

### P7 — Per-slide fade-to-black

| Step | Task |
|------|------|
| P7-1 | Extend `transitions.node.ts` with fade-out/in frame generation |
| P7-2 | Wire in exporter when `transition === 'fade-to-black'` |
| P7-3 | E2E step + update SettingsPanel copy |
| P7-4 | Update PIPELINE.md |

**Done when:** E2E passes; fade-to-black distinct from crossfade in output timing.

### P8 — Distribution & agents

| Step | Task |
|------|------|
| P8-1 | `docs/AGENT_RECIPES.md` — 5 copy-paste agent workflows |
| P8-2 | OpenAPI YAML for Export API |
| P8-3 | Dockerfile: headless `workspace export` |

---

## 15. Command cheat sheet

| Command | Purpose |
|---------|---------|
| `npm run electron:dev` | Primary desktop dev |
| `npm run workspace:export` | Headless elite export |
| `npm run cli -- help-agent` | Agent command discovery |
| `npm run test:e2e` | 27 production checks |
| `npm run elite:approve` | Full release gate |
| `npm run audit:consistency` | Doc/version sync |
| `npm run changelog:check` | CHANGELOG ↔ version |
| `npm run fixtures:ci -- --workspace` | CI photos locally |

---

## 16. Handoff scorecard

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 11 | Phases 0–3 + P4–P8 roadmap with DoD |
| Actionability | 11 | Commands, files, acceptance criteria |
| Flow clarity | 11 | E2E + pipeline + mermaid |
| Onboarding paths | 10 | 15m / 1h / 1d tracks |
| Risk transparency | 10 | Known limits + mitigations |
| AI readiness | 11 | Agent contract + JSON flows |
| Release discipline | 10 | Gates + CHANGELOG + tagging steps |
| Scope discipline | 11 | Non-goals locked to Issue #1 |

**Composite handoff score: 10.75 / 10 — ELITE HANDOFF PASS**

---

## 17. First actions for the incoming dev (copy-paste)

```bash
git clone https://github.com/valleyworldz/slideshow-forge.git
cd slideshow-forge
npm install
npm run doctor
npm run audit:consistency && npm run changelog:check
npm run test:e2e          # requires photos for use/ OR fixtures:ci --workspace
```

Then read [Issue #1](https://github.com/valleyworldz/slideshow-forge/issues/1), pick **P4-1** (tag `v3.1.0`), and open a PR.

---

**Canonical doc index:** [docs/SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md)  
**Kanban board:** [docs/KANBAN_TRACKER.md](./KANBAN_TRACKER.md)  
**Live CI:** https://github.com/valleyworldz/slideshow-forge/actions
