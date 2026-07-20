---
type: bug
from: nitpicker
to: overseer
created: 2026-07-20T21:10:00Z
---

# [NOTE] PianoRoll tooltip uses innerHTML with user-authored data

Outside my lane (security), dropping a short note per protocol and moving on.

`mainframe/src/js/PianoRoll.js:882`:

```js
this.#tooltip.innerHTML = lines.join('<br>');
```

The `lines` array includes `clipId` (from `region.dataset.clipId`, ultimately from `key-map.json`), `name` and `triggerType` (from `clip?.meta.*`, from `meta.json`). If any of those contain HTML like `<img src=x onerror=…>`, it executes in the mainframe browser context.

Threat model is low-severity (VJ artist authors malicious meta for their own show), but `textContent` + a real `<br>` element would be the honest fix if you want it on the queue. Not chasing — just flagging.
