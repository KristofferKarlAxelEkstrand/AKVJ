# Task 31: Change Mainframe API Port to 7777

## Objective
Change the Mainframe API port from 8787 to 7777 for a memorable, aligned port scheme:
- 7777 — Mainframe API
- 8888 — AKVJ
- 9999 — Mainframe UI

## Files to update
1. `mainframe/server/index.js` — default PORT
2. `mainframe/vite.config.js` — /api proxy target
3. `mainframe/test/smoke/startup.test.js` — MAINFRAME_API_URL
4. `.devcontainer/devcontainer.json` — forwardPorts + portsAttributes
5. `README.md` — all mentions of 8787
6. `AGENTS.md` — all mentions of 8787
7. `mainframe/README.md` — all mentions of 8787
