# Routine Maintenance Fallbacks

Use these when work queues are quiet. Two tracks:

1. **Workflow hygiene (Overseer)** — keep `.agents/workflows/developer-team/` lean. Prefer this when the team looks idle.
2. **Code maintenance (Team Lead / developers)** — when `inbox/` is empty and your own task queue is clear, pick ONE code task below instead of exiting with a no-op.

Canonical retention table: `collaboration-protocol.md` → *Workflow retention / idle cleanup*. Playbook for promote-then-purge is here.

---

## Workflow hygiene (Overseer owns this)

When idle (no urgent `inbox/` items, developer slack queues empty or only stale noise, dashboard quiet), **do not invent busywork tickets**. Clean the workflow tree instead:

### Promote then purge

1. **Scan** `inbox/read/`, `outbox/`, `slack/*/`, and any dead role folders.
2. **Promote** — if an old note still holds lasting product or process truth that is missing from `spec/` (`goal.md`, `code-standards.md`, `aesthetics.md`, `clip-schema.md`, `collaboration-protocol.md`, this file), fold a short bullet into the right spec file.
3. **Purge** — delete ephemeral leftovers that are already acted on or fully captured in spec/tasks/dashboard. Do **not** create a second archive pile under workflows.
4. **Log** what you promoted vs deleted in `memory/overseer/sweep-log.md`.
5. **Leave alone** — do not edit `tasks/*` or `slack/general/team-dashboard.md` (Team Lead). If the dashboard Done list is huge, drop a short note in `slack/team-lead/` asking them to truncate it.

### Practical targets each idle pass

- Trim `inbox/read/` toward roughly the **newest ~20** files (promote first, then delete older).
- Clear answered / obsolete `outbox/` status dumps.
- Empty stuck personal `slack/` files that should have been deleted after processing; remove empty dead role folders (e.g. retired agents).
- Ensure `slack/general/` only has `team-dashboard.md`, `team-guidelines.md`, and active `[LOCK]` files.
- Summarize or trim huge `memory/*/…-log.md` files when they get unwieldy; do not re-read archive memory every sweep.

Batch size: a modest batch per wake is fine — steady cleanup beats one giant wipe.

---

## Code maintenance (Team Lead / developers)

If the `inbox/` is empty and the `tasks/` queue is completely cleared, do not just exit. Instead, pick ONE of the following:

### 1. Test Audit & Coverage
- Run `npm run test:all`. If anything fails, fix it.
- If everything passes, pick a critical file in `akvj/src/` or `mainframe/server/` that lacks comprehensive tests and write a new test suite for it in the `test/` directory.

### 2. Dependency Audit
- Check the `package.json` files across the workspaces.
- Look for outdated minor or patch versions of dependencies.
- Update them, run `npm install`, and ensure the build and tests still pass.

### 3. Linting & Formatting Sweep
- Run `npm run lint` and `npm run format:check`.
- Auto-fix any styling issues and manually resolve any deeper architectural linting warnings.

### 4. Cognitive Refactoring
- Pick a module that has grown complex and apply cognitive refactoring.
- Extract long methods into smaller, focused helpers.
- Rename generic variables to be highly descriptive following our `code-standards.md`.
- Ensure all public methods have standard JSDoc comments.
