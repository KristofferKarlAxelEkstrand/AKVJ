# Monorepo Refactor & Mainframe Dashboard Specification

## Motivation

Clips are currently identified solely by their position in a `projects/{projectId}/clips/{channel}/{note}/{velocity}/` folder. Renaming, reusing, or reorganizing a clip means moving files and re-deriving the MIDI mapping by hand — there's no way to build or edit a set visually, and no concept of a clip's identity independent of where it happens to sit in the MIDI grid. This spec decouples clip identity from MIDI position (per-project clip folders + per-project key-map files) and gives that new workflow a visual Mainframe dashboard, while keeping the live-performance engine (`akvj`) exactly as fast and constrained as it is today.

When executing this refactor, follow the architectural guidelines and execution phases below.

## 1. Monorepo Architecture

The repository splits into three boundaries, managed as **npm workspaces** (no new package manager or monorepo tool — npm is already in use, and `workspaces` needs zero new dependencies):

- `/akvj/`: The existing Vite application (the core VJ engine). Stripped of all build scripts and clip-generation logic. Its sole purpose is to consume MIDI, read the active project's `key-map.json` + `clips.json` catalog, and render at 60fps. **Vanilla JS, ES6+ modules — same architecture rules as today, unchanged.**
- `/mainframe/`: A Vite application for managing the VJ set, creating clips, and building sprite sheets. **Also vanilla JS + vanilla CSS — no framework, no Tailwind.** This repo has one architecture rule enforced everywhere: no frameworks. A second package with a different stack would mean two build philosophies to maintain and would need its own carved-out exception to `AGENTS.md`; staying vanilla avoids that entirely.
- `/projects/{projectId}/clips/`: Per-project clip folders where each project owns its own clips. Runtime reads the active project's clips (`projects/index.json` and `active-project.json` drive selection); Mainframe reads/writes the selected project.

Root `package.json` gains a `"workspaces": ["akvj", "mainframe"]` field. Each package keeps its own `package.json`, `vite.config.js`, and `node_modules` (hoisted by npm where possible); one `npm install` at the root installs both.

## 2. Decoupling Clips from MIDI Mapping

Currently, clips are rigidly bound to MIDI notes by their file path (`projects/{projectId}/clips/{channel}/{note}/{velocity}/`). This must change:

- **Per-Project Clip Folders**: Clips live in `projects/{projectId}/clips/` by clip ID (e.g., `projects/default/clips/neon-skull/`). Each folder contains the sprite and its `meta.json`. A flat `clips.json` catalog inside the project maps each `clipId` to its metadata.
- **Per-Project Set Mapping**: Each project has a `key-map.json` that maps MIDI inputs to clip IDs from that project's `clips.json` catalog:
  ```json
  {
    "1": {
      "60": {
        "127": "neon-skull"
      }
    }
  }
  ```
- **Channel keeps its existing second meaning — this is not touched.** `settings.js`'s `channelMapping` uses channel number as a routing key independent of clip identity (channels 1-4 → Layer Group A, 5 → mixer, 6-9 → Layer Group B, 10 → mixed-output effects, 11-12 → Layer Group C, 13 → global effects, 14-16 → reserved, in DAW/source numbering). `key-map.json` only replaces "which clip plays," never "what a channel routes to." Don't try to abstract channel away entirely — it stays a first-class field.
- **`meta.json` gains a `role` field** (e.g. `"role": "bitmask"`) for clips that need special pipeline handling. Today, `optimize.js`'s `getTargetBitDepth` infers "this is a 1-bit bitmask" purely from a clip living in the channel-5 *source folder* — a flat bucket has no channel folder to infer that from, so this becomes an explicit metadata flag instead of a folder-position inference.
- **Remove the existing unused `src` field** in `meta.json` (an undocumented, never-resolved stub that let one clip slot reference another's sprite) rather than leaving it alongside the new `clipId`-based identity system — two half-implementations of "clip reuse" is worse than one.

## 3. The Mainframe Dashboard Responsibilities

The Mainframe UI (vanilla JS + vanilla CSS) and its accompanying local backend take over all set preparation logic. The backend is a minimal Node `http`/`fs` server — no Express dependency needed for local file read/write plus `sharp` calls:

- **Asset Ingestion**: A UI to upload image sequences/videos. The backend processes these using `sharp`, generates the sprite map, and saves it to a new folder in the active project's `/projects/{projectId}/clips/` directory.
- **Mapping Editor**: A visual interface to build the project's `key-map.json` by dragging/assigning clips from the project's `clips.json` catalog to MIDI notes and velocities.
- **Pipeline Execution**: The entire `scripts/clips/` pipeline (validation, optimization, generation) moves to the Mainframe backend. Its per-file operations — meta validation, image-dimension checks, `sharp`-based optimization, hashing/caching, and the copy-to-public diff/sync logic — are already clip-shape-agnostic and can move largely as-is. What needs rewriting is the *directory-discovery* layer: today `validate()`/`generate()` each do three nested `getSubfolders` walks (channel → note → velocity); the per-project version walks one flat directory of clip-ID folders inside the selected project instead.

## 4. Constraints (carried over, unchanged)

- **`/akvj/` keeps every existing performance rule**: 60fps rendering, <20ms MIDI input-to-visual latency, vanilla JS only, ES6+ modules, Chrome/Chromium only (Web MIDI). Moving it into a subdirectory changes nothing about these — they're re-verified in Phase 1, not relaxed.
- **The Mainframe UI is host-browser-dependent for visual QA**, same as the main app today: no Chrome/Chromium exists in the devcontainer, and AGENTS.md explicitly says not to install it there. Sprite-sheet preview and drag/drop mapping testing happen via port-forwarding to the host browser, or in CI (where Playwright/Chromium is already installed for `test:visual`).
- **This is a major architectural change** — per `AGENTS.md`'s own Task Suitability guidance, changes at this scope get human review at each phase boundary, not a single unsupervised pass.

## 5. Execution Phases

**Phase 1: Structural Migration**

1. Move the existing codebase (except `.agents`, `clips`, `docs`, and `.git`) into a new `/akvj/` directory.
2. Add `"workspaces": ["akvj", "mainframe"]` to the root `package.json`.
3. Update `vite.config.js`'s `root`, `build.outDir`, and `rollupOptions.input` (all currently `__dirname`-relative, assuming a repo-root single package) to resolve correctly from inside `akvj/`.
4. Verify the custom `reloadOnClipChange()` Vite plugin still watches the correct `projects/{projectId}/clips/` path for the active project — it currently forces a full reload on clip changes since clips load once at startup, not via HMR.
5. Update `.devcontainer/devcontainer.json`: add `forwardPorts` entries for the Mainframe dev server and its backend (neither exists today — only 5173/4173 are forwarded), and reassess the 2 CPU / 4 GB resource minimum against running two Vite dev servers plus a Node backend plus `sharp` processing concurrently.
6. Update `.github/workflows/ci.yml` for per-workspace steps (`npm ci` at root, then lint/test/build for each of `akvj`/`mainframe`), and fix the existing hardcoded `src/public/clips` output-verification step to match wherever the pipeline output lands post-refactor.
7. Verify that `npm install && npm run dev` (from repo root, via workspaces) still starts `akvj` and renders correctly.

**Phase 2: Mainframe Scaffolding**

1. Initialize a new vanilla-JS Vite project in `/mainframe/` — same architecture rules as `akvj` (no framework, no Tailwind; plain CSS).
2. Set up a lightweight local backend (plain Node `http`/`fs`, no Express) to handle file system operations (uploading files, writing JSON).

**Phase 3: Data Model Refactor**

1. Reorganize the existing `projects/{projectId}/clips/` directory from the nested MIDI structure (`{channel}/{note}/{velocity}/`) into flat clip-ID folders.
2. Build a per-project `clips.json` catalog mapping each `clipId` to its `meta.json` metadata, and a per-project `key-map.json` from the old folder structure.
3. **Verification gate before any deletion**: diff the clip list produced by the old channel/note/velocity walk against the clip list produced by the new per-project `clips.json` + `key-map.json` resolution. They must match exactly (same clips, same effective MIDI mapping) before the old nested structure is removed. Do not delete the old nested shape until this passes.
4. Rewrite `ClipLoader.js` to resolve the active project's `key-map.json` and `clips.json` first, then still **emit the same `{channel: {note: {velocity: Clip}}}` nested shape it produces today.** This is the only runtime module that needs to change — `LayerGroup.js` and `velocitySelection.js` already consume that nested shape and its velocity-floor-match lookup; neither needs to be touched.
5. Migrate `meta.json`'s bitmask business rule from channel-5-folder-position inference to the explicit `role` field (§2).

**Phase 4: Mainframe UI Implementation**

1. Build the Mainframe "Clip Library" UI to view all clips in the selected project.
2. Build the Mainframe "Uploader" to ingest new images and write them to the selected project.
3. Build the Mainframe "Mapping" UI to modify and save the project's `key-map.json`.
