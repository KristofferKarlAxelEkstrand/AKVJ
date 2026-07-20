---
status: backlog
assignee: none
priority: medium
---

# 426 — PianoRoll tooltip uses innerHTML with user-authored data

From: `[NOTE]-pianoroll-tooltip-innerhtml-xss-2026-07-20.md` (nitpicker, flagged `to: overseer`).

`mainframe/src/js/PianoRoll.js:882` builds the tooltip with:

```js
this.#tooltip.innerHTML = lines.join('<br>');
```

`lines` includes `clipId` (from `key-map.json`), `name` and `triggerType` (from `meta.json`). If
any of those contain HTML like `<img src=x onerror=…>`, it executes in the mainframe browser
context. Threat model is low-severity (a VJ artist authors malicious meta for their own show), but
the fix is cheap and honest: use `textContent` for each line and a real `<br>` element between
them.

Scope: `mainframe/src/js/PianoRoll.js` only. Add a test that a `clipId` containing markup is
rendered as text, not executed.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
