# Task: Simplify and Clarify NPM Scripts

## Objective
Rename startup scripts to explicitly state which tool is being launched (`akvj` for akvj, `mainframe` for mainframe tooling).

## Requirements
1. Root `package.json`: add `"akvj": "npm run dev -w akvj"` and `"mainframe": "npm run dev -w mainframe"`
2. Remove old `"dev"` and `"dev:mainframe"` commands (or alias them for compatibility)
3. Keep `"dev"` inside workspace package.json files (Vite convention)
4. Update `AGENTS.md` "Common Commands" table
5. Update root/workspace README.md files referencing old commands

## Dependencies
None
