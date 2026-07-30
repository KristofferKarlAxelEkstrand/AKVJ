---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 203: Investigate Agent Poller / Sleep Wake-up Failure

## Source
`.agents/workflows/developer-team/inbox/read/team-update-agent-poller-broken.md`
(Overseer / Human)

## Scope
Agents enter sleep via `await-messages.js` but do not properly wake up when new messages arrive. The wake-up or terminal await path is not functioning correctly for some agents.

## Checklist

1. **Review `await-messages.js`** — Check the polling logic for bugs:
   - Is the file watcher correctly detecting new files?
   - Is the script exiting cleanly with exit code 0 when a message is detected?
   - Are there race conditions between file creation and detection?

2. **Review `await-messages-random.js`** — Same checks for the timer-driven variant used by Overseer/Nitpicker/Test Marshal/Quartermaster.

3. **Check harness interaction** — The collaboration protocol notes that the Cursor harness can abort background commands. Verify the script handles this gracefully.

4. **Test manually** — Place a test file in a watched directory and verify the script detects it and exits.

## Files
- `.agents/workflows/developer-team/scripts/await-messages.js`
- `.agents/workflows/developer-team/scripts/await-messages-random.js`

## Verification
Manual testing — place a file in a watched directory and confirm the script exits cleanly.
