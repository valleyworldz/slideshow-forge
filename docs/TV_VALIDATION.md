# TV Validation Matrix — Slideshow Forge

> **Tag:** `[META]` `[GATE]` · **Phase:** P6 TV validation

Authority: [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md)

---

## Purpose

Document **real Samsung Smart TV playback** after copying exports to a USB drive. Automated checks (`tv-probe`) verify file specs; manual rows confirm on-device behavior.

---

## USB preparation checklist

| Step | Action | Pass |
|------|--------|------|
| 1 | Format USB as **exFAT** (Samsung recommends exFAT for large files) | ☐ |
| 2 | Copy entire album folder: `Samsung_Slideshows/<AlbumName>/` | ☐ |
| 3 | Include `000001.jpg` … `000NNN.jpg` for **Photo** mode | ☐ |
| 4 | Include `Samsung_Slideshow_Video.mp4` for **Video** mode | ☐ |
| 5 | Keep `slideshow_manifest.json` on USB for audit (optional on TV) | ☐ |
| 6 | Safely eject USB before plugging into TV | ☐ |

---

## Automated spec probe (before USB)

After export, run:

```bash
npm run tv:probe -- output/Samsung_Slideshows/Elite_Slideshow
npm run tv:probe -- output/Samsung_Slideshows/Elite_Slideshow --json
```

**Checks:**

| Check | Samsung contract |
|-------|------------------|
| `manifest-json` | Valid `slideshow_manifest.json` |
| `readme-tv-instructions` | TV guide present |
| `numbered-jpegs` | `000001.jpg` … sequential |
| `jpeg-format` | Progressive JPEG |
| `jpeg-dimensions` | Matches preset (e.g. 1920×1080) |
| `mp4-pix-fmt-yuv420p` | `yuv420p` (not `yuvj420p`) |
| `mp4-codec-h264` | H.264 |
| `mp4-dimensions` | Matches preset |
| `mp4-color-range-tv` | TV range when reported |

E2E runs `assertSamsungAlbum` on subset **both** export (folder + MP4).

---

## Manual validation matrix (fill after TV test)

| Field | Value |
|-------|-------|
| **Tester** | |
| **Date** | |
| **TV model** | e.g. Samsung QN65… |
| **TV firmware** | Settings → Support → Software |
| **USB format** | exFAT |
| **Export preset** | samsung-safe-1080p / samsung-4k |
| **Export mode tested** | folder / mp4 / both |

| Test | Steps | Result | Notes |
|------|-------|--------|-------|
| **Photo folder** | USB → Source → USB → open numbered JPG folder → slideshow | ☐ PASS ☐ FAIL | |
| **MP4 video** | USB → Source → USB → play `Samsung_Slideshow_Video.mp4` | ☐ PASS ☐ FAIL | |
| **Aspect / bars** | No unexpected crop or stretch | ☐ PASS ☐ FAIL | |
| **Crossfade** | Transitions smooth, no flash frames | ☐ PASS ☐ FAIL | |
| **Duration** | Slide timing matches export settings | ☐ PASS ☐ FAIL | |

**Sign-off:** At least one Samsung model **PASS** for folder + MP4 completes P6-2.

---

## Validated models (project record)

| TV model | USB | Folder | MP4 | Date | Tester |
|----------|-----|--------|-----|------|--------|
| *Pending manual sign-off* | exFAT | — | — | — | — |

---

## Related

- [PIPELINE.md](./PIPELINE.md) — encode contract (yuv420p, BT.709)
- [PERFORMANCE.md](./PERFORMANCE.md) — export timing
- [ELITE_DEV_HANDOFF.md](./ELITE_DEV_HANDOFF.md) — P6 acceptance
