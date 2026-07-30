---
status: done
assignee: none
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 197: ClipInstance Branch Coverage + fsUtils EPERM Fallback Tests

## Source
`.agents/workflows/developer-team/inbox/read/[TEST]-mainframe-clipinstance-fsutils-coverage.md`
(Test Marshal)

## Scope
Add missing unit coverage only — no product behavior changes unless a test exposes a real bug.

## Checklist

### 1. `mainframe/src/js/ClipInstance.js` (prefer extend `mainframe/test/ClipList.test.js`)

Happy paths already covered. Add cases for:

- `pipelineReady: false` → `.clip-map` disabled; meta text contains `incomplete`
- `dragstart` with target on `.clip-edit` (or child button) → `preventDefault()`, no clip-id in dataTransfer
- `meta.name` ≠ `clipId` → `.clip-id-label` text is ` (clipId)`
- `hasSprite: true` → `img.src` matches `/api/clips/<encoded-id>/sprite`
- `disconnectedCallback` → removes `dragstart` listener and clears children

Files: `mainframe/src/js/ClipInstance.js`, `mainframe/test/ClipList.test.js` (or new `ClipInstance.test.js`)

### 2. `mainframe/scripts/clips/lib/fsUtils.js` — `copyFileWithFallback`

Add `mainframe/test/fsUtils.test.js` with mocked `fs/promises`:

| Case | Expected |
| --- | --- |
| `fs.copyFile` succeeds | Dest matches source |
| `fs.copyFile` rejects `EPERM` | Falls back to `readFile` + `writeFile`; dest matches |
| `fs.copyFile` rejects `ENOSYS` | Same fallback |
| Other errors (e.g. `ENOENT`) | Rethrows; dest not written |

Assert dest file bytes, not only "did not throw".

## Out of scope
- Stale `clipsaved` JSDoc / `main.js` listener with no emitter — leave for Overseer; do not expand this task into a product fix unless QA later asks.

## Verification
`npm run lint && npm run test -w mainframe && npm run build`
