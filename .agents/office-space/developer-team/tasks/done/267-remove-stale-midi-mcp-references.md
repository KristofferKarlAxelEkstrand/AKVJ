---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 267: Remove stale `midi-mcp` references after workspace removal

## Description

The `midi-mcp` workspace has been removed, but leftover references remain in `.gitignore`, `.prettierignore`, and `AGENTS.md`. Remove them so the repo config/docs do not reference a non-existent workspace.

## Affected files

- `.gitignore`
  - Remove `/midi-mcp/.cache/` (line 60) and update the preceding comment so it no longer mentions `midi-mcp/data/`.
- `.prettierignore`
  - Remove `/midi-mcp/data` (line 25) and `/midi-mcp/.cache` (line 26), and update the preceding comment if it becomes misleading.
- `AGENTS.md`
  - Remove `, `midi-mcp/` (MIDI spec MCP server for agents)`` from the `npm workspaces` list (line 64).
  - Remove `npm run midi:extract` from the Common Commands block (line 101).
  - Remove the `## MIDI Spec MCP Server (\`midi-mcp/\`)` section (lines 299–306).

## Verification

1. Confirm no `midi-mcp` references remain outside of `package-lock.json` and workflow history.
2. Run `npm run lint && npm run test` and confirm both pass.

## Notes

Do not modify `package-lock.json` by hand; that was handled separately via `npm install`.
