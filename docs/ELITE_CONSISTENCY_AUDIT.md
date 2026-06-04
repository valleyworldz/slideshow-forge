# 🔍 ELITE CONSISTENCY AUDIT — Slideshow Forge v3.0.0

> Manual + automated audit so **nothing contradicts** across code, docs, and version strings.

| Meta | Value |
|------|-------|
| Tag | `[GATE]` `[META]` |
| Automate | `npm run audit:consistency` |
| Script | `scripts/consistency-audit.ts` |

---

## Automated Checks

| # | Check | Fail message |
|---|-------|--------------|
| A1 | `package.json` version === `constants.ts` APP_VERSION | Version drift |
| A2 | `metadata.json` version matches | Version drift |
| A3 | Required docs exist | Missing doc file |
| A4 | README links to E2E_MAP, FLOW_MAP, docs/ | Broken doc hub |
| A5 | SOURCE_OF_TRUTH lists all docs/ files | Orphan doc |
| A6 | No `.env` committed (only `.env.example`) | Secret risk |
| A7 | `exporter.node.ts` has metadata block | Missing @meta |
| A8 | Elite scripts reference WORKSPACE_DIR_NAME | Workspace drift |

---

## Manual Checklist (release)

### Documentation consistency

- [ ] README quick start matches actual npm scripts in `package.json`
- [ ] AGENTS.md JSON shape matches `CliJsonResponse` in `types.ts`
- [ ] ELITE_APPROVED.md gate count matches `elite-check.ts` checks
- [ ] E2E step count in README matches `scripts/e2e.ts` results length
- [ ] FLOW_MAP mermaid matches actual IPC channel names in `preload.ts`
- [ ] PIPELINE stages match `exporter.node.ts` function order
- [ ] Non-goals in SOURCE_OF_TRUTH match ELITE_APPROVED "Not in scope"

### Code consistency

- [ ] Preset IDs in CLI validation match `presets.ts` ids
- [ ] Export modes in UI match `exportMode.ts`
- [ ] WORKSPACE_ALBUM_NAME same in workspace.shared, App, docs
- [ ] Electron CSP only applied when `!isDev`

### Git hygiene

- [ ] `photos for use/*.jpg` not staged
- [ ] `output/`, `e2e-output/` not staged
- [ ] KANBAN issue numbers updated after GitHub sync

---

## Run Audit

```bash
npm run audit:consistency
```

Exit `0` = pass. Exit `1` = fix listed violations before merge/release.

---

## Contradiction Resolution Rule

1. Read [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md)
2. If code ≠ docs → fix code **or** update SOURCE_OF_TRUTH via PR with rationale
3. Re-run `audit:consistency` + `elite:approve`

---

## Score Impact

Consistency audit contributes to [SCORECARD.md](./SCORECARD.md) row **Consistency (10)**.

Passing automated + manual checklist = **elite consistency audit PASS** ✅
