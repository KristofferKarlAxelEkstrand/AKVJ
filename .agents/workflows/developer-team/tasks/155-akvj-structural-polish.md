---
status: backlog
assignee: none
priority: medium
---

# Task 155: akvj Structural Polish — Extract Draw-Rect Logic, Shared `snapToPixel`, Rename `<user-messages>`, Merge Type Constants

## Source
Consolidated from akvj refactor audit (Task 150):
`.agents/workflows/developer-team/inbox/read/team-update-refactor-audit-akvj.md`
(findings #1, #3, #4, #5 — bundled as small, complementary, low-risk cleanups in the
visuals/ui layer; #2, #6, #7, #8 were assessed by the audit as no-action-needed and #9 as
low-priority test-infra polish, all left out of this task).

## Findings Being Actioned

### 1. Extract `Clip.js` draw-rect logic to `clipDrawRect.js`
`Clip.js` grew from ~247 to 356 lines after Task 142 added `#computeDrawRect`/`#drawScaled`/
`#drawPattern`/`snapToPixel`. This is pure math (inputs: source/target dimensions, scaleMode,
placement — no instance state beyond those already-passed values). Extract into
`akvj/src/js/visuals/clipDrawRect.js` as pure functions taking
`(sourceWidth, sourceHeight, targetWidth, targetHeight, scaleMode, placement)`.
`Clip.#drawToContext` becomes a thin branch calling the right function. Mirrors the existing
`mainframe/shared/frameFit.js` pattern for architectural consistency across realms (parallel
concept, not shared code).

### 2. Move `snapToPixel` to a shared utility
Currently a file-private function in `Clip.js:12`. The whole-pixel rule is spec'd as
**engine-wide** (`clip-upload-edit-feature.md` §11) — if `Compositor.js`, effects, or future
placement-aware mask blending ever need to snap coordinates, they'd otherwise re-implement
`Math.floor()`. Move to `akvj/src/js/utils/pixelUtils.js` (check if this file already exists
from the mirror-effect scratch-buffer work; reuse it if so) or a new
`akvj/src/js/utils/snapToPixel.js`. Natural to do alongside #1 since both live in the same
extraction.

### 3. Rename `<user-messages>`/`<user-message>` → `<akvj-user-messages>`/`<akvj-user-message>`
akvj's established convention prefixes top-level/app-owned custom elements with `akvj-`
(`akvj-loading-overlay`, `adventure-kid-video-jockey`). The Task 134 mirror of mainframe's
`<user-messages>` kept the bare (unprefixed) tag name mainframe uses, which is inconsistent
with akvj's own convention (mainframe's own convention is more mixed already, so this is
akvj-specific — do not rename mainframe's `<user-messages>`, that's a separate realm with its
own already-considered decision to leave as-is, see Task 154). Update tag registration,
`AdventureKidVideoJockey.js` instantiation, CSS selectors (`user-message.css`/
`user-messages.css` file names can stay, only the tag names change), and tests.

### 4. Merge `MESSAGE_TYPES` / `USER_MESSAGE_TYPES` duplication
`UserMessage.js` declares `MESSAGE_TYPES = new Set(['error', 'warning', 'info'])`;
`AppState.js` separately declares `USER_MESSAGE_TYPES` with the same values. Export
`USER_MESSAGE_TYPES` from `AppState.js` (the dispatch source) and import it in
`UserMessage.js` instead of re-declaring.

## Explicitly Not In Scope (per the audit's own assessment — no action needed)
- `clipMetadata.js` size (242 lines) — audit says not yet a god-module, just flagged for
  future if more fields get added.
- Focus-trap listener on `document` in `UserMessages.js` — correct and guarded, no issue.
- `EVENT_USER_MESSAGE` export grouping — cosmetic only.
- `Midi.js` error message text living in the MIDI layer — acceptable, event-bus coupling only.
- `UserMessages.test.js` stale-element cleanup fragility — low priority, current workaround
  functions correctly (verified 0 failures in full suite run); leave as documented debt.

## Suggested Tests
- `Clip.test.js`: existing draw-rect tests (Task 142's 11 tests) should pass unmodified
  against the extracted `clipDrawRect.js` functions — strong regression signal.
- Update `UserMessages.test.js`/`AdventureKidVideoJockey.test.js` for the renamed tags.
- `AppState.test.js`: `USER_MESSAGE_TYPES` export exists and `UserMessage.js` imports it
  (no duplicate Set).

## Files
- `akvj/src/js/visuals/Clip.js`
- New: `akvj/src/js/visuals/clipDrawRect.js`
- `akvj/src/js/utils/pixelUtils.js` (or new `snapToPixel.js`)
- `akvj/src/js/ui/UserMessage.js`, `akvj/src/js/ui/UserMessages.js`
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js`
