---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 133: Reusable User Message System (Mainframe) — `<user-messages>` / `<user-message>`

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-user-message-system.md`

## Scope
Mainframe only for this task. The request also mentions MIDI/device issues (akvj domain),
but there is no shared JS between the `akvj` and `mainframe` workspaces (established
precedent — see Task 119/122 notes: "no cross-realm import, constants kept in sync
manually"). Build and prove the design here first, against the concrete mainframe use cases
below; an akvj-side mirror (same design conventions, separate implementation) is a
plausible future follow-up, not part of this task — file it separately once this one's
design decisions are settled and reported.

## What This Replaces / Complements
Today, mainframe surfaces problems via an ad-hoc inline status line: `ClipEditorController`
calls an injected `setStatus(statusElement, message, kind)` throughout (e.g.
`ClipEditorController.js:225,235,244,252,264,313,332,343,373,377` — `'is-ok'`/`'is-err'`
classes on one status element). That's fine for lightweight inline feedback but isn't a
stacking, dismissible, accessible modal system. This task adds the new component; whether
`setStatus` calls get migrated to it or continue to coexist for lightweight inline cases is
a judgment call — document the decision.

## Design Requirements (from user request — some decisions are explicitly left open, pick and document)
1. **Elements**: a container/host + per-message item, light DOM custom elements (no Shadow
   DOM for CSS — see `custom-elements-frontend` skill, and existing examples like
   `StagingPreview.js` / `ClipFrames.js` for this repo's light-DOM custom-element
   conventions: `connectedCallback`/`disconnectedCallback`, `replaceChildren()`, scoped CSS
   import at the top of the file).
   - Naming: request suggests `<error-messages>`/`<error-message>` but flags that
     `<user-messages>`/`<user-message>` may read better since it hosts non-error types too —
     **pick one and use it consistently** (component file names, class names, event names).
2. **Types**: `error` / `warning` / `info`, each with distinct visual treatment, sharing
   layout + dismiss behavior.
3. **Behavior**:
   - Centered modal, rectangle with text + OK button; OK dismisses just that message.
   - `Esc` dismisses the top/focused message.
   - Multiple messages **stack** — pick newest-on-top or newest-on-bottom and document it.
   - Decide queue-one-at-a-time vs. show-all-stacked — request says "stacking is the ask,
     keep it simple," so show-all-stacked is the simpler default unless there's a good reason
     otherwise.
   - Decide whether `info` auto-dismisses (toast-like) vs. requires OK like error/warning —
     document the choice.
4. **Programmatic API**: single entry point, e.g. `messages.show({ type, text })` /
   `messages.error(text)` / `messages.warn(text)` / `messages.info(text)`. Route through
   `mainframeState.js`'s event pattern (mainframe's equivalent of akvj's `AppState` —
   `EventTarget`-based, see existing `EVENT_CLIPS_CHANGED` wiring) rather than direct DOM
   poking, so any module can raise a message without importing the component directly.
5. **Accessibility**: focus the OK button on open, trap focus while a message is up,
   `alertdialog` role for error/warning, `status`/polite live region for info.

## Validate Against These Use Cases
- Clip save/upload failures (currently `#setStatus(..., 'is-err')` in `ClipEditorController.js`)
- Zero-frame reject (`ClipEditorController.js:244`)
- Legacy-clip warnings (if any exist — check `editorMeta.js` legacy-default handling)
- "Saved clip X" / "Loaded N frames" info messages (`ClipEditorController.js:225,313,332`)

## Suggested Tests
- Component test: renders message, OK dismisses it, Esc dismisses top message, multiple
  messages stack and dismiss independently, correct ARIA roles per type.
- API test: `mainframeState`-routed `messages.error/warn/info(...)` results in the right
  message appearing.

## Files
- New: mainframe message container + item custom elements (naming per decision above) +
  SCSS, under `mainframe/src/js/` + `mainframe/src/scss/` following existing conventions
  (e.g. `StagingPreview.js` / `StagingPreview.scss` pairing)
- `mainframe/src/js/mainframeState.js` (event routing)
- `mainframe/src/js/ClipEditorController.js` (existing `setStatus` call sites — candidates
  for migration or coexistence, developer's call)
- `.agents/skills/custom-elements-frontend/` (conventions reference)
