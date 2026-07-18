# Task 217: Use --prompt-file Flag for Agent Role Prompt Loading

## Severity: Low-Medium (Quality — prompts currently arrive as "user" turns, not system context)

## Location
- `devin-team-controller/src/acp/AcpClient.ts` — `start()` spawn args
- `devin-team-controller/src/acp/AcpClientPool.ts` — `startAgent()`, `#loadPromptFile()`

## Problem

Currently, agent role prompts are loaded from disk in `startAgent()` and sent as the **first `session/prompt` turn** after `session/new`. This means the agent receives its entire system persona — its role, rules, communication protocol, all domain knowledge — as if it were a user message.

This has two issues:
1. **Context classification**: The agent's role prompt should be its foundational instruction set, not a user turn. As a user turn it competes with real incoming work messages in the conversation history.
2. **Unnecessary complexity**: `startAgent()` reads the file, sends it as a prompt, waits for the agent to respond to it — adding latency and one extra LLM round-trip before the agent is actually ready.

Task 205 confirmed that Devin CLI supports a `--prompt-file <FILE>` top-level flag:
```
devin --model <model> --permission-mode <mode> --prompt-file <path> acp
```
This loads the prompt file as the agent's initial system-level context at spawn time, before the ACP session starts. The agent is oriented from the start, with no extra round-trip.

## Requirements

1. **Add `--prompt-file <absolutePath>` to the spawn args in `AcpClient.start()`**:
   ```typescript
   const args = ['--model', model, '--permission-mode', permissionMode, '--prompt-file', promptFilePath, 'acp'];
   ```
   The prompt file path must be absolute (resolve relative to workspace root in `AcpClientPool`).

2. **Remove the explicit prompt send from `startAgent()`**:
   - Delete `#loadPromptFile()` call
   - Delete `await client.prompt(promptContent)` after `newSession()`
   - Agent is already oriented via `--prompt-file` at spawn time

3. **Keep `promptFile` in `AgentConfig`** — it's still needed to resolve the path for `--prompt-file`.

4. **Update `AcpClient.start()` signature** to accept the prompt file path:
   ```typescript
   async start(model: string, permissionMode: string, promptFilePath: string): Promise<AcpInitializeResult>
   ```

5. **On resume (Task 214)**: if resuming an existing session, skip `--prompt-file` — the agent already has its role context in history. Only pass `--prompt-file` on fresh session creation.

## Acceptance Criteria
- [ ] Agent spawned with `--prompt-file <path>` in args
- [ ] No explicit prompt-send call in `startAgent()` after `newSession()`
- [ ] Agent receives work messages (file events) as the first real prompt turns
- [ ] On session resume, `--prompt-file` is omitted
- [ ] Compile clean

## Verification
```bash
# Check that spawn args include --prompt-file
# Add a console.log in AcpClient.start() temporarily:
# console.error('[AcpClient] Spawning:', binaryPath, args.join(' '));
# Then start an agent and confirm the flag appears in stderr
```

## Notes
- Verify the flag is `--prompt-file` not `--system-prompt` or `--context-file` — Task 205 confirmed `--prompt-file` but double-check against `devin --help` in case it changed.
- If `--prompt-file` is not supported by `session/resume`, the current send-as-first-turn approach remains valid for resume. A guard in `startAgent()` handles this naturally: only pass `--prompt-file` when calling `newSession()`, not when resuming.
- This is a quality improvement, not a bug fix. If the flag causes issues, the fallback is the current send-as-prompt approach.

## References
- Task 205 findings — `--prompt-file <FILE>` flag confirmed
- [better-control-of-team.md](../better-control-of-team.md) — implementation plan
- `devin-team-controller/src/acp/AcpClientPool.ts` — `#startFreshAgent()`, `startAgent()`
- `devin-team-controller/src/acp/AcpClient.ts` — `start()` spawn args

## Completed

**Date**: 2026-07-18
**Changed**:
- `devin-team-controller/src/acp/AcpClient.ts` — `start(model, permissionMode, promptFilePath, resumeSessionId?)`: when not resuming, adds `--prompt-file <promptFilePath>` to spawn args; when resuming, uses `--resume <id>` instead (mutually exclusive, as expected).
- `devin-team-controller/src/acp/AcpClientPool.ts` — `#startFreshAgent()` resolves `promptFilePath` from `join(this.#promptsDir, config.promptFile)` and passes it through. Removed `#loadPromptFile()` method and `readFile` import — no longer needed since the CLI handles loading.
