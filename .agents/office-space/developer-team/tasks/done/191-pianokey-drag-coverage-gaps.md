---
status: done
assignee: none
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 191: PianoKey.js — Untested Drag/Cleanup Code Paths

## Source
`.agents/workflows/developer-team/inbox/read/[TEST]-pianokey-vacuous-noop-test-and-gaps.md` (Test Marshal, item 2 — item 1 was folded into Task 189 since it directly concerns the same bug/fix).

## Scope
`mainframe/src/js/PianoKey.js` grew from ~200 to 606 lines as part of the keybed-for-mapping epic. These new code paths have zero direct test coverage:

- `#handleDragOver` — no test exercises `dragover` (type-check against `application/x-akvj-clip-id` / `text/plain`, `preventDefault`, `dropEffect = 'copy'`). Drop is tested; drag-over never is.
- `clipHue(clipId)` — new pure function (hash → hue 0-360) for region color swatches, zero direct test coverage.
- `disconnectedCallback()` while a drag is in progress — calls `#endDrag(false)` for cleanup (removes pointermove/pointerup/pointercancel listeners, releases pointer capture). No test removes a `piano-key` mid-drag to confirm listeners are actually torn down (a leak here would only show up as a dangling `pointermove` listener on a detached element).
- `pointercancel` path — `#handlePointerUpDrag` is wired to both `pointerup` and `pointercancel`, but only `pointerup` is exercised in tests.

## Priority
Low — normal new-code coverage gaps, not urgent (contrast with Task 189, which covers an actual data-integrity bug in the same file).
