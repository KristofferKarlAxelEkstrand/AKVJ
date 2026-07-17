# Task 79: Audit and Harden Clip Format & Metadata

## Severity: High (User priority — "get the basics right")

## Context
User explicitly prioritized clip format correctness over the Projects feature. They want to get the basics right so they can start testing AKVJ more thoroughly in real performance scenarios. The clip format is the foundation that Projects will eventually build on.

## Scope
1. **Audit `meta.json` format** — verify all fields are correctly documented, validated, and used
2. **Check `ClipLoader` parsing** — ensure all metadata fields are correctly read and passed to `Clip`
3. **Verify `frameRatesForFrames`** — per-frame FPS overrides work correctly
4. **Verify `frameDurationBeats`** — BPM-synced timing works correctly with MIDI clock
5. **Verify all playback modes** — `once`, `loop`, `pingpong`, `random`, `reverse`, `shuffle`, `scrub`
6. **Check clip validation pipeline** — `mainframe/scripts/clips/` validation catches all malformed metadata
7. **Document the clip format** — ensure `clips/README.md` and AGENTS.md accurately describe all fields

## User Also Noted
User floated the idea of monochrome (grayscale/B&W) clips as a reusable base for effects. Not spec'd yet, but worth considering during format audit — could the format support a `colorMode` field?

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run clips` to verify the full clip pipeline works

## Key Files
- `clips/c1-n0-v0/meta.json` (example clip metadata)
- `clips/README.md` (clip format documentation)
- `akvj/src/js/visuals/ClipLoader.js` (metadata parsing)
- `akvj/src/js/visuals/Clip.js` (clip playback)
- `mainframe/scripts/clips/` (validation pipeline)

## Constraints
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 70 (Clip clock subscription) — completed, BPM-sync now works correctly
- Task 78 (Pingpong fix) — in progress, affects playback mode correctness
