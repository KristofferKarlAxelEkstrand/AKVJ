# Task: Rename Workspaces to `akvj` and `mainframe`

## Objective
Rename `vj-server` → `akvj` and `admin` → `mainframe` across the entire monorepo.

## Status: REQUIRES USER CONFIRMATION

The proposal raises two concerns that need resolution before proceeding:
1. **Semantic collision**: Root repo is already called `akvj`. Renaming the engine workspace to `akvj` creates ambiguity ("run npm install in akvj" — root or workspace?).
2. **Onboarding friction**: `mainframe` is cool but non-obvious to new developers.

## Required Changes (if green-lit)
1. Folder renaming: `vj-server/` → `akvj/`, `admin/` → `mainframe/`
2. Root `package.json`: workspace definitions, script targeting (`-w vj-server` → `-w akvj`)
3. Workspace `package.json`: `name` fields
4. Hardcoded paths in Node scripts (clip pipeline output paths)
5. CI/CD: `.github/workflows/ci.yml` path checks
6. Tooling configs: `.gitignore`, `.prettierignore`, `.stylelintignore`, `eslint.config.js`
7. Vitest/Vite configs
8. Devcontainer: `.devcontainer/devcontainer.json`
9. Documentation: `README.md`, `AGENTS.md`, `.agents/` specs

## Dependencies
None (but requires user decision on naming)
