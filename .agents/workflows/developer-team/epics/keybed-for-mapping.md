# Epic: Keybed for Mapping

## Status: Done (2026-07-18)

## Spec
`.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`

## Summary
Evolve the piano roll from click-to-assign into a visual velocity mapping editor with draggable regions, breakpoint handles, drag-and-drop from clip list, and bottom-sticky positioning.

## Phases (dependency order)

| Phase | Task | Status | Description |
| --- | --- | --- | --- |
| 1 | 184 | done | Rename `category` → `select` mode, simplify select mode behavior |
| 2 | 185 | done | Velocity regions with draggable breakpoint handles + right-click removal |
| 3 | 186 | done | Drag-and-drop from clip list + auto-breakpoint distribution |
| 4 | 187 | done | Bottom-sticky positioning (CSS only) |

All four phases QA-approved and archived 2026-07-18. Note: Phase 4's sticky-bottom behavior still needs a human/CI visual pass (no Chromium available in-container to confirm) — QA approved on code review, not a rendered check.

**Phase 4 follow-up (2026-07-18, post-archival):** mainframe-developer's own verification pass caught a real bug the original checklist missed — the Mapping tab renders two `<piano-roll>` instances (edit + play mode) that each independently claimed `position: sticky; bottom: 0`, which overlap once the page scrolls. Fixed via a `.piano-roll-dock` wrapper as the single sticky anchor (`mainframe/src/index.html`, `mainframe/src/scss/PianoRoll.scss`); Library tab's standalone roll untouched. Routed to QA as `[TASK]-review-187-piano-roll-dock-overlap-followup.md` (task 187 itself stays archived — this is a fix on top, not a reopen).

Follow-on hardening filed separately (not epic phases, tracked as standalone tasks):
- Task 189 — velocity-breakpoint drag inversion bug (found post-Phase-3, in-progress).
- Task 191 — untested drag/cleanup code paths in `PianoKey.js` (backlog, low priority).

## Check before re-proposing
- This epic is complete — do not re-propose any of the four phases above.
- If new keybed-for-mapping work comes in, check whether it's a new standalone task (like 189/191 above) rather than reopening this epic.
