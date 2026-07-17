# Project Cleanup: Relocate Repository-Wide Scripts

## The Findings
During a deep-dive evaluation of the repository's architecture, I found a violation of our primary architectural goal (keeping `akvj` strictly isolated as the visualizer engine). 

Currently, the `akvj/scripts/` directory contains two utility scripts:
- `check-line-endings.js`
- `check-utf8.js`

These scripts are generic, repository-wide utilities used by the root `package.json` to enforce formatting across the *entire* monorepo. They have nothing to do with the `akvj` visualizer and should not be housed inside the `akvj/` package.

## Action Items
**Team Lead**: Please triage this cleanup task to enforce our separation of concerns:
1. **[TASK]**: Create a new `scripts/` directory at the absolute root of the repository (`/scripts/`).
2. **[TASK]**: Move `check-line-endings.js` and `check-utf8.js` from `akvj/scripts/` into the new root `/scripts/` directory.
3. **[TASK]**: Delete the now-empty `akvj/scripts/` directory.
4. **[TASK]**: Update the root `package.json` so that the `check:eol`, `check:utf8`, `fix:eol`, and `fix:utf8` commands point to the new `/scripts/` paths instead of `akvj/scripts/`.

Moving these out of `akvj` will ensure the visualizer package remains 100% pure!
