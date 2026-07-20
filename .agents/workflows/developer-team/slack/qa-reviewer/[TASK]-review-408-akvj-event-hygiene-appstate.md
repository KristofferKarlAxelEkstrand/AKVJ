---
type: task
from: team-lead
to: qa-reviewer
task: 408
created: 2026-07-20T20:35:00Z
---

# QA review: 408 — Event hygiene: AppState

Forwarded from akvj-developer report. Original report below.

All four parts done. No render-loop or MIDI-latency code touched.

**1. Split.** `EVENT_PROJECT_SWITCH` → `EVENT_PROJECT_SWITCH_REQUESTED` ('projectSwitchRequested', input: `{note}` or `{projectId}`); the old `EVENT_ACTIVE_PROJECT_CHANGED` became `EVENT_PROJECT_CHANGED` ('projectChanged', output: `{projectId}`) rather than adding a third project event that meant the same thing. Added `dispatchProjectSwitchRequest(projectId)`.

**2. Dead-event audit** — wired: `EVENT_BPM_SOURCE_CHANGED` (DebugOverlay Source row; it previously went stale on clock timeout, since that path changes source without changing BPM), `EVENT_MIDI_CONTINUE` / `EVENT_MIDI_STOP` (+ existing `EVENT_MIDI_START`, already consumed by `ClipTiming`) as transport log entries, `EVENT_PROJECT_CHANGED` and `EVENT_CLIP_LOAD_ERROR` as new Project / Error rows. Deleted: `EVENT_CLIPS_LOADED_CHANGED` (the `clipsLoaded` boolean stays, setter no longer dispatches).

**Kept, not deleted — needs your call:** `EVENT_VIDEO_JOCKEY_READY` has no `akvj/src/` subscriber but is not dead — it is the component's public readiness signal and the whole test suite synchronises on it (`waitForEvent`). Per the task's "ask before deleting something deliberate", I left it and did not invent a fake consumer for it. This is the one exception to the verify grep.

**3.** `ProjectCatalog` is now stateless: `#activeProjectId` / `setActiveProjectId` / getter removed, `projectId` threaded through `ClipLoader.loadClips` → `#loadClipsFromKeyMap` → `#buildLoadTasks` → `#loadMappedClip` → `#buildMappingResult`. `AdventureKidVideoJockey.#activeProjectId` removed too — it reads `appState.activeProjectId`. AppState is now the only holder.

**4.** `dispatchClipLoadError(url, message)` added; the raw `dispatchEvent(new CustomEvent(EVENT_CLIP_LOAD_ERROR…))` call site in `AdventureKidVideoJockey.#loadClipsFromUrl` uses it.

Files: `core/AppState.js`, `core/AdventureKidVideoJockey.js`, `visuals/ProjectCatalog.js`, `visuals/ClipLoader.js`, `utils/DebugOverlay.js`, `css/debug-overlay.css`, tests `AppState.test.js` (split coverage: request does not announce a change, and vice versa), `DebugOverlay.test.js` (transport / project / clip-error / bpm-source wiring), `AdventureKidVideoJockey.test.js`, `ProjectCatalog.test.js`.

Verified: `npm run lint` clean, `npm run test` 580+18 passed, `npm run test:visual` 20+7 passed, `npm run build` OK.

Subscriber grep: `grep -rhno "subscribe(EVENT_[A-Z_]*" akvj/src --include=*.js | sed 's/.*subscribe(//' | sort -u` — covers every event except `EVENT_MIDI_CONTINUE` / `EVENT_MIDI_STOP` (subscribed through a loop variable in `#subscribeTransportEvents`, so the literal does not appear) and `EVENT_VIDEO_JOCKEY_READY` (flagged above).

QA's `reserved` feedback was already folded in last cycle — separate report sent.
