---
type: test
from: test-marshal
to: team-lead
created: 2026-07-20T20:30:00Z
---

# Pipeline `--fix` integration untested

Swept `mainframe/scripts/clips/` + `mainframe/shared/` after tasks 410 (shared extraction) and 412 (validation report-only + `--fix`) landed structural changes. New modules (`fix.js`, `slugify.js`, `writeJsonAtomic.js`, `spritesheetCore.js`, `ClipFramesPanel.js`) all have substantive direct tests — those are clean. One real gap:

## Gap: `--fix` → validate → build chain never exercised through Pipeline

`mainframe/scripts/clips/Pipeline.js`:
- `#runSingleSource` line 124: `if (options.fix) { await this.#fix(sourceDir); }` — never called with `fix: true` in any test.
- `#fix` method (lines 163-178) — the Step 0 migration logging/reporting — never exercised.

`fixClips` itself is well-tested in `mainframe/test/fix.test.js` (5 tests, real filesystem, byte-for-byte verification). But the Pipeline integration — that `--fix` runs **before** validate, that a migrated clip then **passes** validation, and that the build proceeds — has zero coverage. Neither `Pipeline.test.js` nor `Pipeline.full.test.js` passes `fix: true`.

This is the actual user workflow for `node scripts/clips --fix`: a clip with deprecated `loop: true` (or a stale `png` filename) gets migrated, then validated, then built. If the ordering or the handoff between `fixClips` and `validate` breaks, no test catches it.

### Cases to add (tier: unit, real filesystem like existing Pipeline.full.test.js)

- [ ] `run({ fix: true, sourceDir })` migrates a `loop: true` clip and the build succeeds (clip now has `playback: "loop"`, passes validate, produces `clips.json`)
- [ ] `run({ fix: true, sourceDir })` with a stale `png` filename pointing at the only on-disk sprite — migration rewrites `meta.png`, build succeeds
- [ ] `run({ fix: true, sourceDir })` on clean clips is a no-op (no file rewrite, build still succeeds) — guards against `--fix` silently rewriting clean sources
- [ ] `run({ fix: true, validateOnly: true, sourceDir })` migrates then validates-only (does not build) — confirms `--fix` runs before the `validateOnly` early return

## Lower priority (mention, not filing)

- `mainframe/scripts/clips/index.js` `parseArgs()` / `printHelp()` / `cleanAll()` / `isCli` dispatch are not exported and have no unit test. The `--fix`, `--clean`, `--help`, `--no-optimize`, `--project=` flags are parsed but never verified. CLI arg parsing is typically smoke-tier; if `parseArgs` were exported it would be a cheap unit test, but this is not urgent.
- `mainframe/scripts/clips/lib/validate/image.js` `loadSharp()` returns `[]` silently when sharp import fails (line 31-33) — untested defensive path, low priority (sharp is a real dependency).

## Verified clean

- `mainframe/test/fix.test.js` (107 lines, 6 tests) — `fixClip`/`fixClips` all branches: byte-for-byte no-op on clean, `loop`→`playback`, stale `png`, ambiguous PNG refusal, validate-is-report-only
- `mainframe/test/spritesheetCore.test.js` (494 lines) — all exports including `resolveCompileOptions`, real sharp rendering, every scale mode + placement + crop path. Resolves the previously-open `spritesheet-core.js pure helpers` gap.
- `mainframe/test/writeJsonAtomic.test.js` (65 lines, 4 tests) — write, tab format, concurrency, atomic-failure-preserves-original
- `mainframe/test/slugify.test.js` (29 lines, 5 tests) — diacritics, whitespace, separators, empty input
- `mainframe/test/mappingService.test.js` — imports from new `shared/` location, 9 tests
