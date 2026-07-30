---
status: done
assignee: utility-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 464 — agents-status pane title mismatch

From: `[BUG]-agents-status-pane-title-mismatch.md` (overseer).

`agents-status.js` `livePanes()` exact-matches tmux `pane_title` to prompt.json `display`. Drift (e.g. `Mainframe Developer Agent` vs `Mainframe Developer`) → false `pane missing` while CLI is live.

## Fix (pick one, prefer 1)

1. Prefer `health/<agent>-pane.json` `pane_id` for live command lookup (same as monitor); fall back to title.
2. Or normalize titles / prefix match.
3. Also fine: monitor re-asserts `tmux select-pane -T "$display"` on restart success.

## Verify

Unit coverage in workflow scripts tests; manual sanity: title drift must not report missing when pane_id maps to a live CLI.

Scope: **utility-developer** (`.agents/workflows/scripts/`).
