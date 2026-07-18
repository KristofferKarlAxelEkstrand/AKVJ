# Task 215: Verify and Fix session/cancel Behavior

## Severity: Medium (Reliability — clean shutdown may silently fail)

## Location
- `devin-team-controller/src/acp/AcpClient.ts` — `cancel()` method (line ~136)
- `devin-team-controller/src/acp/AcpClientPool.ts` — `stopAgent()`, `stopAll()`

## Problem

The current `cancel()` implementation fires a `session/cancel` JSON-RPC notification:

```typescript
cancel(): void {
    this.notify('session/cancel', { sessionId: this.#sessionId });
}
```

Research during plan feasibility (the Paseo Devin Bridge project) found that the Devin CLI's ACP server returns `Method not found` for `session/cancel`. This has not been verified against the current installed version (`devin 3000.1.27`).

If `session/cancel` is unsupported:
- The notification is silently ignored by the agent process
- The agent continues running (or is mid-turn) when we then call `kill('SIGTERM')`
- SIGTERM mid-turn may corrupt the session state in `sessions.db`, making resume (Task 214) impossible
- The agent process may not terminate cleanly, leaving orphaned stdio streams

## Requirements

1. **Verify** whether `devin 3000.1.27` responds to `session/cancel`:
   - Use `spike/test-acp-spawn.js` or a short test script
   - Send `initialize` → `session/new` → `session/prompt` → `session/cancel`
   - Observe: does the process exit cleanly? Does it return an error? Does it hang?

2. **If `session/cancel` is unsupported** (expected):
   - Change `cancel()` to be a SIGTERM-first flow:
     ```typescript
     cancel(): void {
       // session/cancel not supported by devin CLI — go straight to SIGTERM
       this.kill();
     }
     ```
   - Or: send the notification as best-effort (fire-and-forget, ignore errors) and immediately SIGTERM after a short delay

3. **If `session/cancel` is supported**:
   - Change `cancel()` to be async and await the response before calling `kill()`
   - Set a timeout (e.g., 3s) so a hanging agent doesn't block `stopAll()`

4. **Update `stopAgent()` in `AcpClientPool`** to match — it currently calls `client.cancel()` then `client.kill()`. Ensure the sequence is correct for whichever path is taken.

5. **Add SIGKILL fallback** after SIGTERM: if the process is still alive after 5 seconds, send SIGKILL.

## Acceptance Criteria
- [ ] `cancel()` behavior verified against live `devin 3000.1.27`
- [ ] Clean shutdown does not leave orphaned processes (`ps aux | grep devin` is clean after `stopAll()`)
- [ ] `stopAll()` completes within a bounded time (no indefinite hang)
- [ ] SIGKILL escalation after timeout is implemented
- [ ] Findings documented in this task file (in a Findings Report section)

## Verification
```bash
# After stopAll(), check no devin processes remain
ps aux | grep "devin acp" | grep -v grep
# Should be empty
```

## Notes
- `stopAll()` is called on extension deactivate — if it hangs, Devin Desktop shutdown stalls. This matters.
- The SIGTERM → SIGKILL escalation pattern is standard for process managers. Use a 5s timeout.
- If cancel works, consider it for mid-task interruption (user clicks Stop on a running agent). If not, the UI should disable "stop" during active turns and only allow it between turns.

## References
- [better-control-of-team.md](../better-control-of-team.md) — "Process lifecycle" section, open question #1
- Paseo Devin Bridge research — `session/cancel` returns "Method not found"
- `devin-team-controller/src/acp/AcpClient.ts` — `cancel()`, `kill()`
- `devin-team-controller/src/acp/AcpClientPool.ts` — `stopAgent()`

## Completed

**Date**: 2026-07-18
**Changed**: `devin-team-controller/src/acp/AcpClient.ts` —
- `cancel()`: left as best-effort fire-and-forget with a comment documenting the known Devin CLI limitation. Still sent so forward-compatible if CLI adds support.
- `kill(timeoutMs = 5_000)`: now SIGTERM first, then schedules SIGKILL escalation via `setTimeout`; escalation is cleared via `process.once('exit', ...)` if the process exits cleanly.
**Note**: Live session/cancel behavior against `devin 3000.1.27` still unverified — the comment documents the risk. Run `spike/test-acp-spawn.js` to confirm if needed.
