# Task 214: Implement Session Resume on Extension Restart

## Severity: High (Reliability — agents lose all context on every extension restart)

## Location
- `devin-team-controller/src/acp/AcpClientPool.ts` — `startAgent()`
- `devin-team-controller/src/acp/AcpClient.ts` — `start()` spawn args
- `devin-team-controller/src/core/StateStore.ts` — already saves `sessionId`

## Problem

`AcpClientPool.startAgent()` always calls `client.newSession()`, creating a fresh session every time. The `StateStore` already persists `sessionId` per agent — that data is saved but never used.

When the extension restarts (Devin Desktop reload, window reopen, crash recovery), all 6–8 agents lose their full conversation history. The agents must re-read the prompt file, re-orient themselves, and re-bootstrap from scratch. This is expensive (tokens), slow (LLM round-trip), and lossy (in-progress context is gone).

Devin CLI supports two resume paths (confirmed in Task 205 findings):
- **`--resume [SESSION_ID]` flag** at spawn time — reconnects to an existing session in `sessions.db` without sending the history as a prompt
- **`session/resume` ACP method** — reconnect mid-protocol

## Requirements

### Option A: `--resume` flag (simpler, recommended first)
1. In `AcpClient.start()`, if a `sessionId` is provided, add `--resume <sessionId>` to spawn args
2. In `AcpClientPool.startAgent()`:
   - Check StateStore for an existing `sessionId` for this role
   - If found: call `client.start(model, permissionMode, existingSessionId)` with the resume flag
   - Skip `client.newSession()` and skip sending the initial prompt file (already in history)
   - If NOT found (first run): current behavior — `newSession()` + send prompt file
3. On resume failure (session not found in `sessions.db`): fall back to `newSession()` + full prompt

### Option B: `session/resume` ACP method (if CLI supports it)
1. After `client.start()`, try `client.resumeSession(sessionId)` before `client.newSession()`
2. If it succeeds, skip the prompt file send
3. If it fails (method not found or session expired), fall back to `newSession()`

### Either way:
- Add `resumeSession(sessionId: string): Promise<boolean>` to `AcpClient` that returns `true` on success, `false` on failure
- Log clearly: `"Resumed session <id>"` vs `"Session not found, starting fresh"`
- Update StateStore on successful resume (no change to sessionId) and on fresh start (new sessionId)

## Acceptance Criteria
- [ ] On second extension start, agents with a saved `sessionId` attempt resume before creating a new session
- [ ] Successful resume is logged and the initial prompt file is NOT re-sent
- [ ] Failed resume (session expired/missing) falls back to `newSession()` + prompt file send gracefully
- [ ] StateStore is updated correctly in both paths
- [ ] Compile clean, unit test added for the fallback path

## Verification
```bash
# First run — note sessionId logged
# Restart extension
# Check logs: "Resumed session sess_xxx" vs "Starting fresh"
# Check agents don't re-send initial prompt on resume
```

## Notes
- Devin's `sessions.db` may have an expiry window — sessions idle for days may be gone. The fallback is essential.
- If `--resume` and `session/resume` both work, prefer `--resume` (simpler: no extra ACP round-trip before session is established).
- The `session/load` ACP method replays full history as prompt turns — avoid it; it wastes tokens and is equivalent to starting fresh from the agent's perspective.
- Task 215 (session/cancel) interacts with this: a cleanly-cancelled session may still be resumable.

## References
- [better-control-of-team.md](../better-control-of-team.md) — "Session persistence and resume" section
- Task 205 findings — `--resume [SESSION_ID]` flag confirmed
- `devin-team-controller/src/acp/AcpClientPool.ts` — `startAgent()`, `#tryResumeAgent()`, `#startFreshAgent()`
- `devin-team-controller/src/core/StateStore.ts` — `sessionId` already persisted

## Completed

**Date**: 2026-07-18
**Changed**:
- `devin-team-controller/src/acp/AcpClient.ts` — `start()` accepts optional `resumeSessionId?`; when provided, spawns with `--resume <id>` instead of `--prompt-file`; added `resumeSession(id)` to set sessionId locally without a `session/new` round-trip.
- `devin-team-controller/src/acp/AcpClientPool.ts` — `startAgent()` loads saved state from `StateStore`, attempts `#tryResumeAgent()` first if a `sessionId` is found; on failure, falls back to `#startFreshAgent()`. The new `#makeClient()` helper removes duplicated client-setup boilerplate.
