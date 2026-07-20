---
status: done
assignee: akvj-developer
priority: medium
---

# Task 270: Visuals layer coordination naming & JSDoc sweep

## Description

The Nitpicker found naming/terminology and JSDoc drift in the `akvj/src/js/visuals/` layer coordination code. This is a non-behavioral cleanup to make identifiers, comments, and JSDoc types consistent with the canonical clip schema and module responsibilities.

## Findings

### 1. "Choke group" vs. canonical `triggerGroup` terminology
**Files:** `akvj/src/js/visuals/LayerGroup.js`, `akvj/src/js/visuals/Clip.js`

- In `LayerGroup.js`:
  - Rename the private method `#stopChokeGroupMembers(triggerGroup, excludeChannel, excludeNote)` to `#stopOtherClipsInTriggerGroup` (or `#stopTriggerGroupMembers`) and update its parameter comment to `The trigger group name`.
  - Replace all "choke group" noun usage in comments/JSDoc with "trigger group".
  - Keep "choke" only as a verb if desired, e.g. `Trigger group: triggering a clip chokes all other clips in the same trigger group.`
- In `Clip.js` (line 225):
  - Change `Get the trigger group (choke group) for this clip.` to `Get the trigger group for this clip.`

### 2. Vague `Object` JSDoc types in `LayerGroup` and `MaskManager`
**Files:** `akvj/src/js/visuals/LayerGroup.js`, `akvj/src/js/visuals/MaskManager.js`

- In `LayerGroup.js`:
  - `/** @type {Object} */ #loadedClips;` → `/** @type {Object<string, Object<string, Object<string, Clip>>>} */ #loadedClips;`
  - `@param {Object} clips - Clip data keyed by channel/note/velocity` → `@param {Object<string, Object<string, Object<string, Clip>>>} clips - Clip data keyed by channel, then note, then velocity threshold`
- In `MaskManager.js`:
  - `/** @type {Object} */ #maskClips;` → `/** @type {Object<string, Object<string, Clip>>} */ #maskClips;`
  - `@param {Object} clips - All clip data keyed by channel/note/velocity` → `@param {Object<string, Object<string, Object<string, Clip>>>} clips - All clip data keyed by channel, then note, then velocity threshold`

### 3. `MaskManager.handlesChannel` is not used in production routing
**File:** `akvj/src/js/visuals/MaskManager.js` (lines 49–51)

- `MaskManager.handlesChannel(channel)` is currently only exercised by tests; `LayerManager` dispatches mask events by calling `noteOn`/`noteOff` directly, which already check the mixer channel internally.
- Choose **Option A** or **Option B** and document the chosen approach:
  - **Option A:** Use `handlesChannel` in `LayerManager`'s mask route handler before dispatching, then remove duplicated channel checks inside `noteOn`/`noteOff`.
  - **Option B:** Remove `MaskManager.handlesChannel` and rely on `noteOn`/`noteOff` returning `false` for non-mixer channels; update `akvj/test/MaskManager.test.js` accordingly.

### 4. `LayerManager` imports a generic MIDI constant from an effects-specific module
**Files:** `akvj/src/js/visuals/LayerManager.js`, `akvj/src/js/core/AppState.js`, `akvj/src/js/visuals/effects/effectConstants.js`, and any effect files that import `MAX_MIDI_DATA_BYTE` from `effectConstants.js`

- Create `akvj/src/js/core/midiConstants.js` exporting `MAX_MIDI_DATA_BYTE`, `MAX_MIDI_VELOCITY`, and `MAX_MIDI_NOTE`.
- Update `LayerManager.js` and `AppState.js` to import from the new `core/midiConstants.js`.
- Update effect files that currently pull these from `effectConstants.js` to import from `core/midiConstants.js` as well.
- Keep `effectConstants.js` focused on pixel/color constants (e.g. `RGBA_CHANNEL_COUNT`, `MAX_COLOR_VALUE`).

## Affected files

- `akvj/src/js/visuals/LayerGroup.js`
- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/LayerManager.js`
- `akvj/src/js/visuals/MaskManager.js`
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/visuals/effects/effectConstants.js`
- Effect files in `akvj/src/js/visuals/effects/` that import MIDI constants
- `akvj/test/MaskManager.test.js` (if Option B is chosen)
- New file: `akvj/src/js/core/midiConstants.js`

## Verification

1. `npm run lint` passes.
2. `npm run test` passes.
3. No runtime behavior changes; only identifiers, comments, JSDoc types, and module imports are adjusted.

## Notes

- Do not introduce runtime behavior changes beyond the `handlesChannel` cleanup (Option A or B).
- Keep changes in `akvj/src/js/`; avoid touching `mainframe/`.
- The `Clip` typedef is already imported in `LayerGroup.js` and `MaskManager.js`, so use it in JSDoc.
