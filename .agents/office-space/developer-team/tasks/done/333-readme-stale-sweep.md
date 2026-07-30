---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 333: README.md stale relative to AGENTS.md / clip-schema.md

## Source

Nitpicker `[NIT]` ticket: `mail/in/[NIT]-specs-docs-readme-stale-sweep-2026-07-20.md`

## Description

README.md has drifted from the canonical project layout and MIDI/clip schema terminology in `AGENTS.md` and `clip-schema.md`. Apply the checklist from the original `[NIT]` ticket.

## Checklist

- [ ] Fix Channel 14 description (currently grouped with 15-16 as "Reserved"); AGENTS.md assigns Channel 14 to project selection.
- [ ] Update clip directory tree to `projects/{projectId}/clips/{clipId}/` and generated output path `akvj/src/public/projects/{projectId}/clips/`.
- [ ] Replace legacy `numberOfFrames` and boolean `loop` example with canonical `frames` and `playback` enum.
- [ ] Correct pipeline/scripts location references from `akvj/scripts/clips/` to `mainframe/scripts/clips/`.
- [ ] Replace the oversimplified velocity-variant table with a paragraph pointing to `key-map.json` velocity slots and `akvj/src/js/utils/velocitySelection.js`.

## Affected file

- `README.md`

## Verification

- `npm run lint` passes.
- `npm run build` passes.
- README examples render correctly and align with `AGENTS.md` / `clip-schema.md`.
