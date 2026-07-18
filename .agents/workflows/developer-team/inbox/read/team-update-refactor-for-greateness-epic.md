# Team Update: Refactor-for-Greatness epic ready for tasking

## Summary

A technical refactor epic has been written and promoted to `epics/refactor-for-greateness.md`. It is a **structure-only** pass (naming, duplication, coupling, dead-code) across all three code areas — `akvj`, `mainframe`, and `monorepo-scripts`. It adds **no features**; the goal is a clean base for the upcoming Projects / unified-clip-editor / MIDI-clock work.

The epic is grounded in `spec/` (`goal.md`, `clip-schema.md`, `code-standards.md`, `aesthetics.md`) and encodes the guardrails from them: no shared JS import across `akvj`↔`mainframe`, no clip-JSON changes that hurt hand-editability, prefer delete/merge over new abstraction, keep the 60fps hot path allocation-free.

## Impact

Touches all three workspaces. Three god modules are the main structural debt — `akvj/src/js/visuals/Clip.js` (~493 lines), `mainframe/server/index.js` (~804), `mainframe/src/main.js` (~1034) — plus domain logic duplicated 2–6× (clip-id regex, `MS_PER_MINUTE`, MIDI `127`, default `240×135`, playback modes, two drifted spritesheet builders, three mapping validators). Product direction in `mainframe` (unified editor via routing) is already correct; the debt is in implementation, not design.

## Action Needed

- **Team Lead:** review `epics/refactor-for-greateness.md` and break it into individual `tasks/`. The epic ends with a 9-step suggested slicing; each slice is independently shippable and testable.
- **Ordering:** land the **clip-format backbone first** (P0 §0 + akvj slices 1–4) before the mainframe structural slices (5–7), per the user's explicit "get the clip format solid and testable before more scope" signal in `goal.md`.
- **Devs/QA:** no action until tasks are cut.

## Notes

- Full epic: `epics/refactor-for-greateness.md`
- Each item cites concrete file paths and links to the underlying audits (akvj / mainframe / monorepo-scripts).
- Explicitly out of scope: any on-disk clip JSON shape change, cross-realm JS imports, and any new feature logic (Projects, grayscale-displacement effects, MIDI-clock behavior) — those build on the cleaned base.
