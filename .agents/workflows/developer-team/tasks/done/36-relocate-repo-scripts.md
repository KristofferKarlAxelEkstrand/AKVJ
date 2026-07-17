# Task 36: Relocate Repository-Wide Scripts to Root

## Objective
Move generic repository-wide utility scripts out of `akvj/scripts/` into a root `/monorepo-scripts/` directory to maintain clean separation of concerns.

## Sub-tasks

### 1. Create Root `monorepo-scripts/` Directory
- Create `/monorepo-scripts/` at the repository root

### 2. Move Scripts
- Move `akvj/scripts/check-line-endings.js` → `monorepo-scripts/check-line-endings.js`
- Move `akvj/scripts/check-utf8.js` → `monorepo-scripts/check-utf8.js`

### 3. Delete Empty Directory
- Delete the now-empty `akvj/scripts/` directory

### 4. Update package.json Scripts
- Update `check:eol` → `node monorepo-scripts/check-line-endings.js`
- Update `check:utf8` → `node monorepo-scripts/check-utf8.js`
- Update `fix:eol` → `node monorepo-scripts/check-line-endings.js --fix`
- Update `fix:utf8` → `node monorepo-scripts/check-utf8.js --fix`

### 5. Verify
- Run `npm run check:eol` to ensure script works from new location
- Run `npm run check:utf8` to ensure script works from new location
- Run `npm run lint` to ensure no broken references
- Verify `akvj/scripts/` no longer exists

## Key Files
- `akvj/scripts/check-line-endings.js` — script to move
- `akvj/scripts/check-utf8.js` — script to move
- `package.json` — root package.json with script paths to update

## Constraints
- Do NOT modify the script contents — only move them and update paths
- Ensure `akvj/` package no longer contains a `scripts/` directory after move
- Run `npm run lint` before reporting

## Dependencies
- None
