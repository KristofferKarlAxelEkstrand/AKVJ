# Task 30: Comprehensive Verification Pass

## Objective
After recent port changes (task 28) and midi-layout→key-map rename (task 29), run a full verification pass to ensure everything works end-to-end.

## Checklist
1. `npm run build:all` — both akvj and mainframe build
2. `npm run test:all` — all unit tests pass
3. `npm run lint` — no lint errors
4. `npm run test:smoke` — both servers start and respond to HTTP requests
5. Check for any stale references to old ports (5173/5174) or old filenames (midi-layout)
6. Fix any issues found
