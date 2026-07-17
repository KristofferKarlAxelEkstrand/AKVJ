# Task 25: Fix Server Startup Hang

## Objective
Investigate and fix the issue where `akvj` and `mainframe` servers hang on startup.

## Requirements
1. Investigate startup sequence for both `akvj` and `mainframe`
2. Check if recent changes to `package.json` scripts, `midi-layout.json` migration, or hot-reload backend caused deadlock/endless loop
3. Fix the root cause so both servers boot correctly
4. Verify both servers start and respond to HTTP requests

## Priority
CRITICAL — servers not starting blocks all development
