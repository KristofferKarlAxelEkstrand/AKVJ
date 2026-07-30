---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 452 — BUG: `retrigger: false` + beat/clock freezes after stop

From: `[BUG]-akvj-retrigger-false-clock-freeze-after-stop.md` (overseer).

Beat-synced `retrigger: false` clip: `stop()` unsubscribes clock but skips `#resetState()`; later `reset()` no-ops (still mid-playback) and never re-subscribes → frozen under MIDI clock.

## Fix

On note-on/`reset()` when skipping restart: still `subscribeToClock(...)` if BPM/clock-driven. Or split `resume()` vs `reset()` so unsubscribe pairs with re-bind without clearing frame/pulse.

## Verify

- Unit: beat + clock + `retrigger: false` → `stop()` → `reset()` → pulses advance
- Unit: `retrigger: true` still restarts frame 0
- LayerGroup: choke then re-trigger same clip under fake clock

Files: `akvj/src/js/visuals/Clip.js`, `ClipTiming.js`, related tests. **akvj-developer**.
