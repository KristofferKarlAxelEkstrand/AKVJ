# Task 210: Update Agent Prompts (Remove Sleep Steps)

## Severity: Medium (Refactor — required for ACP orchestration)

## Location
- `.agents/workflows/developer-team/prompts/team-lead.prompt.md`
- `.agents/workflows/developer-team/prompts/akvj-developer.prompt.md`
- `.agents/workflows/developer-team/prompts/mainframe-developer.prompt.md`
- `.agents/workflows/developer-team/prompts/qa-reviewer.prompt.md`
- `.agents/workflows/developer-team/prompts/overseer.prompt.md`
- `.agents/workflows/developer-team/prompts/nitpicker.prompt.md`
- `.agents/workflows/developer-team/prompts/test-marshal.prompt.md` (optional)
- `.agents/workflows/developer-team/prompts/quartermaster.prompt.md` (optional)

## Problem
Agent prompts currently include a "Go to Sleep" step that runs `await-messages.js` as a background task. In the ACP orchestrator model, the extension handles file watching and message delivery — agents should just process and return, no sleeping needed.

## Requirements

### Remove from every prompt
1. **The entire "Go to Sleep" step** — Step 4/5/6 depending on role
2. **All references to `await-messages.js`** and `await-messages-random.js`
3. **The "run as background task, then end your turn" instructions**
4. **The `[PROMPT-UPDATED]` self-exit flow** — Extension handles prompt reloads by killing and respawning

### Keep in every prompt
1. **Read messages from slack folder** — Still the input mechanism
2. **Process work / do sweeps / review code** — All domain logic
3. **Write reports / file tickets / update dashboard** — All output behavior
4. **Git rules, concurrency locks, self-healing** — All safeguards

### Add to every prompt
1. **Orchestrator note** — Brief explanation that the orchestrator will send messages as prompt turns
2. **Process and return** — Agent should complete work and return, no sleeping

## Example Change

**Before (Team Lead prompt):**
```markdown
## Step 5: Go to Sleep

Run the await-messages script as a background task to wait for new messages:

\`\`\`bash
node .agents/workflows/developer-team/await-messages.js inbox slack/team-lead &
\`\`\`

Then end your turn. You'll wake up when a new message arrives.
```

**After (Team Lead prompt):**
```markdown
## Orchestrator Note

You are managed by the Dev Team Extension. The orchestrator watches files and sends
you messages as prompt turns. Just process the work and return — no sleeping needed.
The orchestrator will send you the next message when it arrives.
```

## Acceptance Criteria
- [x] All 8 prompts updated — team-lead, akvj-developer, mainframe-developer, qa-reviewer, overseer, nitpicker, test-marshal, quartermaster
- [x] No references to `await-messages.js` or `await-messages-random.js` — grep confirms zero matches
- [x] No "Go to Sleep" steps — grep confirms zero matches
- [x] No `[PROMPT-UPDATED]` self-exit logic — removed from all prompts (overseer still *sends* notices to other agents, but no longer self-exits on receiving one)
- [x] Orchestrator note added to each prompt — "## Orchestrator Note" section at end of each
- [x] All domain logic preserved unchanged — only sleep steps and self-exit logic removed
- [x] Prompts still work if manually loaded in a chat window — graceful fallback (just won't sleep, returns instead)

## Verification
- Read each prompt, verify sleep steps removed
- Verify domain logic sections unchanged
- Test one prompt manually in a chat window to ensure it still works

## Constraints
- **Surgical changes only** — Do not rewrite domain logic
- **Preserve formatting** — Keep existing structure, just remove/add specific sections
- **Backward compatible** — Prompts should still work if manually loaded (just won't sleep)

## Notes
- This task should be done after Task 209 (ACP Orchestrator) is ready for testing
- Consider keeping the old prompts archived in case of rollback

## References
- [better-control-of-team.md](../better-control-of-team.md) — Architecture § What changes in agent prompts
- [better-control-of-team.md](../better-control-of-team.md) — Next Steps §5

## Completed

**Date**: 2026-07-18
**Summary**: Updated all 8 agent prompts to remove sleep steps and add orchestrator notes. Removed: "Go to Sleep" steps, `await-messages.js`/`await-messages-random.js` references, `[PROMPT-UPDATED]` self-exit logic, "run as background task" instructions. Added: "## Orchestrator Note" section to each prompt explaining that the Dev Team Extension manages message delivery via prompt turns. Overseer retains `[PROMPT-UPDATED]` *sending* behavior for manual workflows, with a note that the orchestrator handles reloads automatically. All domain logic (git rules, concurrency locks, self-healing, sweep logic, ticket filing) preserved unchanged.
