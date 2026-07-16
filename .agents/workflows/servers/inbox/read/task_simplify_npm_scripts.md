# Task: Simplify and Clarify NPM Scripts

## Background
Currently, the root `package.json` relies on the generic `npm run dev` and `npm run dev:mainframe` to start the core applications. As this tool is mostly run directly from the terminal during live performances and set preparation, having clearer, purpose-driven script names will improve the user experience.

## Goal
Rename the startup scripts to explicitly state *which* tool is being launched (`akvj` for the live VJ engine, and `mainframe` for the preparation tool). Since these are the primary ways to run the software, the `:dev` suffix should be optional or removed for the main launch commands.

## Required Changes

### 1. Root `package.json`
Update the `scripts` block in the repository root to replace the generic `dev` commands:

- **Add**: `"akvj": "npm run dev -w akvj"` (Starts the live VJ engine)
- **Add**: `"mainframe": "npm run dev -w mainframe"` (Starts the mainframe UI, API, and clip watcher)
- **Optional**: Add `"akvj:dev"` and `"mainframe:dev"` as aliases to the above commands if we wish to retain a standard Node/Vite developer convention, though `"akvj"` and `"mainframe"` will be the primary commands.
- **Remove**: The old `"dev"` and `"dev:mainframe"` commands to avoid clutter.

### 2. Workspace `package.json` files
Review `akvj/package.json` and `mainframe/package.json`. It is generally fine to keep `"dev"` inside the workspaces themselves (as Vite defaults to this convention), but ensure the root scripts map to them correctly.

### 3. Documentation Updates
Search and replace references to the old commands across the documentation so new users aren't confused.
- **`AGENTS.md`**: Update the "Common Commands" table and the "Developer workflow" section. Change `npm run dev` to `npm run akvj` and `npm run dev:mainframe` to `npm run mainframe`.
- **`README.md`** (both root and workspace readmes, if applicable): Ensure the getting started instructions point to `npm run akvj` and `npm run mainframe`.
