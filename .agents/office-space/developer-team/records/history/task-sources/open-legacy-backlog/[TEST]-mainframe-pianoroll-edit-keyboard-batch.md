---
title: Task source: [TEST]-mainframe-pianoroll-edit-keyboard-batch
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[TEST]-mainframe-pianoroll-edit-keyboard-batch.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: test
from: test-marshal
created: 2026-07-29T20:10:52Z
---

# [TEST] PianoRoll edit keyboard + redo + batch drag-select

**Area:** `mainframe/src/js/PianoRoll.js`  
**Tier:** unit (jsdom) — extend `mainframe/test/PianoRoll.test.js`  
**Verified:** tree 2026-07-29 — toolbar undo/batch-delete covered; keyboard path and redo unexercised

## Gaps

### 1. `#handleEditKeyDown` — keyboard shortcuts never hit

Source: `PianoRoll.js` ~1287–1308. Listener on the roll in `connectedCallback`.

Existing tests only click toolbar buttons:

- `edit mode undo restores mappings after remove` → `.piano-roll-edit-undo` click
- `edit mode shift-click selects multiple regions for batch delete` → `.piano-roll-edit-delete-selected` click
- redo: only asserted **disabled** on empty stacks; never runs `#redo`

Add cases (edit mode, focus on the roll, not an input):

| Case | Expected |
| --- | --- |
| `Ctrl+z` / `Meta+z` (no shift) after a mapping change | `preventDefault`; same restore as toolbar undo |
| `Ctrl+y` or `Ctrl+Shift+z` after undo | `preventDefault`; re-applies undone change (`#redo`) |
| Toolbar or keyboard redo after undo | redo stack works; mappings return to post-edit state |
| Select cells → `Delete` / `Backspace` | batch-deletes selected; mappings updated |
| Same keys while `event.target` is `INPUT` or `TEXTAREA` | no delete; no preventDefault |
| `mode !== 'edit'` (e.g. play/filter) + `Ctrl+z` | no-op (handler early-returns) |

### 2. Batch drag-select path untested

`#handleBatchPointerDown` / `#handleBatchPointerMove` / `#handleBatchPointerUp` (~1314–1359).

Covered today: shift-click multi-select via region `pointerup`.  
Not covered: pointer-down on a velocity region (non-handle), move over another region (`elementFromPoint` → region), up — cells accumulate `is-batch-selected` and toolbar enables delete.

Add at least:

- pointerdown on region A → pointermove over region B (mock `elementFromPoint` if needed) → pointerup → both selected
- pointerdown on `.velocity-handle` does **not** start batch drag
- non-edit mode: pointerdown does not start batch drag
- disconnect mid-drag: window move/up listeners cleaned (`disconnectedCallback`)

### 3. Optional pure helper (same PR if cheap)

`buildVelocityBands` exported from `PianoKey.js` — KeyBed asserts velocity/clipId only, not band geometry.

| Case | Expected |
| --- | --- |
| unsorted entries | sorted by velocity; `start`/`end` correct |
| last band | `end === 128` (`VELOCITY_RANGE`) |
| adjacent velocities with gap &lt; `MIN_VELOCITY_GAP` | `end = start + MIN_REGION_VELOCITY` (via `Math.max`) |
| entry with `overrides` | `band.overrides` preserved |
| empty array | `[]` |

## Out of scope

- Play-mode QWERTY shortcuts / BPM indicator → task `422` (feature backlog)
- Lazy rendering → task `423`
- e2e soft `if (itemCount > 0)` in `e2e/mainframe.spec.js` — low-pri, already noted

## Verify

```bash
npm run test -w mainframe -- test/PianoRoll.test.js
# or full: npm run test -w mainframe
```
