# [BUG] Projects feature shipped with a shared clip pool — user has now confirmed (twice) they want per-project clip folders

## Where
- `clips/` (repo root) — still one flat shared pool
- `projects/{projectId}/` — currently only holds `key-map.json`, no `clips/` subfolder
- Affects: `mainframe/server/projects.js`, `mainframe/server/index.js`, `akvj/src/js/visuals/ClipLoader.js`, the build pipeline (`mainframe/scripts/clips/`), and `PROJECT-SPECIFICATION.md`

## Problem
Task 92 (Project Concept) shipped without the human ever approving its plan (see Overseer sweep-log for the full timeline — the plan sat unanswered in `outbox/` for ~42 minutes before the task was re-assigned and built anyway). The shipped storage model is a **single shared `clips/` pool** referenced by all projects, with only the MIDI mapping (`key-map.json`) being per-project.

This does not match the design the user had already reviewed in Task 73 ("Proposed Architecture (refined with user input)"), which explicitly calls for **per-project clip folders** including per-project bitmasks:
```
clips/
  projects/
    {projectName}/
      clips/{clipId}/meta.json, sprite.png
      key-map.json
      raw-assets/
      settings.json
```

The user has now **directly confirmed this twice**:
1. `spec/goal.md` "Planned: Projects" (written 2026-07-17, from the original Q&A): *"Bitmask/mixer clips should belong to a Project (each Project gets its own, seeded from a shared default) rather than being global."*
2. Fresh answer in `outbox/question-92-project-concept-approval.md` (answered just now) to *"Should the existing flat `clips/` be migrated into `clips/projects/default/` immediately, or kept as a legacy default?"* — verbatim answer: **"migrate do not keep legacy."**

So this isn't a judgment call anymore — the shared-pool model is confirmed to be the wrong direction and needs reworking.

## Requirements
1. Migrate the existing flat `clips/` into `projects/default/clips/` (or the equivalent path this task settles on) — **migrate, do not keep as a legacy fallback**, per the user's explicit answer.
2. Each project gets its own clip set (including bitmask/mixer clips), seeded from a shared editable default when a new project is created (per `spec/goal.md`).
3. Update `mainframe/server/projects.js`, `mainframe/server/index.js`, the clip pipeline, and `ClipLoader.js` to resolve clips from the active project's own folder rather than the shared root `clips/`.
4. Update `PROJECT-SPECIFICATION.md` to reflect the corrected structure (it currently documents the shared-pool model as final — that section needs rewriting once this ships).
5. Since a real project (`projects/default/`) with a real `key-map.json` already exists in production-shaped form, this is a migration on top of already-shipped work, not a greenfield build — check for any data that needs preserving/moving rather than assuming a clean slate.

## Also still open (from the user's answers so far)
- Two-tier song/scene switching: user confirmed **out of scope for now** ("outer switching just switching the project, not really a song concept for now") — don't build this yet.
- MIDI channel: user said any of DAW 14/15/16 is fine — the shipped channel 14 is acceptable, no change needed there.
- **Not yet answered**: whether the shipped General/Project settings split (BPM/MIDI/channelMapping global, only `effectParams` per-project) matches what the user meant — see `outbox/question-project-architecture-shipped-without-approval.md`, question 2, still pending.

## Priority
High — corrects a shipped, HIGH-priority feature's core storage model to match confirmed user intent; blocks any further Projects work (e.g. future song/scene selection) from building on the wrong foundation.
