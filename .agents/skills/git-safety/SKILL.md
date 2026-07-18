---
name: git-safety
description: >-
  Strict safety constraints for Git operations. Use this skill whenever
  you are performing Git commands (commit, push, branch, merge) or fixing
  Git-related errors. This ensures you never accidentally delete the user's
  work or perform destructive resets. Trigger phrases include "git", "git reset",
  "push", "fix git conflict", "revert".
---

# Git Safety Protocol

You must strictly adhere to the following safety constraints whenever performing any Git operations.

## Commit Ownership (read first)

**The human owns commits. Default to letting the human commit — do not `git add`/`git commit` on their behalf unless they explicitly ask you to in the current request.**

- Your normal job is to **edit files and leave them in the working tree** for the human to review and commit. Making changes ≠ committing them.
- **Never `git add`/`git commit`** as a reflex after finishing a task, and never `git push`, unless the human explicitly said "commit"/"push" this session.
- **Especially never** stage/commit binary assets (e.g. PNG sprite sheets), or history-altering / tracking-changing operations (retiring tracked directories, large renames/migrations, `.gitignore` policy changes) on your own. These always wait for the human.
- If a change *needs* to be committed to be durable (e.g. a migration a fresh clone depends on), **escalate**: describe exactly what would be staged/committed and ask the human to do it (or to explicitly authorize you). Do not silently delegate the commit to another agent.
- Even when the human authorizes a commit, keep it **surgical**: stage only the specific files in scope (`git add <paths>`), never `git add -A`/`.` blindly.

## Critical Rules

1. **NEVER use `git reset --hard`**: This is destructive and can wipe out the user's uncommitted work permanently. If you need to revert changes, use `git checkout -- <file>` for specific files after confirming with the user, or `git stash` to safely set aside changes.
2. **NEVER use `git push --force` or `-f`**: Never force push. If a push is rejected, pull the latest changes, resolve conflicts manually, and push normally.
3. **NEVER modify the `HEAD` reference directly**: Do not detach HEAD or run commands that rewrite history unless explicitly requested by the user.
4. **ALWAYS prefer Stashing over Resetting**: If the working tree is dirty and you need a clean state to pull or merge, run `git stash`. You can always recover stashed changes.
5. **NEVER delete branches without explicit permission**: Do not run `git branch -D` unless the user explicitly asks you to clean up branches.
6. **Stop on Merge Conflicts**: If a `git pull` or `git merge` results in a conflict, DO NOT attempt to blindly abort the merge (`git merge --abort`) if it risks losing user changes. Present the conflict to the user and resolve the files carefully.

## Approved Commands

Freely usable (read-only / non-destructive inspection):

- `git status` (always check this before doing anything)
- `git diff`
- `git log`, `git ls-files`, `git show`

Only when the human explicitly asks you to commit/push this session (see **Commit Ownership**):

- `git add <specific files>` (never `-A` / `.` blindly)
- `git commit -m "..."`
- `git push` (normal, non-forced)

Other:

- `git pull`
- `git stash`

If a command fails and you feel the urge to "reset and try again," STOP and ask the user for permission.
