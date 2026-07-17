---
description: Full code review of recent changes
---

# Code Review

Perform a comprehensive code review of the AKVJ codebase focusing on recent changes.

## Steps

1. Run `git diff HEAD~1 --stat` to see what files changed recently
2. Run `git diff HEAD~1` to see the actual changes (use `git diff --cached` if changes are staged but not committed)
3. Run `npm run lint` to check code quality
4. Run `npm run test` to verify tests pass
5. Review the diff for:
   - Adherence to AGENTS.md conventions (private fields, naming, vanilla JS)
   - Performance concerns (60fps rendering, MIDI latency)
   - Proper error handling and cleanup
   - Memory management (clip resource cleanup)
   - Test coverage for new code
6. Summarize findings as: **Pass**, **Warnings**, or **Issues** with specific file/line references
