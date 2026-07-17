# Task: Rename Workspaces to `akvj` and `mainframe`

## Objective
Rename `vj-server` → `akvj` and `admin` → `mainframe` across the entire monorepo.

## Status: COMPLETED

User confirmed via inbox: `unblock_task_19.md` — "i dont think it is do it!"

The codebase (folders, package.json, configs, source code) was already renamed in earlier iterations. This iteration completed the remaining documentation references in `.agents/`:
- `.agents/prompts/specs/admin-and-akwf.prompt.md` — all `vj-server`→`akvj`, `admin`→`mainframe`, `Admin`→`Mainframe` references updated
- `.agents/prompts/README.md` — trigger text and description updated
- `.agents/prompts/_memory.md` — `admin/server/`→`mainframe/server/` path references updated
- `.agents/prompts/code-of-conduct.prompt.md` — `vj-server`→`akvj` updated
- `.agents/workflows/README.md` — trigger text and description updated

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
