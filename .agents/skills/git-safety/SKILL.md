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

## Critical Rules

1. **NEVER use `git reset --hard`**: This is destructive and can wipe out the user's uncommitted work permanently. If you need to revert changes, use `git checkout -- <file>` for specific files after confirming with the user, or `git stash` to safely set aside changes.
2. **NEVER use `git push --force` or `-f`**: Never force push. If a push is rejected, pull the latest changes, resolve conflicts manually, and push normally.
3. **NEVER modify the `HEAD` reference directly**: Do not detach HEAD or run commands that rewrite history unless explicitly requested by the user.
4. **ALWAYS prefer Stashing over Resetting**: If the working tree is dirty and you need a clean state to pull or merge, run `git stash`. You can always recover stashed changes.
5. **NEVER delete branches without explicit permission**: Do not run `git branch -D` unless the user explicitly asks you to clean up branches.
6. **Stop on Merge Conflicts**: If a `git pull` or `git merge` results in a conflict, DO NOT attempt to blindly abort the merge (`git merge --abort`) if it risks losing user changes. Present the conflict to the user and resolve the files carefully.

## Approved Commands
- `git status` (always check this before doing anything)
- `git diff`
- `git add <specific files>`
- `git commit -m "..."`
- `git push` (normal, non-forced)
- `git pull`
- `git stash`

If a command fails and you feel the urge to "reset and try again," STOP and ask the user for permission.
