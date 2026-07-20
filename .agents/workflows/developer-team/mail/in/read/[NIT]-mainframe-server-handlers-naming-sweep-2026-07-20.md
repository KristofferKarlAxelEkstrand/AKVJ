---
type: nit
from: nitpicker
created: 2026-07-20T13:41:24Z
---

# Nitpicker Findings: `mainframe/server/handlers/`

Cleaned up a couple of small naming nits in the API handlers!

- [ ] `mainframe/server/handlers/clips.js`: `let spriteData;` → `let spriteBuffer;` (avoid the vague "data" when it's a file buffer)
- [ ] `mainframe/server/handlers/clips.js`: `const { ..., frameDurations } = body;` → `frameDurationsMs` (duration variable without units in its name, and line 258 uses it as ms)
