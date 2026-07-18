---
status: done
assignee: mainframe-developer
priority: low
---

# Task 161: Version Skew, Extraneous Lockfile Entry, and Dead Config References

## Source
`.agents/workflows/developer-team/inbox/read/[DEPS]-version-skew-lockfile-config-cleanup.md`
(Quartermaster, routine maintenance sweep — no high-severity advisories).

## Scope
Six independent, low-risk cleanup items. This is monorepo-wide (root config + both
workspaces), not akvj- or mainframe-specific — either developer can take it, but **must**
follow the `[LOCK]` protocol (`../spec/collaboration-protocol.md` / your own prompt's
"Shared Environment & Concurrency" section) before touching root `package.json`, and the
`[NPM-REQUEST]` protocol for the lockfile regeneration (only the Team Lead runs `npm install`).

### 1. Vite version skew
- `akvj/package.json` → `"vite": "^8.1.4"`, `mainframe/package.json` → `"vite": "^8.1.5"`.
- Edit `akvj/package.json` vite pin to `^8.1.5` to match.

### 2. Extraneous `midi-mcp` in `package-lock.json`
- `midi-mcp` workspace was removed from root `package.json` `workspaces` array but the lockfile
  still has a stale `"midi-mcp": { ..., "extraneous": true }` entry (line ~53).
- No edit needed here directly — resolved by the `npm install` in the sequencing note below.

### 3. `CONTRIBUTING.md` Node version mismatch
- Says "Node.js 18+" (line 13); root `package.json` `engines` says `>=20`, CI uses Node 20.
- Update `CONTRIBUTING.md` line 13 to "Node.js 20+".

### 4. `knip.json` dead references
- Remove the full `"midi-mcp"` workspace entry (lines ~14-18) — `midi-mcp/` no longer exists.
- Remove `"scripts/**/*.js"` from the `akvj` workspace `project` array — `akvj/scripts/`
  doesn't exist.

### 5. `eslint.config.js` dead references
- Remove `'midi-mcp/**/*.js'` (line ~54, Node config files glob) and `'midi-mcp/data/**'` /
  `'midi-mcp/.cache/**'` (line ~63, ignores) — all three paths no longer exist.

### 6. Duplicate npm scripts in root `package.json`
- Both `"sort-package-json"` (line ~57) and `"format:sort-package-json"` (line ~50) run the
  same `node monorepo-scripts/sort-package-json.js`. Remove the bare `"sort-package-json"`
  alias, keep the namespaced one.

## Sequencing (per Quartermaster's notes — please follow this order)
1. Claim `[LOCK]-root-package-json.md` in `../slack/general/` before touching root
   `package.json` (item 6) or `akvj/package.json` (item 1).
2. Make edits for items 1, 3, 4, 5, 6 (all plain file edits, no lockfile impact).
3. Send `[NPM-REQUEST]` to the Team Lead to run `npm install` once — this regenerates the
   lockfile, picking up both the vite pin change (item 1) and clearing the extraneous
   `midi-mcp` entry (item 2) in one pass. Do not run `npm install` yourself.
4. Delete your `[LOCK]` file once done.

## Suggested Verification
- `npm run lint`
- `npm run test`
- `npm run build`
- `npx knip` (or however knip is invoked in this repo) — confirm it no longer errors on
  nonexistent `midi-mcp`/`akvj/scripts` paths.

## Files
- `akvj/package.json`
- `CONTRIBUTING.md`
- `knip.json`
- `eslint.config.js`
- root `package.json`
- `package-lock.json` (regenerated via `npm install`, not hand-edited)
