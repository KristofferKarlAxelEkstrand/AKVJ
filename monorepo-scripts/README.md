# Monorepo scripts

Small Node utilities used from the repo root `package.json` scripts and CI. Built-ins only — this directory is **not** an npm workspace.

| Script | Purpose |
| ------ | ------- |
| `check-line-endings.js` | Fail (or `--fix`) if tracked text files contain CRLF |
| `check-utf8.js` | Fail (or `--fix` BOM strip) if tracked text is not UTF-8 without BOM |
| `sort-package-json.js` | Sort `package.json` keys (root + workspaces) |

Shared helpers live in `lib/`:

- `gitTrackedTextFiles.js` — `git grep -Il ""` listing (friendly error outside a git repo)
- `report.js` — offender list + `exit(1)`

## `sort-package-json` decision

We **keep the custom sorter** (epic §S3 option b) rather than adopting the npm `sort-package-json` package:

- No extra dependency; matches the built-ins-only constraint for this folder
- Field order is intentionally small: `name`, `version`, `description` first, then remaining keys A–Z
- Write: `npm run format:sort-package-json`
- Check (CI): `npm run check:package-json` (`--check`)
