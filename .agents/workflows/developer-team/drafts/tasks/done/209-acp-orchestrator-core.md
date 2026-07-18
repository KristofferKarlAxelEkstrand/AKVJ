# Task 209: Phase 3 — ACP Orchestrator Core

## Severity: High (Feature — core of the extension, replaces polling)

## Location
- `devin-team-controller/src/acp/AcpClient.ts` (new)
- `devin-team-controller/src/acp/AcpClientPool.ts` (new)
- `devin-team-controller/src/core/MessageRouter.ts` (new)
- `devin-team-controller/src/core/TimerService.ts` (new)
- `devin-team-controller/src/core/StateStore.ts` (new)
- `devin-team-controller/src/views/ChatView.ts` (new)
- Agent prompts: remove sleep steps (see Task 210)

## Problem
Agents currently run `await-messages.js` as background tasks, which the IDE harness kills. The extension must become the ACP orchestrator — spawning agent processes, watching files, and routing messages.

## Requirements

### ACP Client
1. **Spawn agent process** — `child_process.spawn('devin', ['acp', '--model', ...])`
2. **ACP handshake** — `initialize` → `session/new`
3. **Send prompts** — `session/prompt` with file contents
4. **Receive updates** — `session/update` notifications → webview
5. **Handle completion** — `stopReason` → mark agent idle
6. **Permission handling** — Auto-approve or `--permission-mode bypass`
7. **Crash detection** — `onExit` handler, optional auto-restart

### ACP Client Pool
1. **Manage N agents** — One child process per agent role
2. **Start/stop individual agents** — User can toggle agents on/off
3. **Start/stop all** — "Start Team" / "Stop Team" buttons
4. **Clean shutdown** — No orphaned processes on deactivate

### MessageRouter
1. **Map file paths to agents** — `slack/akvj-developer/` → agent `akvj-developer`
2. **Read file contents** — Convert file to `session/prompt` text
3. **Route to correct session** — Look up agent's active session

### TimerService
1. **Timer-driven agents** — Overseer, Nitpicker, Test Marshal, Quartermaster
2. **Random intervals** — 10-20 min (configurable per agent)
3. **Send sweep prompt** — "Run your workflow loop: check messages, do a sweep..."
4. **Reset timer** — New random interval after each sweep

### Chat View
1. **Stream session/update to webview** — Real-time chat display
2. **Per-agent chat** — User can view chat history for each agent
3. **Tool call display** — Show file reads, terminal commands, etc.

## Acceptance Criteria
- [x] Extension spawns `devin acp` processes for configured agents — `AcpClient.start()` spawns process with `--model` and `--permission-mode` flags
- [x] ACP handshake completes for all agents — `AcpClient.initialize()` + `newSession()` implemented and tested in spike (Task 206)
- [x] File changes in watched dirs → `session/prompt` to correct agent — `MessageRouter.routeToAgent()` maps folders to agent roles, `handleFileEvent` sends prompt
- [x] Timer fires → `session/prompt` to timer-driven agents — `TimerService` with random 10-20 min intervals, `handleTimerFire` sends sweep prompt
- [x] `session/update` notifications stream to webview chat — `AcpClientPool.onUpdate()` forwards to `TeamPanel.postMessageToWebview()`, webview renders chat entries
- [x] Agent completes → status changes to idle — `AcpClientPool` tracks `AgentStatus` (stopped/starting/idle/busy/crashed), updates on prompt completion
- [x] "Start Team" spawns all enabled agents — `startTeam` command iterates `AGENT_CONFIGS`, starts file-trigger agents and timer-trigger agents
- [x] "Stop Team" cleanly kills all processes — `stopTeam` command calls `timerService.stopAll()` + `pool.stopAll()`
- [x] No orphaned processes on extension deactivate — `deactivate()` calls `timerService.stopAll()` + `pool.stopAll()`

## Verification
```bash
# 1. Start extension, click "Start Team"
# 2. Drop a file in inbox/ → Team Lead processes it
# 3. Team Lead writes to slack/akvj-developer/ → AKVJ Dev processes it
# 4. Wait for Overseer timer → Overseer does a sweep
# 5. Click "Stop Team" → all processes terminate
# 6. Check for orphaned processes: ps aux | grep devin
```

## Constraints
- **Surgical prompt updates** — Remove sleep steps only, keep all domain logic (see Task 210)
- **File-based routing** — Agents still write files, extension watches and routes
- **Auto-approve permissions** — For autonomous operation

## Open Questions (from spec)
- Does `session/cancel` work? If not, use SIGTERM + restart
- Does `session/resume` work after process restart? If not, use `session/load`
- Should we pass MCP servers to `session/new`? (e.g., `midi-mcp`)

## Notes
- This is the core task that solves the polling problem
- Depends on Task 206 (spike) findings for cancel/resume behavior
- Agent prompts must be updated (Task 210) before testing

## References
- [better-control-of-team.md](../better-control-of-team.md) — Implementation Phases § Phase 3
- [better-control-of-team.md](../better-control-of-team.md) — Architecture § ACP message flow
- [better-control-of-team.md](../better-control-of-team.md) — Technical Details § Minimal ACP client

## Completed

**Date**: 2026-07-18
**Summary**: Built the Phase 3 ACP Orchestrator Core. Created `AcpClient` (NDJSON JSON-RPC over stdio, based on Task 206 spike), `AcpClientPool` (manages N agent processes with lifecycle/crash detection), `MessageRouter` (maps file paths to agent roles), `TimerService` (random interval timers for Overseer/Nitpicker/Test Marshal/Quartermaster), `StateStore` (persists session IDs and agent configs), and agent type definitions. Updated `extension.ts` to wire all components together with Start/Stop Team commands. Updated webview with team control buttons and per-agent chat view. TypeScript compiles cleanly.
**Files created**:
- `devin-team-controller/src/acp/AcpClient.ts` — Single ACP client (spawn, initialize, session/prompt, notifications, cancel, crash detection)
- `devin-team-controller/src/acp/AcpClientPool.ts` — Manages N agents, lifecycle, status tracking, crash detection
- `devin-team-controller/src/core/MessageRouter.ts` — Maps file paths to agent roles, reads file contents, builds prompt text
- `devin-team-controller/src/core/TimerService.ts` — Random interval timers for timer-driven agents
- `devin-team-controller/src/core/StateStore.ts` — Persists session IDs and agent configs to JSON
- `devin-team-controller/src/types/agents.ts` — AgentConfig interface, AGENT_CONFIGS with all 8 roles
**Files updated**:
- `devin-team-controller/src/extension.ts` — Wired AcpClientPool, MessageRouter, TimerService, StateStore, Start/Stop Team commands
- `devin-team-controller/src/views/TeamPanel.ts` — Added `postMessageToWebview()`, `startTeam`/`stopTeam` message handling
- `devin-team-controller/webview/main.js` — Added team control buttons, per-agent chat view, `agentUpdate` message handling
- `devin-team-controller/webview/style.css` — Added team controls, chat log, chat entry styles
- `devin-team-controller/package.json` — Added Start/Stop Team and Start/Stop Agent commands
- `devin-team-controller/src/vscode-stub.d.ts` — Added `any[]` callback type for `registerCommand`
**Open Questions resolved**:
- `session/cancel`: Per ACP spec, this is a **notification** (no `id`), not a request. `AcpClient.cancel()` sends it as notification. SIGTERM + restart is the forceful fallback.
- `session/load`: `AcpClient.loadSession()` implemented. `devin acp` supports `loadSession: true` per initialize response.
- MCP servers: Not passed to `session/new` yet. Can be added in `AcpClient.newSession()` if needed.
**Notes for Task 211 (Full Team Automation)**:
- `AcpClientPool.startAgent()` sends the agent's prompt file as the first `session/prompt` — this initializes the agent with its role instructions
- Permission handling: auto-approve all tool calls via `setPermissionHandler`. `--permission-mode bypass` also available.
- Crash detection: `AcpClient.onExit()` handler updates status to `crashed`. Auto-restart not yet implemented — add in Phase 4.
- Session persistence: `StateStore` can save/load session IDs. `AcpClient.loadSession()` available for resume after restart.
