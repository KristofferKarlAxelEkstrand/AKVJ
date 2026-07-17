# Task 76: Fix Await-Messages Scripts Instant Re-Trigger on Existing Files

## Severity: High (Infrastructure — runaway token burn)

## Status: ✅ Fixed by Team Lead

## Problem
Both `await-messages.js` and `await-messages-random.js` treated any existing `.md`/`.json` file as a "waiting message" with no concept of "already seen." This caused instant re-trigger loops when files were left in directories (e.g., Overseer's outbox questions).

## Fix Applied
1. Added state tracking via `.await-state.json` (gitignored)
2. Each file is tracked by full path with a signature (`mtimeMs:size`)
3. Only files with changed signatures (new or modified) trigger wake-up
4. State is saved on exit and on SIGINT
5. Both scripts (`await-messages.js` and `await-messages-random.js`) updated
6. `.gitignore` updated to exclude state file

## Files Changed
- `.agents/workflows/developer-team/scripts/await-messages.js`
- `.agents/workflows/developer-team/scripts/await-messages-random.js`
- `.gitignore`

## Found By
QA Reviewer / Overseer
