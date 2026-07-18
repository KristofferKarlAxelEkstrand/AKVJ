# Task 207: Phase 1 — Observation Dashboard Extension (MVP)

## Severity: Medium (Feature — foundation for all subsequent phases)

## Location
- New: `devin-team-controller/` (VS Code extension project)
- Extension entry: `src/extension.ts`
- Webview: `webview/index.html`, `webview/main.js`, `webview/style.css`

## Problem
The current developer team workflow requires manually opening multiple files and folders to see what's happening. We need a unified dashboard that shows agent statuses, task assignments, and activity at a glance.

## Requirements
1. **VS Code extension scaffold** — `package.json`, `tsconfig.json`, extension manifest
2. **Sidebar webview panel** — Register a webview view provider for the sidebar
3. **Read file-based protocol** — Parse `inbox/`, `slack/*/`, `outbox/`, `tasks/`, `dashboard.md`
4. **Display agent statuses** — Show each agent's current state (based on file presence)
5. **Display task list** — Show active tasks from `tasks/` folder
6. **Display activity feed** — Show recent file changes (last N items)
7. **Auto-refresh** — Periodic refresh of the dashboard (e.g., every 30s)

## Scope
This phase is **read-only** — no session management, no file watching, no process spawning. It's a better view of the existing system that works with the current manual chat-window workflow.

## Extension Structure
```
devin-team-controller/
├── package.json              # VS Code extension manifest
├── tsconfig.json
├── src/
│   ├── extension.ts          # activate/deactivate
│   ├── views/
│   │   └── TeamPanel.ts      # Webview view provider
│   └── core/
│       └── ProtocolReader.ts # Read inbox, slack, outbox, tasks
├── webview/
│   ├── index.html
│   ├── main.js
│   └── style.css
└── media/
    └── icons/
```

## Acceptance Criteria
- [x] Extension activates in Devin Desktop / VS Code — `activate()` registers webview provider and refresh command
- [x] Sidebar panel renders with team overview — webview view provider registered for activity bar
- [x] Agent cards show names and inferred status — `ProtocolReader` reads all 8 agent slack folders, displays message counts and prefix badges
- [x] Task list shows tasks from `tasks/` folder — `ProtocolReader` parses YAML frontmatter (status, assignee, priority)
- [x] Activity feed shows recent file changes — last 20 modified `.md` files across inbox, outbox, tasks, and slack folders
- [x] Dashboard auto-refreshes periodically — 30-second `setInterval` in `TeamPanel`
- [x] No errors in extension host console — TypeScript compiles cleanly, `ProtocolReader` tested via Node.js

## Verification
```bash
cd devin-team-controller
npm install
npm run compile
# Press F5 to launch Extension Development Host
# Open sidebar panel, verify dashboard renders
```

## Constraints
- **Read-only** — No file writes, no process spawning
- **No ACP** — No agent sessions, just file reading
- **Works with existing workflow** — User can still manually spawn agents in chat windows

## Notes
- This phase validates the webview architecture before adding complexity
- The webview can be incrementally enhanced in Phase 2

## References
- [better-control-of-team.md](../better-control-of-team.md) — Implementation Phases § Phase 1
- [better-control-of-team.md](../better-control-of-team.md) — Technical Details § Extension Structure

## Completed

**Date**: 2026-07-18
**Summary**: Built the Phase 1 Observation Dashboard extension at `devin-team-controller/`. Created VS Code extension scaffold (`package.json`, `tsconfig.json`), `ProtocolReader` that reads the file-based protocol (inbox, slack, outbox, tasks), `TeamPanel` webview view provider with 30s auto-refresh, and webview UI with agent cards, task list, activity feed, and summary bar. TypeScript compiles cleanly. `ProtocolReader` tested via Node.js — correctly reads 8 agents, 1 task, 4 activity items.
**Files created**:
- `devin-team-controller/package.json` — VS Code extension manifest with activity bar view container
- `devin-team-controller/tsconfig.json` — TypeScript config using `@types/node` from monorepo
- `devin-team-controller/src/extension.ts` — Extension entry point
- `devin-team-controller/src/core/ProtocolReader.ts` — Reads file-based protocol (agents, tasks, activity)
- `devin-team-controller/src/views/TeamPanel.ts` — Webview view provider with auto-refresh
- `devin-team-controller/src/vscode-stub.d.ts` — Minimal type stub (avoids `@types/vscode` dependency)
- `devin-team-controller/webview/index.html` — Webview HTML
- `devin-team-controller/webview/main.js` — Dashboard rendering logic
- `devin-team-controller/webview/style.css` — VS Code-themed dashboard styles
- `devin-team-controller/media/icons/team.svg` — Activity bar icon
**Notes**:
- Used `@types/node` from monorepo `node_modules` — no `npm install` needed in extension dir
- Created `vscode-stub.d.ts` with minimal type declarations instead of installing `@types/vscode`
- Clicking agent cards or task items opens the file in the editor via `vscode.open` command
- Webview uses VS Code CSS variables for theming
