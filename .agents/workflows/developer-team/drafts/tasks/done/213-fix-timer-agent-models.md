# Task 213: Fix Timer-Driven Agent Models (claude-haiku)

## Severity: Medium (Cost — unnecessary spend on every sweep)

## Location
- `devin-team-controller/src/types/agents.ts`

## Problem

All 8 agent roles are hardcoded to `claude-sonnet-4`. The plan explicitly called for `claude-haiku` on the four timer-driven agents (Overseer, Nitpicker, Test Marshal, Quartermaster) because sweeps are cheap, frequent, repetitive tasks — sending them through Sonnet is 4–8× more expensive than Haiku with no quality benefit.

The current state:
```typescript
// All four sweep agents in agents.ts
model: 'claude-sonnet-4',  // wrong — should be haiku
```

Event-driven agents (Team Lead, AKVJ Developer, Mainframe Developer, QA Reviewer) correctly warrant Sonnet — they do real code work. Sweep agents check dashboards, file tickets, and do lightweight coordination. Haiku is the right model for them.

## Requirements

1. Change `model` to `'claude-haiku-4-5-20251001'` for these four roles:
   - `overseer`
   - `nitpicker`
   - `test-marshal`
   - `quartermaster`
2. Keep `claude-sonnet-4` for:
   - `team-lead`
   - `akvj-developer`
   - `mainframe-developer`
   - `qa-reviewer`
3. Verify the model string is accepted by `devin --model <model>` at runtime

## Acceptance Criteria
- [ ] Four sweep agents use `claude-haiku-4-5-20251001`
- [ ] Four event-driven agents still use `claude-sonnet-4`
- [ ] Extension compiles with no TypeScript errors
- [ ] Model string matches what Task 205 confirmed the CLI accepts (or updated to correct string if changed)

## Verification
```bash
cd devin-team-controller
npm run compile
grep -n "model" src/types/agents.ts
```

## Notes
- The model string `claude-haiku-4-5-20251001` is the current correct model ID per AGENTS.md. If the Devin CLI uses shorthand like `haiku`, `claude-haiku`, or `claude-haiku-4`, test which variant the CLI accepts — Task 205 showed the CLI accepts shorthands like `opus`, `codex`, so `haiku` may also work.
- The UI settings panel already supports model dropdowns per agent — this task only changes the **default**. Users can override per-session.

## References
- [better-control-of-team.md](../better-control-of-team.md) — Agent Role Definitions table
- `devin-team-controller/src/types/agents.ts`
- Task 205 findings — model flag accepts shorthands

## Completed

**Date**: 2026-07-18
**Changed**: `devin-team-controller/src/types/agents.ts` — overseer, nitpicker, test-marshal, quartermaster model changed from `claude-sonnet-4` to `claude-haiku-4-5-20251001`.
