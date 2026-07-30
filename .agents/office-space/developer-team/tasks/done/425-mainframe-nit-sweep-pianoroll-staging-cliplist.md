---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 425 — NIT sweep: PianoRoll / StagingPreview / ClipList readability

From: `[NIT]-pianoroll-staging-cliplist-sweep-2026-07-20d.md` (nitpicker).

Also from `[NIT]-akvj-cliptiming-unit-honesty` (pairs with **451**): `StagingPreview.js` local `elapsed` → `elapsedMs` (do not re-do `#getFrameIntervalMs` if already done).

Three nits. No behaviour change — a rename, a local rename, and a dead-code deletion.

- `mainframe/src/js/StagingPreview.js:350` — `#getFrameInterval` → `#getFrameIntervalMs` (returns
  milliseconds; matches the already-fixed `PreviewClip.js` counterpart).
- `mainframe/src/js/ClipList.js:157` — `rolePianoFilter` → `roleFilter` (sibling locals are
  `clipIdFilter` / `triggerTypeFilter`; the "Piano" infix breaks the pattern and a local does not
  collide with `this.#roleFilter`).
- `mainframe/src/js/PianoRoll.js:376` — delete the dead `this.#filterState = this.#filterState ??
  { ...FILTER_DEFAULTS }` line. `#filterState` is initialised at field declaration (L139) and never
  set to null, so the `??` branch is unreachable. The "preserve across re-renders" comment above
  can stay; preservation is actually done by not resetting `#filterState` in `#render()`.

Scope: `mainframe/` only. Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`.
