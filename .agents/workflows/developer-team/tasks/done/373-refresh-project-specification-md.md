---
status: done
assignee: qa-reviewer
priority: high
---

# Task 373: Refresh root PROJECT-SPECIFICATION.md

## Source

Overseer `[FEATURE]-refresh-project-specification-md.md`

## Description

Root `PROJECT-SPECIFICATION.md` is stale vs shipped code and `.agents/workflows/developer-team/spec/`. Agents/humans who land on it get wrong guidance (e.g. still documents removed `frameDurationBeats`).

Rewrite or slim so it either:
- (a) matches current shipped behaviour, or
- (b) becomes a short pointer to `.agents/workflows/developer-team/spec/` + `AGENTS.md` and drops duplicated field lists

Do **not** invent new product intent — fold facts from existing specs/`AGENTS.md` only. Human owns open settings-split questions in `spec/goal.md`.

## Notes

- Product specs under `spec/` are mostly `draft` — informative, not binding; do not cite them in task `spec:` frontmatter
- Known stale: clip BPM sync / `frameDurationBeats` → `sync` / `syncLength` / `syncBeats`

## Verification

- `PROJECT-SPECIFICATION.md` no longer contradicts `AGENTS.md` MIDI table or current clip timing fields
- `npx prettier --check PROJECT-SPECIFICATION.md` passes
