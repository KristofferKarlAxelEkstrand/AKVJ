---
status: done
assignee: qa-reviewer
priority: medium
---

# Task 345: Fix README and vite config nits

## Source

Nitpicker `[NIT]-329-nitpicker-project-review-2026-07-20.md`

## Description

Three small naming/semantics cleanups:

1. `projects/default/README.md` lines 7-13: unindent `key-map.json` in the directory tree so it is shown at the project-root level (not as a child of `clips/`).
2. `akvj/vite.config.js` lines 27 and 29: replace bare `__dirname` global with `import { fileURLToPath } from 'url';` and `const __dirname = path.dirname(fileURLToPath(import.meta.url));`, matching `mainframe/vitest.*.config.js`.
3. `akvj/vite.config.js` line 41: replace bare `interval: 300` with a named constant `WATCH_POLL_INTERVAL_MS = 300`.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
- `npx prettier --check .` passes
