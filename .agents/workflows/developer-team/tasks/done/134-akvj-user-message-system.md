---
status: done
assignee: akvj-developer
priority: medium
---

# Task 134: Mirror User Message System into akvj (MIDI/Device Errors)

## Source
Follow-up to Task 133 (`tasks/133-user-message-system.md`), which built the mainframe
implementation and explicitly flagged this akvj mirror as a separate follow-up once its
design was accepted. Task 133's report is in QA review now (`slack/qa-reviewer/[TASK]-review-133-user-message-system.md`)
— its design table below is final regardless of QA's verdict (QA reviews code quality/tests,
not the design decisions themselves), so it's safe to build against.

## Why a Separate Implementation
There is no shared JS between the `akvj` and `mainframe` workspaces (established precedent —
Task 119/122 notes: "no cross-realm import, constants kept in sync manually"). This is a
parallel implementation in `akvj/`, following the same conventions Task 133 settled on, not
a shared component.

## Settled Design (carry over exactly — do not re-litigate these)
From Task 133's report:
| Topic | Choice |
| ----- | ------ |
| Naming | `<user-messages>` / `<user-message>` (not `error-*`) — hosts error/warning/info |
| Stack order | Newest on top |
| Queue | Show-all stacked (not one-at-a-time) |
| Info dismiss | Requires OK (same as error/warning — no auto-toast) |
| ARIA | `alertdialog` for error/warning; `dialog` + polite live text for info |
| Esc | Dismisses the top message |
| Focus | OK focused on open; focus trapped to the top dialog |

Reference the mainframe implementation for structure (do not import it — akvj has its own
custom-element conventions and `AppState`):
- `mainframe/src/js/UserMessage.js` / `UserMessage.scss`
- `mainframe/src/js/UserMessages.js` / `UserMessages.scss`
- `mainframe/src/js/mainframeState.js` (`EVENT_USER_MESSAGE`, `showUserMessage`/`error`/`warn`/`info`, exported `messages` helper) — mirror this pattern using akvj's `AppState.js` (`akvj/src/js/core/AppState.js`) instead, per this repo's existing event-name-constant conventions (see `EVENT_CLIP_LOAD_ERROR` from Task 120d).

## akvj-Specific Requirements
1. Build `<user-messages>` / `<user-message>` as light-DOM custom elements under
   `akvj/src/js/ui/` (matches existing `akvj/src/js/ui/LoadingOverlay.js` location/pattern —
   light DOM, no Shadow DOM, per `custom-elements-frontend` skill).
2. Route via `AppState` events (`akvj/src/js/core/AppState.js`) — add a `showUserMessage`/
   `error`/`warn`/`info` API mirroring mainframe's, with an akvj-appropriate event constant
   (follow existing naming like `EVENT_CLIP_LOAD_ERROR`, `EVENT_PROJECT_LOAD_ERROR`).
3. **Validate against real akvj failure points** — this is the concrete motivating use case
   the original request called out ("MIDI/device issues"):
   - MIDI access failures / `navigator.requestMIDIAccess` rejection (`Midi.js`)
   - Project switch failures (`AdventureKidVideoJockey.js` `#switchProject`,
     `PROJECT_LOAD_ERROR` handling — check whether this already surfaces anywhere user-visible
     today, or silently logs to console)
   - Clip load errors (`EVENT_CLIP_LOAD_ERROR`, already dispatched by `AppState.js` per Task
     120d — currently consumed by `AdventureKidVideoJockey.js`; check what it does with it
     today and whether routing it through the new message system is a straightforward win)
4. Keep the 60fps rendering constraint in mind — this is UI chrome, not render-loop code, but
   confirm the modal doesn't block or interfere with the canvas render loop or MIDI input
   handling (`<20ms` latency requirement).
5. Do not touch mainframe code in this task — akvj-only, mirroring the pattern.

## Suggested Tests
- Component tests mirroring `mainframe/test/UserMessage*.test.js` structure, adapted for
  akvj's test conventions (see `akvj/test/` — jsdom-based, e.g. `AppState.test.js`).
- Integration: a MIDI access failure or clip load error results in a visible message via the
  new system.

## Files
- New: `akvj/src/js/ui/UserMessage.js`, `akvj/src/js/ui/UserMessages.js` (+ CSS, matching
  `akvj/src/css/` conventions — see `debug-overlay.css` from Task 126 as a recent example of
  extracted-CSS-file style)
- `akvj/src/js/core/AppState.js` (event routing)
- `akvj/src/js/midi-input/Midi.js` (MIDI failure use case)
- `akvj/src/js/core/AdventureKidVideoJockey.js` (project-switch / clip-load error use cases)
