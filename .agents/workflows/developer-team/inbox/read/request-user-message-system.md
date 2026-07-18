# Team Update: User message system (`<error-messages>` / `<error-message>`)

## Summary

We need a proper, reusable way to **communicate with the user** — when something goes wrong, when we want to warn them, or when we just want to tell them something. The starting point is a centered modal: a simple rectangle with text and an **OK** button that dismisses the message. Multiple messages **stack**. This should be a well-designed system, not a one-off alert.

## Impact

- Today there's no consistent surface for surfacing failures or notices to the user, so problems are easy to miss or handled ad-hoc.
- A shared, well-thought-out component means every part of the app (uploader, editor, clip pipeline errors, MIDI/device issues, etc.) can speak to the user the same way.

## Proposed shape

### Markup (custom elements, light DOM — matches our conventions)

- `<error-messages>` — the container / host. Owns positioning (centered modal region), stacking, and the queue.
- `<error-message>` — one message. Renders its text and an **OK** button; pressing OK removes just that message.
- Despite the "error" naming, the container holds **all** message types (see below). Consider whether a more neutral name (e.g. `<user-messages>` / `<user-message>`) reads better long-term — flagging for the task to decide, since the naming should reflect that it's not only errors.

### Message types

Support a `type` (or `severity`) attribute so we can style and prioritize:

| Type | Use for |
| ---- | ------- |
| `error` | Something failed and the user should know (save failed, upload rejected, etc.) |
| `warning` | Something is risky or degraded but not fatal (e.g. legacy clip, missing field) |
| `info` | Purely informative ("Saved", "Loaded N frames", tips) |

Each type gets distinct visual treatment (color/icon), but all share the same layout and dismiss behavior.

### Behavior

- **Centered modal** in the middle of the screen for now. Simple rectangle: message text + **OK** button.
- **Dismiss:** OK removes that one message. `Esc` should also dismiss the top/focused message.
- **Stacking:** more than one message = stacked (newest on top or bottom — pick one and document). Dismissing one leaves the rest.
- **Queue vs. show-all:** decide whether to show all stacked at once or queue them one at a time. Stacking is the ask; keep it simple.
- **Programmatic API:** a single, easy entry point to raise a message from anywhere, e.g. `messages.show({ type, text })` / `messages.error(text)` / `messages.warn(text)` / `messages.info(text)`. Route through `AppState` events (our loose-coupling pattern) rather than direct DOM poking, so any module can raise a message without knowing about the DOM.
- **Accessibility:** focus the OK button on open, trap focus while a modal message is up, use appropriate ARIA role (`alertdialog` for error/warning, `status`/polite live region for info).

## Action Needed

- Design and implement the message system as above: `<error-messages>` container + `<error-message>` items, centered modal, OK-to-dismiss, stacked when multiple.
- Add message **types** (error / warning / info) with distinct styling.
- Provide a simple programmatic API (via `AppState` events) so any module can raise a message.
- Really think it through so it's a **great, reusable** communication layer — not just a styled `alert()`.

## Notes

- Keep it vanilla JS / custom elements, light DOM (no Shadow DOM for CSS) per repo conventions — see the `custom-elements-frontend` skill.
- Open design decisions to settle in the task: final element naming, stack order, queue vs. show-all, and whether info messages should auto-dismiss (toast) vs. require OK like errors.
- Good first use cases to validate against: clip save/upload failures, zero-frame reject, legacy-clip warnings, and "Saved / Loaded N frames" info.
