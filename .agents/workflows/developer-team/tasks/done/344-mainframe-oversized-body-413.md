---
status: done
assignee: qa-reviewer
priority: high
---

# Task 344: Mainframe oversized body should return 413

## Source

Human review `mail/in/[REVIEW]-mainframe-2026-07-20.md` finding 5

## Description

`mainframe/server/httpUtils.js:11-27` rejects bodies past 32 MiB and destroys the socket. The router's catch-all (`mainframe/server/index.js:29`) then turns the already-destroyed response into a generic 500.

Fix: map the oversized-body rejection to `413 Payload Too Large` before the socket is destroyed, and skip the catch-all 500 path for that error.

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes (add regression test in `mainframe/test/server.test.js`)
- `npm run build -w mainframe` passes
- A >32 MiB upload returns HTTP 413 instead of 500
