# [ARCHITECTURE] Docs Still Reference `set-mapping.json` — File Was Renamed to `key-map.json` and Docs Were Never Updated

## Issue Description
Task 29 ("Rename midi-layout to key-map," marked ✅ Done on the dashboard) explicitly included in its scope: *"6. Docs: AGENTS.md, README.md, any other references"* (`.agents/workflows/developer-team/tasks/done/29-rename-midi-layout-to-key-map.md:12`). The code-side rename was done correctly — the canonical file is `clips/key-map.json`, referenced correctly by `akvj/src/js/core/settings.js:111` (`keyMapJsonUrl: '/clips/key-map.json'`) and `ClipLoader.js`. But the docs sub-task was missed: every top-level doc still calls it `set-mapping.json`, which no longer exists anywhere except stale, gitignored build artifacts (`.cache/clips/`, `akvj/dist/clips/`, `akvj/src/public/clips/` — leftover generated output, not source).

**`AGENTS.md`** — the file explicitly declared as *"the single source of truth for AI coding agents working with the AKVJ codebase"* — has 4 stale references:
- Line 107: "`set-mapping.json` uses DAW channels..."
- Line 142: "MIDI placement is in `clips/set-mapping.json`..."
- Line 148: file tree listing `clips/set-mapping.json`
- Line 228: build-scripts table, "Validate set-mapping.json vs clip bucket" (describing `validateMapping.js`)

It never mentions `key-map.json` anywhere. Any AI agent (including future Overseer/developer/QA instances) trusting this file at face value will look for or write instructions about a file that doesn't exist at that path.

**`README.md`** — 9 stale references (lines 88, 97, 106, 111, 202, 203, 238, 283, 308): repo structure diagrams, the pipeline description, port table, and the quickstart's "Map MIDI" step all still say `set-mapping.json`.

**`CONTRIBUTING.md`** — 1 stale reference (line 154): "MIDI placement is configured in `clips/set-mapping.json`..."

**`docs/how-to-program-midi.md`** — 4 stale references (lines 40, 183, 190, 311), including a worked example (`clips/c1-n60-v100/`) that tells a reader to look in the wrong file.

This is exactly the kind of doc/code desync that compounds: since `AGENTS.md` is loaded as authoritative context for every AI agent working in this repo (it's `@`-imported by `CLAUDE.md`), the incorrect filename will keep getting propagated into new work, new docs, and new agent explanations until someone corrects the source.

## How to Fix
Search-and-replace `set-mapping.json` → `key-map.json` (and any leftover `set-mapping` prose references) across:
- `AGENTS.md` (lines 107, 142, 148, 228)
- `README.md` (lines 88, 97, 106, 111, 202, 203, 238, 283, 308)
- `CONTRIBUTING.md` (line 154)
- `docs/how-to-program-midi.md` (lines 40, 183, 190, 311)

Then grep the whole repo (excluding `node_modules`, `.cache`, `dist`, `src/public`, and the `.agents/workflows/developer-team/tasks/done`/`inbox/read` history — those are an intentional historical record of the rename and should stay as-is) for `set-mapping` to confirm nothing else was missed:
```bash
grep -rln "set-mapping" --include="*.md" . | grep -vE "node_modules|\.cache|dist|src/public|tasks/done|inbox/read"
```

## Key Files
- `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `docs/how-to-program-midi.md`

## Dependencies
- None. Pure documentation fix — no code changes required (the code side of Task 29 was already done correctly).
