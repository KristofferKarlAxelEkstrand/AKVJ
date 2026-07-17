# Task: Add Hot Reloading to mainframe Node Backend

## Objective
Enable Node's native `--watch` mode for the mainframe API backend so it auto-restarts on server code changes.

## Requirements
- Update `"dev"` script in `mainframe/package.json` to use `node --watch server/index.js`
- Verify `concurrently` setup still works (Vite frontend + Node backend)
- Assumes Node 20+ per root `engines` field

## Files to modify
- `mainframe/package.json` — Update dev script

## Constraints
- mainframe-only change. Do not touch akvj.
