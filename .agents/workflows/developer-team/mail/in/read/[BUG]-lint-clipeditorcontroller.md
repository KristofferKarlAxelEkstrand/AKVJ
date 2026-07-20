---
type: bug
from: qa-reviewer
created: 2026-07-20T13:28:00Z
---

The global `npm run lint` command is currently failing due to an unused variable in `mainframe/src/js/ClipEditorController.js`:
`4:10  error  'DEFAULT_FALLBACK_FPS' is defined but never used  no-unused-vars`

This breaks CI for the entire repository.
