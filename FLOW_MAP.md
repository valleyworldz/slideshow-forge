# 🔄 FLOW MAP — Slideshow Forge v3.0.0

> **Control & data flow** across layers. Pair with [E2E_MAP.md](./E2E_MAP.md).

| Meta | Value |
|------|-------|
| Tag | `[META]` Architecture |
| Diagrams | Mermaid (GitHub-renderable) |

---

## 1️⃣ System Context

```mermaid
flowchart TB
  subgraph ACTORS["👤 Actors"]
    H[Human User]
    AI[AI Agent / CI]
    TV[Samsung TV]
  end

  subgraph SURFACES["🖥️ Surfaces"]
    EL[Electron Desktop]
    WEB[Web UI + API]
    CLI[CLI JSON]
  end

  subgraph CORE["🔵 CORE src/core"]
    SCAN[scanner.*]
    PROC[processor.*]
    EXP[exporter.node]
    FF[ffmpeg]
    MAN[manifest]
  end

  subgraph OUT["📁 Output"]
    USB[Samsung_Slideshows/Album/]
  end

  H --> EL & WEB
  AI --> CLI
  EL & WEB & CLI --> SCAN --> PROC --> EXP --> FF --> MAN --> USB
  H -->|copy USB| TV
  USB --> TV
```

---

## 2️⃣ Layer Responsibilities

```mermaid
flowchart LR
  subgraph UI["🟡 UI Layer"]
    APP[App.tsx]
    PANELS[components/*]
  end

  subgraph BRIDGE["🟣 IPC"]
    PRE[preload.ts]
    MAIN[electron/main.ts]
    EB[bridge/electron.ts]
  end

  subgraph API["🔷 API Layer"]
    SRV[server/index.ts]
    CL[cli/index.ts]
  end

  subgraph DOMAIN["🔵 Domain"]
    TYPES[types.ts]
    CARD[cardFormat.ts]
    PRESETS[presets.ts]
  end

  subgraph IO["🟠 IO"]
    EXPN[exporter.node.ts]
    SHARP[processor.node.ts]
    FFM[ffmpeg.ts]
  end

  APP --> PANELS
  APP --> EB
  EB --> PRE --> MAIN
  MAIN --> EXPN
  CL --> EXPN
  SRV --> EXPN
  EXPN --> SHARP & FFM
  EXPN --> DOMAIN
  PANELS --> DOMAIN
```

**Rule:** UI never calls FFmpeg directly. All encode paths go through `[IO] exporter.node.ts`.

---

## 3️⃣ Export Decision Flow

```mermaid
flowchart TD
  START([User clicks Export]) --> MODE{export mode?}
  MODE -->|folder| JPG[Normalize JPEGs only]
  MODE -->|mp4| JPG2[Normalize → _frames] --> MP4[FFmpeg H.264]
  MODE -->|both| JPG3[Normalize JPEGs] --> MP4B[FFmpeg H.264]
  JPG --> MAN[Write manifest + TV README]
  MP4 --> MAN
  JPG3 --> MAN
  MP4B --> MAN
  MAN --> DONE([output/Samsung_Slideshows/Album/])
```

---

## 4️⃣ Electron IPC Flow

```mermaid
sequenceDiagram
  participant R as React App
  participant B as preload/bridge
  participant M as electron/main
  participant E as exporter.node

  R->>B: electronExport(options)
  B->>M: ipc invoke export
  M->>M: pick output folder (dialog)
  M->>E: runExport(photos, opts)
  E-->>M: ExportResult
  M-->>B: result JSON
  B-->>R: success / errors
```

**IPC channels:** workspace load/save, scan, export, pick folder, pick music, doctor.

---

## 5️⃣ CLI JSON Flow (AI agents)

```mermaid
sequenceDiagram
  participant A as Agent
  participant C as cli/index.ts
  participant E as exporter.node

  A->>C: slideshow-forge export --json
  C->>C: parse args / load project
  C->>E: runExport
  E-->>C: ExportResult
  C-->>A: stdout { ok, command, data }
  Note over A,C: exit code 0 = success
```

---

## 6️⃣ Session / State Flow

| State | Web | Electron |
|-------|-----|----------|
| Photos order + card edits | `session.browser` | `workspace.project.json` |
| Settings | `storage.browser` | project file + IPC save |
| History | `storage.browser` | same |

```mermaid
flowchart LR
  EDIT[User edits card] --> DEB[debounce 800ms]
  DEB --> SAVE{Electron?}
  SAVE -->|yes| IPC[electronSaveWorkspace]
  SAVE -->|no| LS[localStorage session]
  IPC --> JSON[workspace.project.json]
```

---

## 7️⃣ Test / Gate Flow

```mermaid
flowchart TD
  L[npm run lint] --> E[npm run test:e2e]
  E --> EL[npm run elite:approve]
  EL --> A[npm run audit:consistency]
  A --> OK{all pass?}
  OK -->|yes| SHIP[✅ ELITE APPROVED]
  OK -->|no| FIX[fix + repeat]
```

---

## 🔗 References

- [docs/ARCHITECTURE_QUALITY_GUIDE.md](./docs/ARCHITECTURE_QUALITY_GUIDE.md)
- [docs/PIPELINE.md](./docs/PIPELINE.md)
- [electron/main.ts](./electron/main.ts)
- [src/core/exporter.node.ts](./src/core/exporter.node.ts)
