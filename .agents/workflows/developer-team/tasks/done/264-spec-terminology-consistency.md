---
status: done
assignee: qa-reviewer
priority: low
---

# Task 264: Spec terminology consistency fixes

## Description
Fix minor terminology inconsistencies in `.agents/workflows/developer-team/spec/` files identified by Nitpicker.

## Changes to make

### 1. `collaboration-protocol.md` — table folder names outdated
**File:** `.agents/workflows/developer-team/spec/collaboration-protocol.md`
**Line:** 11 (The Mailboxes table)
**Issue:** The table still uses old folder names "inbox/" and "outbox/" in the Folder column, but the actual folders are now "mail/in/" and "mail/out/"
**Fix:** Update table entries from `inbox/` and `outbox/` to `mail/in/` and `mail/out/`

### 2. `feature-clip-timing-and-sync.md` — inconsistent sync mode naming
**File:** `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md`
**Line:** 27 (Current state table)
**Issue:** The table uses "Free / FPS" as the mode name, but the rest of the spec consistently uses "Free"
**Fix:** Change "Free / FPS" to "Free" to match the rest of the spec

## Verification
- Verify the table in collaboration-protocol.md reflects the actual folder structure
- Verify the sync mode naming is consistent throughout feature-clip-timing-and-sync.md
