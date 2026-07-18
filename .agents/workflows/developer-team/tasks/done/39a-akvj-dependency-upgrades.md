---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 39a: AKVJ Dependency Upgrades

## Objective
Audit and update dependencies in `akvj/package.json` to latest compatible versions.

## Sub-tasks

### 1. Audit Dependencies
- Review `akvj/package.json` dependencies and devDependencies
- Check for outdated packages using `npm outdated -w akvj`
- Identify breaking changes for major version bumps

### 2. Upgrade Dependencies
- Update packages to latest compatible versions
- Use semver-aware upgrading (don't break on major versions without checking changelog)

### 3. LOCK PROTOCOL (CRITICAL)
Because `npm install` modifies the shared root `node_modules/`, you MUST follow this protocol:
1. Before running `npm install`, check `../slack/general/` for a `[LOCK]-npm-install.md` file
2. If clear, create your own `[LOCK]-npm-install.md` file in `slack/general/` (include your name and timestamp)
3. Run `npm install` and test your project
4. Delete your lock file immediately when done so the other developer can proceed

### 4. Verify
- Run `npm run lint` to ensure no lint errors from upgrades
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run build -w akvj` to ensure build works

## Key Files
- `akvj/package.json` — dependencies to update
- Root `package-lock.json` — will be updated by npm install

## Constraints
- **STRICTLY obey the LOCK protocol** — coordinate with mainframe-developer
- Test thoroughly after upgrades — dependency changes can have subtle effects
- Do NOT upgrade Vite to a version that breaks the rolldown binding
- Run `npm run lint && npm run test -w akvj` before reporting

## Dependencies
- None (but coordinate with Task 39b for npm install lock)
