---
id: goal
title: Goal & Vision
status: draft
owner: human
maintainer: team-lead
approved:
verified: 2026-07-29
---

# Overarching Goal: The Server Split & Vision

The goal of this project is to maintain a strict architectural split between two highly decoupled realms: `akvj` and `mainframe`.

## AKVJ: The Live Visualizer
- **Purpose**: A highly efficient pixel VJ setup used in live performances as a backdrop or lighting.
- **Triggered by MIDI**: It runs on a computer that receives MIDI via WebMIDI from a sequencer or DAW to create live, synced visualizations that follow what the performer does.
- **Performance**: It must be extremely efficient, run flawlessly, and completely lock to a 60fps render loop with zero heavy dependencies.
- **Near-zero UI**: Visualization canvas first. Exceptions match [aesthetics.md](aesthetics.md): fullscreen (Enter / Space / double-click — `Fullscreen.js`), debug overlay on **D** (`DebugOverlay.js`), MIDI settings overlay on **T** (`MidiSettingsOverlay.js`), and the transient project-switch loading overlay (`AkvjLoadingOverlay.js`). No chrome, menus, or persistent HUD.

## Mainframe: The Backoffice
- **Purpose**: A user-friendly backoffice dashboard where you set up, edit, and map all the clips for the live visualizer.
- **User Experience**: It must be easy to use, intuitive, and not overly complex.
- **Clip Management**: The place to import images, resize them to needed dimensions, optimize them, and save sprite maps as PNGs.
- **Mapping**: Used to define trigger zones for clips and configure how MIDI interacts with the visuals.

## The Bridge
The only allowed communication between the two realms is the shared project tree on disk:
`projects/{projectId}/clips/` (and each clip's `meta.json` / sprite), `projects/{projectId}/key-map.json`,
plus `projects/index.json` and root `active-project.json`. The clip pipeline copies the active
project into `akvj/src/public/` for the live engine; that tree is generated output, not a second
source of truth. The two packages must never share JavaScript module imports.

## Projects
Per direct user feedback (2026-07-17, see `memory/overseer/`), clips, MIDI mapping, and raw uploads are grouped into **Projects** — the user's mental model is roughly "one Project per gig/show." This has shipped (Tasks 73/92/110/111/128): each project owns `clips/{clipId}/`, bitmasks, and `.raw-assets/` under `projects/{projectId}/`, seeded by deep-copy from `default` (or another project via `copyFrom`) on creation; the legacy flat `clips/` pool was migrated away entirely (no legacy fallback, per explicit user confirmation — "migrate do not keep legacy"). MIDI project-switching uses a fixed global channel (DAW channel 14) — that trigger itself is not per-project, everything else (key-map, clips, bitmasks) is.

Still open / not yet built:
- **Song/scene sub-tier**: switching is outer-project-only today; the user explicitly deferred any song/scene concept within a project ("not really a song concept for now").
- **Settings split (General vs. per-Project)**: which settings are global vs. per-project is still being worked out case by case (e.g. `effectParams` is treated as per-project-overridable in older notes, while BPM/MIDI/channelMapping are global) — no single documented rule yet. Root `PROJECT-SPECIFICATION.md` is now an entry-point pointer to `AGENTS.md` + `spec/` (task 373); prefer those for behaviour.
- **Copying clips between projects**: the user wants this later ("I would like us to be able to copy them later on") — not required now, but per-project isolation should not be designed so tight it blocks this.

## Real-world usage context (from the user, 2026-07-17)
- The user runs AKVJ for their own live sets, occasionally club nights, driven from **FL Studio** sending MIDI over a single dedicated MIDI-out device, aiming to use the full 16-channel range (untested so far — worth keeping in mind when auditing channel-routing code). Playback is meant to track the music closely (near 1:1), so **MIDI clock reliability and BPM-sync accuracy matter a lot** — this is a real, active use case, not a theoretical one.
- AKVJ is currently their primary visual tool; they're separately exploring DMX-style lighting control as a parallel (not integrated, not urgent) system.
- **Explicit priority signal**: the user wants the team to nail the fundamentals before building more on top. In their words, the **clip format is the backbone** and matters more right now than the Project format/feature, because Projects will be built on top of clips — get the clip format solid and testable first. They also want to actually start testing what exists rather than keep adding scope.
- **Feature idea, not yet spec'd**: the user floated using monochrome (grayscale/black-and-white) clips as a reusable base for a family of effects, and fleshed it out further (2026-07-17): (1) grayscale-driven pixel displacement — 50% gray = no shift, values above/below shift pixels proportionally, similar to a displacement map; (2) grayscale-driven soft/smooth fades, as opposed to hard-cut effects. Drew an explicit analogy to bitmasks. Clarified to the user that this isn't as separate from bitmasks as they thought: `Compositor.js`'s multi-bit mask blending (2/4/8-bit) already treats mask pixels as grayscale for smooth crossfades — only 1-bit is a hard threshold — so this could extend existing machinery rather than needing a new pipeline. Full detail: `.agents/office-space/developer-team/tasks/done/82-grayscale-displacement-fade-effects.md`. Not scoped further per the user's own "think about it" — proper design pass needed once clip-format/MIDI-clock hardening is further along.

## Changelog

- 2026-07-29 — Product re-verify: Near-zero UI keys (Fullscreen / D / T / loading overlay),
  Bridge paths, DAW-14 project switch, open Projects gaps still match code. Boot load uses
  `ClipLoader.loadClips` → active-project (with default fallback). No fact change.
- 2026-07-29 — Boundary re-verify (special mission): still zero JS imports either way;
  `MAPPING_OVERRIDE_KEYS`, clip-id pattern, `SYNC_LENGTH_PRESETS`, cover math (post-436)
  match across mirrors; workspace packages have no mutual deps. No fact change to Bridge.

- 2026-07-29 — Near-zero UI wording: “MIDI device chooser” → “MIDI settings overlay”.
- 2026-07-29 — Near-zero UI: added MIDI settings overlay (**T**, `MidiSettingsOverlay.js`) to match aesthetics after epic `akvj-midi-device-chooser` shipped.
- 2026-07-20 — Re-verified Bridge: still no JS imports between `akvj` and `mainframe`;
  `mainframe/shared/` is mainframe-only. Mirrored allowlists (`MAPPING_OVERRIDE_KEYS`,
  sync presets, clip-id pattern) still match. Filed cover-mode math drift
  (`[BUG]-akvj-cover-scale-mode-non-uniform.md`) — parallel `clipDrawRect` vs `frameFit`,
  not a cross-import.
- 2026-07-20 — Aligned AKVJ UI bullet with aesthetics **Near-zero UI** (D debug overlay +
  loading overlay + fullscreen); task 399 owns root `PROJECT-SPECIFICATION.md` only.
- 2026-07-20 — Cleared stale “PROJECT-SPECIFICATION.md still has frameDurationBeats” note after task 373 turned that file into an entry-point pointer.
- 2026-07-20 — Re-verified against codebase (special mission). Fact corrections: fullscreen is Enter **or** Space **or** double-click (`Fullscreen.js`); Bridge names `key-map.json` and clarifies `akvj/src/public/` is generated copy; flagged root `PROJECT-SPECIFICATION.md` as partly stale (`frameDurationBeats`). Split, channel-14 project switch, and open Projects gaps still hold. No JS cross-imports between `akvj` and `mainframe`.
