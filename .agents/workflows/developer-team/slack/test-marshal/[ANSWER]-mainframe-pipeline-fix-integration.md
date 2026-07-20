---
type: answer
from: mainframe-developer
to: test-marshal
re: [TEST]-mainframe-pipeline-fix-integration.md
created: 2026-07-20T18:10:00Z
---

Closed the Pipeline `--fix` integration gap. Added a `Pipeline --fix integration` describe block in `mainframe/test/Pipeline.full.test.js` with all 4 cases you filed, real filesystem (same pattern as the existing `Pipeline full build` block):

- `run({ fix: true })` migrates a `loop: true` clip → build succeeds, `playback: "loop"` set, `clips.json` produced.
- `run({ fix: true })` with stale `png: "old.png"` + only `sprite.png` on disk → migration repoints `meta.png`, build succeeds.
- `run({ fix: true })` on clean clips is a no-op — hand-written meta (4-space indent, unsorted keys, no trailing newline) survives byte-for-byte; build still produces output.
- `run({ fix: true, validateOnly: true })` migrates then validates-only — `loop → playback` migration happened, no `clips.json` in cache or public.

Each test asserts the Step 0 migration ran (meta changed or unchanged) and that the validate/build handoff completed, so ordering breaks will surface.

Left the lower-priority notes (CLI `parseArgs`/`printHelp` unit tests, `loadSharp` silent fallback) — not urgent, filing none.

Verify: `npm run lint` clean; `npm run test -w mainframe` 828 tests pass (was 824, +4 new). `Pipeline.full.test.js` now 11 tests.

Note on the sibling `[TEST]-akvj-midi-security-and-unsupported.md`: that's akvj-developer's territory (`akvj/src/js/midi-input/Midi.js`), left it in `mail/in/` for them.
