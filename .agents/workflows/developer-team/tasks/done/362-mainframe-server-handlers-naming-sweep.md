---
status: done
assignee: mainframe-developer
priority: low
review: machine
---

# Task 362: Nitpicker Findings: `mainframe/server/handlers/`

Cleaned up a couple of small naming nits in the API handlers!

- [ ] `mainframe/server/handlers/clips.js`: `let spriteData;` → `let spriteBuffer;` (avoid the vague "data" when it's a file buffer)
- [ ] `mainframe/server/handlers/clips.js`: `const { ..., frameDurations } = body;` → `frameDurationsMs` (duration variable without units in its name, and line 258 uses it as ms)
- [ ] `mainframe/server/handlers/clips.js` export `serveSprite` → `handleGetClipSprite`; update import + call in `mainframe/server/routes/router.js` (~L3, L35) — from `[NIT]-server-writeJsonAtomic-serveSprite-2026-07-20.md`
