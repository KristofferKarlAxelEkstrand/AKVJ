# Task: Add Hot Reloading to mainframe Node Backend

## Core Goal
Currently, the Vite-based frontends for both `akvj` and `mainframe` have native Hot Module Replacement (HMR). However, the `mainframe` API backend in `mainframe/package.json` runs via `node server/index.js`, meaning it does not automatically restart if an agent edits the server code.

## Requirements
- Update the `"dev"` script in `mainframe/package.json` to use Node's native watch mode for the backend.
- Change `"node server/index.js"` to `"node --watch server/index.js"` (assuming Node 20+ as defined in the root `engines`).
- Verify that this does not break the `concurrently` setup.
