---
status: done
assignee: utility-developer
priority: medium
---

# 403 — Docs & config sweep for the projects layout

Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (task S8).
P0-2..P0-5 are already done; this is the docs/config half.

## Scope

Root docs and config only. Do **not** touch `akvj/src/js/` or `mainframe/src/` — 400 and 401 are live in those trees.

## Changes

1. Replace every reference to `akvj/src/public/clips/` or the flat `clips/` pool with
   `akvj/src/public/projects/{id}/clips/` in `README.md`, `CONTRIBUTING.md`, `AGENTS.md`,
   `docs/how-to-program-midi.md`, `projects/default/README.md`.
2. `AGENTS.md`: fix the stale paths in **Security & Boundaries** and **Troubleshooting**.
3. `docs/how-to-program-midi.md`: channel 14 is **project selection**, not reserved. Update the table.
4. Remove the dead `npm run migrate:clips` reference from `README.md`.
5. Purge midi-mcp: `AGENTS.md`, `knip.json`, `eslint.config.js`.
6. Remove Husky / lint-staged claims — there is no `.husky/`; the repo uses `.githooks/` + `.vscode` settings.
   Describe what actually exists.
7. Root `package.json`: rename `akvj` → `akvj-monorepo`; align Vite versions across workspaces;
   drop duplicate `clips:*` script aliases (root stays canonical).

## Out of scope

- S8 item 8 (deleting the generated `akvj/src/public/projects/{id}/key-map.json`) — that path is generated
  output and now gitignored. Skip it.
- Any lockfile change. If `npm install` is needed after the Vite version alignment, send an
  `npm-request` to the Team Lead; do not run it yourself.

## Verify

- `npm run lint && npm run test && npm run build`
- `npx prettier --check .`
- `grep -rn "public/clips\|migrate:clips\|midi-mcp\|husky" --include='*.md' --include='*.json' --include='*.js' .`
  returns nothing outside `.agents/` history and `node_modules/`.
