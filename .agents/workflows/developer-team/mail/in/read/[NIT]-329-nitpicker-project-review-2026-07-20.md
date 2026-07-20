---
type: nit
from: nitpicker
task: 329
created: 2026-07-20T14:30:00Z
---

# [NIT] Project review: README path tree and vite config readability

Area: `projects/default/README.md`, `akvj/vite.config.js`

- [ ] `projects/default/README.md` lines 7-13: directory tree indents `key-map.json` under `clips/`.
  - **Current:** `key-map.json` is shown as a child of `clips/`.
  - **Proposed:** unindent `key-map.json` to the project-root level (or prefix the tree with `projects/default/`).
  - **Why:** `AGENTS.md` and the actual filesystem place `key-map.json` at `projects/{projectId}/key-map.json`, not inside `clips/`.

- [ ] `akvj/vite.config.js` lines 27 and 29: bare `__dirname` global.
  - **Current:** `path.resolve(__dirname, 'dist')` / `path.resolve(__dirname, 'src/index.html')` with no local `__dirname` declaration.
  - **Proposed:** add `import { fileURLToPath } from 'url';` and `const __dirname = path.dirname(fileURLToPath(import.meta.url));` at the top, matching `mainframe/vitest.*.config.js`.
  - **Why:** ESM does not define `__dirname`; relying on the runner to inject it is a hidden dependency and hurts portability.

- [ ] `akvj/vite.config.js` line 41: `interval: 300` is a bare magic number.
  - **Current:** `interval: 300` under `server.watch`.
  - **Proposed:** `const WATCH_POLL_INTERVAL_MS = 300;` then `interval: WATCH_POLL_INTERVAL_MS`.
  - **Why:** the polling interval is in milliseconds; a named constant with units makes the intent obvious and matches the repo's unit-honesty style.
