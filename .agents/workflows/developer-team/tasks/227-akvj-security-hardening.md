---
status: backlog
assignee: none
priority: medium
---

# Task 227: Harden Security in Clip Loading and MIDI Input

## Source
Finding report: `.agents/workflows/developer-team/inbox/read/security-review-findings.md`

## Affected Files
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/midi-input/Midi.js`

## Description
Security posture is adequate but several hardening opportunities exist around asset validation, MIDI clock flooding, and resource limits.

## Discrete Actions
1. Validate sprite image dimensions before decoding in `ClipLoader.js` and reject assets exceeding safe bounds.
2. Harden `ClipLoader.js` filename sanitization against additional malicious patterns.
3. Add rate limiting for MIDI clock pulses in `AppState.js` to mitigate CPU exhaustion.
4. Add message-length and data-integrity validation in `Midi.js` before parsing.
5. Set limits on concurrent MIDI devices and total active clips to prevent resource exhaustion.
6. Tune clock timeout for better DoS protection.

## Verification
- `npm run lint`
- `npm run test -w akvj`
- `npm run build -w akvj`

## Related Epic
`.agents/workflows/developer-team/epics/project-review.md`
