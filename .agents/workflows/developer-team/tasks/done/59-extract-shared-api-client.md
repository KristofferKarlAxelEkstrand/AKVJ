# Task 59: Extract Shared API Client Module

## Severity: Low (Tech debt)

## Location
- `mainframe/src/js/ClipList.js:1` — `const API = '/api';`
- `mainframe/src/js/ClipEditor.js:1` — `const API = '/api';`
- `mainframe/src/main.js:7` — `const API = '/api';`

## Problem
`API` base URL constant duplicated across 3 modules. `ClipEditor.js` uses raw `fetch()` without response checking, while `main.js` has a proper `api()` helper. Inconsistent error handling.

## Fix
Extract `API` constant and `api()` helper into a shared module (e.g., `mainframe/src/js/apiClient.js`) and import it in all modules that need API access.

## Key Files
- `mainframe/src/js/ClipList.js`
- `mainframe/src/js/ClipEditor.js`
- `mainframe/src/main.js`

## Dependencies
- None (discovered during Task 37b)
- Related to Task 52 (ClipEditor save response check)
