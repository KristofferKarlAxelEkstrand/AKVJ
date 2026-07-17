# [TECH-DEBT] Duplicated API constant and fetch logic across modules

## Location
- `mainframe/src/js/ClipList.js:1` — `const API = '/api';`
- `mainframe/src/js/ClipEditor.js:1` — `const API = '/api';`
- `mainframe/src/main.js:7` — `const API = '/api';`

## Description
The `API` base URL constant is duplicated across three modules. Additionally, `ClipEditor.js` uses raw `fetch()` calls without response checking, while `main.js` has a proper `api()` helper function that checks `response.ok` and parses error messages. `ClipList.js` also uses raw `fetch()` for sprite URLs (though those are `<img>` src, not API calls).

## Impact
Inconsistent error handling across modules. Changes to the API base URL or error handling pattern require updates in multiple files.

## Suggested Fix
Extract the `API` constant and `api()` helper into a shared module (e.g., `mainframe/src/js/apiClient.js`) and import it in all modules that need API access.
