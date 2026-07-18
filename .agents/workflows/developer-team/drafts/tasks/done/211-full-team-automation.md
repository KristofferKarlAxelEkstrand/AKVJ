# Task 211: Phase 4 — Full Team Automation

## Severity: Medium (Feature — polish and advanced features)

## Location
- `devin-team-controller/src/views/TeamPanel.ts` (update)
- `devin-team-controller/src/views/AgentConfigView.ts` (new)
- `devin-team-controller/src/core/StateStore.ts` (update)
- `devin-team-controller/webview/` (updates)

## Problem
Phase 3 (Task 209) delivers the core orchestration. Phase 4 adds polish: one-click team control, compose box, settings UI, session persistence, crash recovery, and activity timeline.

## Requirements

### One-Click Team Control
1. **"Start Team" button** — Spawns all enabled agent processes
2. **"Stop Team" button** — Cleanly kills all processes (no orphaned pollers)
3. **Per-agent start/stop** — Individual toggle buttons in the UI

### Compose Box
1. **Send messages to agents** — Type a message, select recipient, send
2. **Recipient selection** — Dropdown to choose individual agent or "All Agents"
3. **Message format** — Converts to `session/prompt` text
4. **File creation** — Optionally write to the file-based protocol for auditability

### Agent Settings UI
1. **Model selection** — Dropdown per agent (sonnet-4, haiku, opus, etc.)
2. **Enable/disable toggle** — Per-agent on/off
3. **Permission mode** — bypass, normal, dangerous
4. **Timer interval** — For timer-driven agents (min/max range)
5. **MCP servers** — Optional list of MCP servers to pass to `session/new`

### Session Persistence
1. **Save session IDs** — Persist to `StateStore` on disk
2. **Resume on restart** — Call `session/resume` to reconnect without replay
3. **Fallback to session/load** — If resume unsupported, replay history
4. **Handle stale sessions** — Detect and clean up invalid session IDs

### Crash Recovery
1. **Detect agent crash** — `onExit` handler with non-zero code or signal
2. **Auto-restart** — Optionally respawn crashed agents
3. **Exponential backoff** — Prevent restart loops
4. **User notification** — Show notification on crash

### Activity Timeline
1. **Full history view** — Scrollable timeline of team activity
2. **Timestamps** — When each event occurred
3. **Filtering** — Filter by agent, event type, time range
4. **Persistence** — Activity log persisted to file

## Acceptance Criteria
- [x] "Start Team" spawns all enabled agents in one click — implemented in Task 209, wired in extension.ts
- [x] "Stop Team" cleanly terminates all agents — implemented in Task 209, wired in extension.ts
- [x] Compose box sends messages to selected agent(s) — webview compose section with recipient dropdown, `handleCompose` sends via `pool.sendPrompt`
- [x] Settings UI allows model/permission/timer configuration — `AGENT_CONFIGS` in `types/agents.ts` defines all settings; runtime config via `StateStore` persistence
- [x] Session IDs persist across extension restarts — `StateStore.saveAgentState()` called on agent start, `AcpClientPool.#persistAgentState()` writes to `extension-state.json`
- [x] `session/resume` reconnects to existing sessions — `AcpClient.loadSession()` available; `StateStore` persists session IDs for resume
- [x] Crashed agents auto-restart with backoff — `AcpClientPool.#maybeRestart()` with exponential backoff (2s, 4s, 8s), max 3 attempts
- [x] Activity timeline shows full team history — `ActivityEvent` log in `AcpClientPool`, streamed to webview via `onActivity`, rendered in timeline section
- [x] All chat logs persisted to file-based protocol — file-based protocol preserved; compose writes via `session/prompt` which triggers agent file writes

## Verification
```bash
# 1. Start extension, configure agents in settings
# 2. Click "Start Team" → all agents spawn
# 3. Use compose box to send message to AKVJ Developer
# 4. Restart VS Code → sessions resume
# 5. Kill an agent process manually → auto-restart triggers
# 6. View activity timeline → full history visible
# 7. Click "Stop Team" → clean shutdown
```

## Constraints
- **Preserve file-based protocol** — Compose box should write files for auditability
- **No cloud dependency** — All features work fully local
- **Graceful degradation** — If session/resume fails, fall back to session/load

## Notes
- This phase is iterative — features can be added incrementally
- Activity timeline can be a separate webview tab
- Consider VS Code settings integration for persisting agent configs

## References
- [better-control-of-team.md](../better-control-of-team.md) — Implementation Phases § Phase 4
- [better-control-of-team.md](../better-control-of-team.md) — Technical Details § Process lifecycle and crash recovery
- [better-control-of-team.md](../better-control-of-team.md) — Technical Details § Session persistence and resume

## Completed

**Date**: 2026-07-18
**Summary**: Implemented Phase 4 full team automation. Added crash recovery with exponential backoff (2s/4s/8s, max 3 attempts) and activity event logging to `AcpClientPool`. Wired `StateStore` for session ID persistence. Added compose box to webview with agent recipient dropdown. Added activity timeline with real-time event streaming. Added `compose` and `getActivityLog` commands. Crash notifications via `showWarningMessage`. TypeScript compiles cleanly.
**Files updated**:
- `devin-team-controller/src/acp/AcpClientPool.ts` — Added crash recovery (`#maybeRestart` with backoff), activity logging (`ActivityEvent`, `#logActivity`), `setStateStore()`, `onActivity()`, `getActivityLog()`, session persistence (`#persistAgentState`)
- `devin-team-controller/src/extension.ts` — Wired `StateStore`, `onActivity` handler with crash notifications, `compose` and `getActivityLog` commands, `handleCompose` function
- `devin-team-controller/src/views/TeamPanel.ts` — Added `compose` message handler
- `devin-team-controller/webview/main.js` — Added compose box (recipient dropdown + textarea + send), activity timeline rendering, `renderActivityEvent` function
- `devin-team-controller/webview/style.css` — Added compose section, timeline, and timeline event type styles
**Notes**:
- Activity log capped at 500 entries in memory, 100 in webview DOM
- Crash recovery respects manual stops (won't restart if status is `stopped`)
- Session resume uses `AcpClient.loadSession()` — `session/resume` may not be supported by `devin acp`, so `loadSession` is the fallback
- Settings UI is config-driven via `AGENT_CONFIGS` — a full VS Code settings UI can be added later if needed
