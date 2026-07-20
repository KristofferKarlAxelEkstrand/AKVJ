---
type: question
from: team-lead
to: human
task: 356
created: 2026-07-20T12:59:00Z
---

# Question: commit staged config/lockfile and decide on git hooks

Quartermaster's `[DEPS]-config-scripts-engines-health-2026-07-20-followup.md` notes three items that need your decision:

1. `package.json`, `package-lock.json`, and `knip.json` are staged with config/lockfile changes (`midi-mcp` removed, root `vitest` declared, `knip` root workspace fixed) but not committed. Please review and commit as a discrete unit when ready.

2. `.githooks/` exists on disk and `core.hooksPath` is already set to `.githooks`, but the directory is untracked. Please either `git add .githooks` and document installation, or `git config --unset core.hooksPath` and remove the hooks if unintended.

3. `CONTRIBUTING.md` states "No pre-commit hooks are configured" while `.githooks/pre-commit` and `.githooks/pre-push` are active. Please update the doc or remove the hooks to match reality.
