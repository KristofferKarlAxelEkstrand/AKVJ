# Task 220: Prompt File Change Detection — Kill and Respawn on Update

## Severity: Medium (Correctness — prompt updates currently silently fail or confuse agents)

## Location
- `devin-team-controller/src/core/FileWatcher.ts` — add watch on `prompts/` dir
- `devin-team-controller/src/core/MessageRouter.ts` — handle `[PROMPT-UPDATED]` prefix
- `devin-team-controller/src/extension.ts` — wire respawn on prompt change
- `devin-team-controller/src/acp/AcpClientPool.ts` — add `respawnAgent()` method

## Problem

The plan (Open Question 4) calls out that the extension should handle prompt updates by killing and respawning the agent with the new prompt loaded via `--prompt-file`. Currently two things are wrong:

### Problem A: `[PROMPT-UPDATED]` message is forwarded as a prompt turn

When the Overseer writes `[PROMPT-UPDATED]-akvj-developer.md` to `slack/akvj-developer/`, the `FileWatcher` detects it and `MessageRouter` routes it to the `akvj-developer` agent as a normal `session/prompt` turn. The agent receives a message saying "you have been updated" but nothing actually happens — the running process still has the old prompt in its context.

**Expected behaviour**: The extension should detect the `[PROMPT-UPDATED]` prefix, kill the running agent process, and respawn it with the updated prompt file via `--prompt-file`. The `[PROMPT-UPDATED]` file should NOT be forwarded as a prompt turn.

### Problem B: Prompt file edits on disk have no effect

If a developer edits `prompts/akvj-developer.prompt.md` directly (e.g., after the Overseer updates it and commits), the running `akvj-developer` agent process is completely unaffected. The new prompt only takes effect after a manual stop/restart.

**Expected behaviour**: The extension should watch `prompts/*.prompt.md` for changes and respawn the affected agent automatically.

## Requirements

### 1. Handle `[PROMPT-UPDATED]` in `MessageRouter`

Add a method to classify a file event as a respawn signal vs a normal prompt:

```typescript
// In MessageRouter
isRespawnSignal(filename: string): boolean {
    return filename.startsWith('[PROMPT-UPDATED]');
}
```

In `extension.ts` `handleFileEvent()`, check this before routing:
```typescript
if (router.isRespawnSignal(filename)) {
    // Extract target agent from filename, e.g. "[PROMPT-UPDATED]-akvj-developer.md"
    const targetRole = router.extractRespawnTarget(filename);
    if (targetRole) {
        await pool.respawnAgent(targetRole);
    }
    return; // Do NOT forward as a prompt turn
}
```

### 2. Watch `prompts/` directory in `FileWatcher`

Add a watcher on `.agents/workflows/developer-team/prompts/` for `*.prompt.md` changes. On change, emit a `promptChanged` event with the role name derived from the filename:

```typescript
// promptFile: "akvj-developer.prompt.md" → role: "akvj-developer"
onPromptChanged(handler: (role: AgentRole) => void): void { ... }
```

### 3. Add `respawnAgent()` to `AcpClientPool`

```typescript
async respawnAgent(role: AgentRole): Promise<void> {
    const config = this.#configs.get(role);
    if (!config) return;
    this.#logActivity(role, 'restarting', 'Prompt file updated — respawning with new prompt');
    await this.stopAgent(role);
    // Brief pause to let the process fully exit before respawning
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.#startFreshAgent(config, join(this.#promptsDir, config.promptFile));
}
```

Note: fresh start only — don't attempt resume on a prompt-update respawn (the whole point is to get the new prompt loaded as fresh context).

### 4. Wire in `extension.ts`

```typescript
// On [PROMPT-UPDATED] file event
fileWatcher.onPromptChanged(role => {
    pool.respawnAgent(role).catch(err =>
        vscode.window.showErrorMessage(`Failed to respawn ${role}: ${err.message}`)
    );
});
```

## Acceptance Criteria
- [x] `[PROMPT-UPDATED]-<agent>.md` written to any slack dir triggers agent kill + respawn (NOT a prompt turn) — `MessageRouter.isRespawnSignal()` + `extractRespawnTarget()` + early return in `handleFileEvent`
- [x] Direct edits to `prompts/*.prompt.md` trigger automatic respawn for the affected agent — `FileWatcher` watches `prompts/*.prompt.md`, emits `onPromptChanged` events
- [x] Respawned agent uses the updated prompt file — `respawnAgent()` calls `#startFreshAgent()` which uses `--prompt-file`
- [x] Other agents are not affected by a single agent's respawn — `respawnAgent()` only stops/starts the target role
- [x] Compile clean — `npx tsc` passes with no errors
- [x] All tests pass — 33/33 in 2.00s

## Verification
```bash
# Write a [PROMPT-UPDATED] file
echo "# Updated" > .agents/workflows/developer-team/slack/akvj-developer/\[PROMPT-UPDATED\]-test.md
# Check extension output: should see "Respawning akvj-developer with new prompt"
# Check agent is stopped and restarted

# Edit prompt file directly
echo "# Added note" >> .agents/workflows/developer-team/prompts/akvj-developer.prompt.md
# Check extension output: should see the same respawn log
```

## Notes
- The `FileWatcher` debounce (500ms) is important here — rapid successive edits to a prompt file should coalesce into a single respawn. The current debounce covers this.
- On respawn, the `StateStore` sessionId for this role should be cleared (set to `null`) since we're intentionally starting fresh — resuming the old session would defeat the purpose of the prompt update.
- The `extractRespawnTarget()` method needs to handle filenames like `[PROMPT-UPDATED]-akvj-developer.md`, `[PROMPT-UPDATED]-team-lead.md`. The role is between the last `-` before `.md` — or more robustly, strip the prefix and suffix and match against `TIMER_TRIGGER_ROLES` + `FILE_TRIGGER_ROLES`.

## References
- [better-control-of-team.md](../better-control-of-team.md) — Open Question #4 (Prompt updates)
- `devin-team-controller/src/core/FileWatcher.ts`
- `devin-team-controller/src/core/MessageRouter.ts`
- `devin-team-controller/src/acp/AcpClientPool.ts` — `respawnAgent()`
- `devin-team-controller/src/extension.ts` — `handleFileEvent()`

## Completed

**Date**: 2026-07-18
**Summary**: Implemented prompt file change detection with two paths: (A) `[PROMPT-UPDATED]` files in slack dirs are intercepted by `MessageRouter.isRespawnSignal()` before normal routing and trigger `AcpClientPool.respawnAgent()` instead of a prompt turn; (B) direct edits to `prompts/*.prompt.md` are detected by a new `FileWatcher` watcher that emits `onPromptChanged` events. `respawnAgent()` stops the agent, clears the persisted sessionId (fresh start only — no resume on prompt update), waits 500ms, then calls `#startFreshAgent()` with `--prompt-file`. Both paths wired in `extension.ts`.
**Files updated**:
- `devin-team-controller/src/core/MessageRouter.ts` — Added `isRespawnSignal()` and `extractRespawnTarget()` methods
- `devin-team-controller/src/core/FileWatcher.ts` — Added `onPromptChanged()` API, prompt file watcher, `#handlePromptFile()` method
- `devin-team-controller/src/acp/AcpClientPool.ts` — Added `respawnAgent()` method with sessionId clearing and fresh start
- `devin-team-controller/src/extension.ts` — Wired `[PROMPT-UPDATED]` interception in `handleFileEvent()` and `onPromptChanged` handler
