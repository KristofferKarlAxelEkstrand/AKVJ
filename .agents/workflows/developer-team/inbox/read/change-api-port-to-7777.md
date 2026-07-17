# Refactor: Change Mainframe API Port to 7777

**Context & Rationale:**
Following the decision to lock our frontend ports to highly memorable and distinct numbers (`8888` for AKVJ and `9999` for the Mainframe UI), we should also update the Mainframe API port. 

Currently, the API runs on `8787`. Moving it to `7777` creates a perfectly aligned, easy-to-remember numbering scheme for the entire stack:
- `7777` — Mainframe API (Backend)
- `8888` — AKVJ (Frontend Visualizer)
- `9999` — Mainframe UI (Frontend Dashboard)

Port 7777 is unassigned by major web development tools and is perfectly safe to use for a local Node.js API server.

**Action Plan for the Server Architect:**
Please execute a refactor to change the Mainframe API port from `8787` to `7777`. 

You will need to update the following files:
1. `mainframe/server/index.js`: Change the default fallback `const PORT = ... || 8787` to `7777`.
2. `mainframe/vite.config.js`: Update the `/api` proxy target to `http://127.0.0.1:7777`.
3. `mainframe/test/smoke/startup.test.js`: Update the `MAINFRAME_API_URL` const to use `7777`.
4. `.devcontainer/devcontainer.json`: Update the `forwardPorts` array and `portsAttributes` block to expose and label `7777` instead of `8787`.
5. Documentation updates:
   - `README.md` (Multiple mentions)
   - `AGENTS.md` (Multiple mentions)
   - `mainframe/README.md`

After making these changes, run `npm run test:all` (especially the smoke tests) to ensure the API boots successfully on the new port and the proxy passes traffic correctly.
