---
status: done
assignee: akvj-developer
priority: medium
---

# Task 171: mainframe Server/Pipeline Test Coverage — Untested Endpoints & Full Build Path (Test Marshal Sweep 5)

## Source
`.agents/workflows/developer-team/inbox/[TEST]-mainframe-server-pipeline-coverage.md`
(Test Marshal — untested server endpoints and thin pipeline coverage).

## Note
Item 6 (orphan health.test.js) was already handled in Task 170 — file deleted, cases folded into `paths.test.js`. Skip that item.

## Scope

### 1. POST /api/pipeline — untested endpoint (MEDIUM)
**File:** `mainframe/server/handlers/misc.js` (lines 32–35)
**Existing tests:** `server.test.js` — no pipeline endpoint test

Cases to add:
- POST /api/pipeline returns 200 with `{ ok: true, output, code: 0 }` on success
- POST /api/pipeline returns 500 with `{ ok: false, ... }` when pipeline fails
- Note: spawns child process — consider mocking `spawn` or marking as slow test

### 2. POST /api/clips/:clipId/recompile — untested endpoint (MEDIUM)
**File:** `mainframe/server/handlers/clips.js` (lines 219–251)

Cases to add:
- Recompiles existing clip from raw assets → 200 with updated sprite metadata
- Returns 404 for non-existent clip
- Returns 400 for invalid clipId
- Returns 500 when raw assets missing

### 3. Pipeline.js — full build path untested (MEDIUM)
**File:** `mainframe/scripts/clips/Pipeline.js`
**Existing tests:** `Pipeline.test.js` — only `validateOnly: true` path (2 tests)

Cases to add:
- Full build: validate → optimize → generate → copy produces `clips.json` and copies sprites
- `noOptimize: true` skips optimization, copies PNGs as-is
- Per-project build: `project: 'default'` builds only specified project
- Multi-project build: iterates all projects
- `clean()` removes cache and output directories
- Build fails when `meta.json` references non-existent sprite PNG
- Build succeeds when `sharp` unavailable (falls back to copy)

### 4. httpUtils.readBody — body size limit untested (LOW)
**File:** `mainframe/server/httpUtils.js` (lines 11–27)

Cases to add:
- Body under limit: resolves with Buffer
- Body exceeding `maxBytes`: rejects with error, destroys request
- Empty body: resolves with empty Buffer
- `sendJson`: correct Content-Type, Content-Length headers
- `applyCors`: sets ACAO for allowed origins, omits for disallowed
- `applyCors`: sets ACAM and ACAH always

### 5. CORS/OPTIONS preflight — untested (LOW)
**File:** `mainframe/server/index.js` (lines 19–22), `mainframe/server/httpUtils.js` (lines 49–57)

Cases to add:
- OPTIONS request returns 204 with CORS headers
- Allowed origin gets ACAO header
- Disallowed origin does not get ACAO header
- `Vary: Origin` header set when origin allowed

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/test/server.test.js` (existing — add endpoint tests)
- `mainframe/test/Pipeline.test.js` (existing — add full build tests)
- `mainframe/test/httpUtils.test.js` (new — unit tests for readBody/sendJson/applyCors)
- `mainframe/server/handlers/misc.js` (reference)
- `mainframe/server/handlers/clips.js` (reference)
- `mainframe/server/httpUtils.js` (reference)
- `mainframe/scripts/clips/Pipeline.js` (reference)
