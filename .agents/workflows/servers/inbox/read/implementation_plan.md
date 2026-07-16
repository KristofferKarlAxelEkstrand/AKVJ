# Implementation Plan: Advanced Clip Playback Modes

## Goal Description
Implement an advanced playback system for AKVJ clips by replacing the boolean `"loop"` property with a robust `"playback"` string enum. This will enable complex visual behaviors like `once`, `loop`, `pingpong`, `random`, `reverse`, `shuffle`, and MIDI-controlled `scrub`.

## Open Questions
> [!NOTE]
> We decided to use a dedicated MIDI CC for each Layer Group to control the `scrub` position. MIDI CC messages are transmitted on specific MIDI *channels* (0-15). 
> **Question:** Should we restrict the Scrub CC knobs to a specific MIDI channel (e.g., channel 0), or should we just listen to the CC number regardless of what MIDI channel it's sent on? (The implementation proposed below defaults to accepting the CC number on *any* channel, but we can easily restrict it).

## Proposed Changes

---

### Backend / mainframe Pipeline

#### [MODIFY] [mainframe/scripts/clips/lib/validate/meta.js](file:///c:/github/adventurekid-harness/live/AKVJ/mainframe/scripts/clips/lib/validate/meta.js)
- Update `validateBasicFields()` to remove the check for `meta.loop`.
- Add validation to check that `meta.playback`, if provided, is a string and exists in the allowed set: `['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']`.
- Add backward compatibility logic: if `meta.loop` is present, log a warning and convert it to `playback: "loop"` (if true) or `playback: "once"` (if false).

#### [MODIFY] [test/validate-extended.test.js](file:///c:/github/adventurekid-harness/live/AKVJ/test/validate-extended.test.js)
- Add test cases to ensure the new `playback` modes are successfully validated and that invalid strings are rejected.

---

### Frontend / VJ Engine Settings & Routing

#### [MODIFY] [akvj/src/js/core/settings.js](file:///c:/github/adventurekid-harness/live/AKVJ/akvj/src/js/core/settings.js)
- Add a new `scrub` configuration block under `settings.midi` (or parallel to it) to define the CC mapping for each layer group.
  ```javascript
  scrub: {
      layerGroupA_CC: 16, // Default CC knob for Layer A scrub
      layerGroupB_CC: 17, // Default CC knob for Layer B scrub
      layerGroupC_CC: 18  // Default CC knob for Layer C scrub
  }
  ```

#### [MODIFY] [akvj/src/js/visuals/LayerManager.js](file:///c:/github/adventurekid-harness/live/AKVJ/akvj/src/js/visuals/LayerManager.js)
- In the constructor, subscribe to `EVENT_MIDI_CONTROL_CHANGE` via `appState.subscribe()`.
- Add a handler method: `handleControlChange(channel, ccNumber, value)`.
- Inside the handler, map `ccNumber` to the respective `LayerGroup` based on `settings.scrub`.
- Calculate `normalizedValue = value / 127` and pass it down via `layerGroup.setScrubPosition(normalizedValue)`.
- Store the unsubscribe function and call it in `destroy()`.

#### [MODIFY] [akvj/src/js/visuals/LayerGroup.js](file:///c:/github/adventurekid-harness/live/AKVJ/akvj/src/js/visuals/LayerGroup.js)
- Add a `setScrubPosition(normalizedValue)` method.
- This method will iterate through `this.#activeClips` and call `clip.setScrubPosition(normalizedValue)` on any clip where `clip.playbackMode === 'scrub'`.

---

### Frontend / Clip Playback Logic

#### [MODIFY] [akvj/src/js/visuals/Clip.js](file:///c:/github/adventurekid-harness/live/AKVJ/akvj/src/js/visuals/Clip.js)
- **Constructor & State:**
  - Replace `loop = true` parameter with `playback = 'loop'`.
  - Add `#playbackMode = playback;`.
  - Add state variables: `#pingpongDirection = 1;` and `#lastRandomFrame = -1;`.
- **`#wrapOrFinishFrame()` logic:**
  - Refactor to switch on `#playbackMode`.
  - `loop`: Existing logic.
  - `once`: Existing logic (finishes at end).
  - `pingpong`: Add `#pingpongDirection` to frame. Invert direction at boundaries (`0` and `numberOfFrames - 1`).
  - `random`: `this.#frame = Math.floor(Math.random() * this.#numberOfFrames)`.
  - `reverse`: Decrement frame. If `< 0`, wrap to `numberOfFrames - 1`.
  - `shuffle`: Pick random frame until it doesn't match `#lastRandomFrame`. Store it.
  - `scrub`: Do nothing (or return `true` to keep alive) because time-based ticks should not advance the frame.
- **`setScrubPosition(normalizedValue)`:**
  - Add this public method.
  - `this.#frame = Math.floor(normalizedValue * (this.#numberOfFrames - 1))`.
  - Clamp it safely.

---

### Documentation

#### [MODIFY] [AGENTS.md](file:///c:/github/adventurekid-harness/live/AKVJ/AGENTS.md)
- Update the **Clip Metadata** table to remove `loop: boolean` and add `playback: string`, listing the available options.

## Verification Plan
1. **Automated Tests:**
   - Run `npm run test` to verify `validate-extended.test.js` passes.
   - Run `npm run test:visual` to ensure basic clip compositing is not broken by the `Clip.js` refactoring.
2. **Manual Verification:**
   - Temporarily modify a clip's `meta.json` in the dev environment to test `pingpong`, `random`, and `reverse`.
   - Run `npm run dev`, trigger the clip, and observe the render loop visually.
