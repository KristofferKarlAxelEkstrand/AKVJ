# Feature Proposal: Advanced Clip Playback Modes

## Background & Motivation
Currently, clip playback in the AKVJ engine is constrained by a simple boolean property in the clip metadata: `"loop": true/false`. While functional for basic forward animations or one-shots, this limits creative control during live VJ performances. 

To provide a richer visual experience that reacts dynamically to music, we propose deprecating the `loop` boolean in favor of a new `"playback"` string enumeration property. This will unlock complex playback behaviors like ping-ponging, random frame selection, and manual scrubbing, providing professional-grade clip manipulation with virtually no performance overhead (as it merely changes the frame index calculation).

## Proposed `playback` Options

The new `"playback"` property in `meta.json` will accept the following string values:

1. **`once`** (Replaces `loop: false`)
   - **Behavior**: Plays forward from the first frame (`0`) to the last frame (`numberOfFrames - 1`) and stops. 
   - *Design note: We should maintain the current behavior where the clip marks itself as `isFinished = true` and holds or clears depending on layer logic.*
2. **`loop`** (Replaces `loop: true`)
   - **Behavior**: Standard forward looping. When the index exceeds the last frame, it wraps back to frame `0`.
3. **`pingpong`**
   - **Behavior**: Plays forward to the last frame, reverses direction, plays backward to the first frame, and repeats (e.g., 0, 1, 2, 3, 2, 1, 0...). 
   - *Advantage: Prevents visual stutters on non-seamless loops.*
4. **`random`**
   - **Behavior**: Selects a completely random frame index on every tick/pulse. Ideal for glitchy noise textures.
5. **`reverse`**
   - **Behavior**: Standard looping but backwards. Starts at the last frame and decrements to `0`, then wraps back to the last frame.
6. **`shuffle`**
   - **Behavior**: Selects random frames, but guarantees that the same frame is *never repeated sequentially* (e.g., 5, 2, 8, 2 is allowed, but 5, 2, 2, 8 is not). 
   - *Optional enhancement: Implement a "true shuffle" (like a shuffled playlist) where every frame must be shown once before any frame repeats.*
7. **`scrub`**
   - **Behavior**: Automatic time/BPM-based progression is disabled entirely. The current frame index is driven directly by an external MIDI Continuous Controller (CC).

### Design Decision: `scrub` Implementation
Implementing `scrub` introduces a new paradigm because the `Clip.js` instance must now respond to external 0-127 MIDI values rather than an internal clock. 

**Decision:** Scrubbing will be controlled by a dedicated MIDI CC knob paired to **each Layer Group** to keep things simple. 
- In `settings.js`, each Layer Group (e.g., Layer A, Layer B, Layer C) will define its own designated "Scrub CC" mapping.
- When that specific CC knob is turned, the value will be routed to the corresponding Layer Group.
- If the active clip on that layer is set to `playback: "scrub"`, the frame position will be updated.
*(Note: We cannot use MIDI Note Velocity for scrubbing, because velocity is strictly reserved for resolving which clip variant to play.)*

---

## Implementation Task Breakdown

This feature touches both the clip generation pipeline (mainframe/Backend) and the real-time playback engine (Frontend).

### Phase 1: Backend / Clip Pipeline Updates (`mainframe/`)
1. **Update Schema Validation:**
   - File: `mainframe/scripts/clips/lib/validate/meta.js`
   - Action: Modify `validateBasicFields` to check for the new `playback` property.
   - Validation logic: Ensure `playback` is a string and belongs to the valid enum list `['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']`.
2. **Backward Compatibility:**
   - Action: Add a temporary migration check. If `"loop": true` is found, log a warning and automatically map it to `"playback": "loop"`. If `"loop": false`, map to `"playback": "once"`.
3. **Tests:**
   - File: `test/validate-extended.test.js`
   - Action: Add unit tests ensuring the pipeline rejects invalid playback strings and accepts the new values.

### Phase 2: Frontend / Rendering Engine Updates (`akvj/`)
1. **State Management in `Clip.js`:**
   - File: `akvj/src/js/visuals/Clip.js`
   - Action: Replace the `#isLooping` private boolean field with `#playbackMode`. Update the constructor to accept `playback` instead of `loop` (with default fallback to `'loop'`).
2. **Implement Frame Math (`#wrapOrFinishFrame`):**
   - Action: Completely refactor the `#wrapOrFinishFrame()` method (and potentially the math inside `tick()`).
   - *`pingpong`*: Needs a new private state `#direction = 1 | -1`. Multiply step by `#direction`. Invert `#direction` when hitting boundaries.
   - *`random`*: Discard step, just do `Math.floor(Math.random() * this.#numberOfFrames)`.
   - *`reverse`*: Subtract step. Wrap negative indices to the end.
   - *`shuffle`*: Store `#lastRandomFrame`. Generate a new random frame, loop if it equals `#lastRandomFrame` until it's different.
3. **Implement `scrub` Logic:**
   - Action: If `#playbackMode === 'scrub'`, the `tick()` method should ignore elapsed time/pulses. We must create a new method `setScrubPosition(normalizedValue)` (where value is 0.0 to 1.0) to manually set `#frame`.
4. **Update MIDI Routing:**
   - File: `akvj/src/js/midi-input/Midi.js` or `LayerManager.js`
   - Action: Listen for the designated MIDI CC (based on our design decision). When received, iterate over active clips. If an active clip has `playback === 'scrub'`, pass the normalized CC value (0-127 / 127) to the clip's `setScrubPosition()`.

### Phase 3: Testing & Documentation
1. **Visual Regression Tests:**
   - Create mock metadata for each mode and run them through the Chromium visual regression suite to ensure frame calculations work.
2. **Documentation:**
   - Update the `<user_rules>` `AGENTS.md` file to remove references to `"loop": boolean` and document the new `"playback"` modes.
