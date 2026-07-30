---
status: todo
stage: queued
priority: medium
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/test/PianoRoll.test.js
  - mainframe/test/PianoKey.test.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 503 — PianoRoll edit keyboard + redo + batch drag-select tests

From: `[TEST]-mainframe-pianoroll-edit-keyboard-batch.md` (test-marshal). Test-only.

## Gaps

1. **`#handleEditKeyDown`** (~1287–1308) — keyboard path never hit; only toolbar clicks.
   - Ctrl/Meta+z undo; Ctrl+y / Ctrl+Shift+z redo after undo
   - Delete/Backspace batch-delete selected
   - INPUT/TEXTAREA targets: no-op
   - non-edit mode: Ctrl+z no-op

2. **Batch drag-select** (`#handleBatchPointerDown/Move/Up` ~1314–1359)
   - drag region A → B multi-select; handle does not start batch; non-edit no-op; disconnect cleans listeners

3. **Optional:** `buildVelocityBands` (`PianoKey.js`) geometry cases (sort, end=128, MIN gap, overrides, empty)

## Files

- `mainframe/test/PianoRoll.test.js` (primary)
- `mainframe/test/PianoKey.test.js` or similar if item 3

## Out of scope

**422** play-mode shortcuts/BPM; **423** lazy rendering; e2e soft guards.

## Verify

`npm run test -w mainframe -- test/PianoRoll.test.js` (or full mainframe suite).

Scope: **mainframe-developer**.
