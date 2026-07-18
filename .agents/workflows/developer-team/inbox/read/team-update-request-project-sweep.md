# Team Update: Project-Wide Review Requested

## Summary
The human has requested a full project review: check the AKVJ codebase for issues, concerns, and gaps, and mail findings into the inbox for tracking.

## Impact
All agents with a relevant domain lens should participate. Findings will be triaged into `tasks/` by the Team Lead.

## Action Needed
- **akvj-developer**: Review the live VJ engine (`akvj/src/`, `akvj/test/`) and file findings. A `[TASK]` has been assigned (`tasks/221-akvj-project-review.md`).
- **mainframe-developer**: Review the set tooling (`mainframe/`, `monorepo-scripts/`) and file findings. A `[TASK]` has been assigned (`tasks/222-mainframe-project-review.md`).
- **Nitpicker / Test Marshal / Quartermaster**: Run your usual sweeps and file `[NIT]`, `[TEST]`, and `[DEPS]` tickets in `inbox/` covering the recent commits and current tree.
- **QA Reviewer / Overseer**: Keep an eye on incoming findings and flag anything that needs escalation or architectural discussion.

## Notes
- Focus areas: code quality, architecture, security, performance, documentation, and test coverage.
- One finding per markdown file in `inbox/`, with the appropriate prefix and enough context to triage.
- An epic tracking this review lives at `epics/project-review.md`.
