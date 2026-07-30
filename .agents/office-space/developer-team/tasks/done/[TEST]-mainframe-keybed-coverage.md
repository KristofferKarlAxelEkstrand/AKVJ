---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task: mainframe KeyBed.js Test Coverage Gap

## Source
Test Marshal sweep of mainframe src/js (2026-07-19)

## Summary
`KeyBed.js` (88 lines) has **zero direct or indirect test coverage**. This custom element owns the 128-key container, manages key instantiation, and exposes `keys` getter and `setMappedKeys()` method for PianoRoll. While PianoRoll.test.js extensively tests PianoKey/PianoRoll interaction, KeyBed itself is never tested directly.

## Gap Details

### KeyBed.js (88 lines)
- **No test file exists**: No `KeyBed.test.js` found
- **No indirect coverage**: PianoRoll.test.js does not import or test KeyBed directly
- **Untested paths**:
  - `connectedCallback()` — one-time key rendering
  - `disconnectedCallback()` — cleanup (replaceChildren, clear #keys, reset #hasRendered)
  - `keys` getter — lazy rendering trigger when accessed before render
  - `setMappedKeys(channelMappings, mode)` — core mapping logic:
    - Lazy rendering trigger
    - Channel mapping filtering by note
    - Velocity band building for 'edit' mode
    - Simple mapped/clipId assignment for 'select'/'play' modes
  - `#renderKeys()` — 128 PianoKey instantiation, fragment append, #hasRendered flag

### Related Coverage
- `ClipCategory.js` (46 lines) — covered indirectly via ClipList.test.js (4 tests verify clip-category rendering)
- `PianoKey.js` — well covered via PianoRoll.test.js (48 tests)
- `PianoRoll.js` — well covered via PianoRoll.test.js

## Checklist

### 1. Create KeyBed.test.js
- Test `connectedCallback()` renders 128 keys
- Test `disconnectedCallback()` clears children and resets state
- Test `keys` getter triggers lazy rendering if not yet rendered
- Test `keys` getter returns array of 128 PianoKey instances
- Test `setMappedKeys()` with empty channelMappings (all keys unmapped)
- Test `setMappedKeys()` with single mapping per note (edit mode)
- Test `setMappedKeys()` with multiple velocity bands per note (edit mode)
- Test `setMappedKeys()` in 'select' mode (no velocity bands, first clipId only)
- Test `setMappedKeys()` in 'play' mode (same as select)
- Test `setMappedKeys()` triggers lazy rendering if not yet rendered

### 2. Verify PianoRoll.test.js still passes
- Ensure adding KeyBed tests doesn't break existing PianoKey/PianoRoll coverage

## Notes
- KeyBed is a critical container for the mapping UI — it owns the 128-key flex layout and coordinates mapping state across all keys
- The `setMappedKeys()` method is the primary API used by PianoRoll to update key state based on channel-filtered mappings
- This is a medium-priority gap — KeyBed logic is straightforward but should be verified for correctness, especially the lazy rendering behavior and mode-specific mapping logic

## Files
- `mainframe/src/js/KeyBed.js` (test target)
- New test file: `mainframe/test/KeyBed.test.js`
- Related: `mainframe/test/PianoRoll.test.js` (for reference on PianoKey testing patterns)
