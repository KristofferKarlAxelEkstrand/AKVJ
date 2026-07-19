# [NIT] Spec Terminology Consistency — 2026-07-19

Area: `.agents/workflows/developer-team/spec/`

## Findings

### 1. `collaboration-protocol.md` — table folder names outdated

**File:** `.agents/workflows/developer-team/spec/collaboration-protocol.md`
**Line:** 11 (The Mailboxes table)
**Issue:** The table still uses old folder names "inbox/" and "outbox/" in the Folder column, but the actual folders are now "mail/in/" and "mail/out/" (per the 2026-07-19 changelog entry documenting this rename).
**Current:** `inbox/` and `outbox/`
**Proposed:** `mail/in/` and `mail/out/`
**Rationale:** The changelog correctly documents the rename, but the table itself wasn't updated. A newcomer reading the table would be confused about the actual folder structure.

### 2. `feature-clip-timing-and-sync.md` — inconsistent sync mode naming

**File:** `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md`
**Line:** 27 (Current state table)
**Issue:** The table uses "Free / FPS" as the mode name, but the rest of the spec consistently uses "Free" (e.g., line 82: "**Free**", line 83: "**Beat / clock synced**").
**Current:** "Free / FPS"
**Proposed:** "Free" (to match the rest of the spec)
**Rationale:** Minor terminology drift. The spec is clear enough as-is, but consistency helps readability. The "/ FPS" suffix is implied by the description column anyway.

---

Both are minor; the first is more actionable since it's a factual mismatch with the actual folder structure. The second is a style nit in a draft feature spec that will likely be rewritten during implementation anyway.
