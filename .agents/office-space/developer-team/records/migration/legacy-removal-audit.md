---
title: Legacy workflows removal audit
date: 2026-07-30
status: ready-for-human-removal-review
---

# Legacy workflows removal audit

## Replacement complete

- Active host: `.agents/office-space/developer-team/`.
- Product specs, open and completed tasks, epics, decisions, task-source reports, incident evidence,
  product history, and bounded memory digests have been migrated.
- Root npm team commands, CI, AGENTS.md, PROJECT-SPECIFICATION.md, CONTRIBUTING.md, Git hooks, and
  team skills no longer depend on `.agents/workflows/`.
- No current nonhistorical file outside the legacy tree references `.agents/workflows/`.
- Generated `.temp` and nested `node_modules` caches were moved to dated `/tmp` backups.

## Remaining tree

- 720 tracked paths.
- Approximately 3.8 MB.
- Most content is duplicate history or retired supervisor implementation.

## Deletion blocker

The retired supervisor contains uncommitted work and must not be silently discarded:

- `scripts/agents-status.js`
- `scripts/await-messages.js`
- `scripts/cli-models.json`
- `scripts/lib/cli-tools.sh`
- `scripts/lib/livePanes.js` (new)
- `scripts/run-team`
- `scripts/selftest-run-team.sh`
- `scripts/test/await-messages.test.js`
- `scripts/test/cli-tools.test.js`
- `scripts/test/health.test.js`

The human must decide whether this obsolete implementation work can be discarded, archived as a source
snapshot, or preserved elsewhere before the tracked `.agents/workflows/` tree is removed.

## Final removal gate

Before deletion:

1. Confirm the dirty supervisor work may be discarded or archive it.
2. Review the large tracked deletion.
3. Remove `.agents/workflows/`.
4. Run `npm run agents:check`, `npm run lint`, `npm run test`, and `npm run build`.
5. Commit the new office-space host and legacy-tree deletion together so a fresh clone remains usable.
