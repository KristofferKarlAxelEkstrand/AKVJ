# AKVJ Project Specification

This file is an **entry point**, not the product truth. Detailed behaviour lives elsewhere so it does not drift out of sync with the code.

## Where to read

| Need                                                                                        | Source                                                                                      |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| How code is written (vanilla JS, MIDI channel table, clip `meta.json` fields, commands)     | [`AGENTS.md`](AGENTS.md)                                                                    |
| How the product works today (clips, timing/sync, mapping, aesthetics, akvj/mainframe split) | [`.agents/office-space/developer-team/spec/`](.agents/office-space/developer-team/spec/README.md) |
| Contributing / git guard rails                                                              | [`CONTRIBUTING.md`](CONTRIBUTING.md)                                                        |

Only specs marked `status: approved` are binding. Draft specs are informative context.

## One-sentence product map

- **`akvj/`** — live 240×135 / 60fps VJ engine; MIDI in → canvas out; near-zero UI (fullscreen via Enter/Space/double-click; **D** debug overlay; transient project-switch loading — see `spec/aesthetics.md`).
- **`mainframe/`** — backoffice for clip authoring, mapping, and projects.
- **Bridge** — shared on-disk projects only (`projects/{projectId}/clips/`, `key-map.json`, `projects/index.json`, `active-project.json`). The pipeline copies into `akvj/src/public/` (generated; do not hand-edit). No shared JS imports between the two packages.

## Do not use this file for

- Clip timing or BPM sync field names — see `AGENTS.md` and `spec/clip-timing-sync.md` (`sync` / `syncLength` / `syncBeats`; there is no `frameDurationBeats`).
- Full MIDI channel or `meta.json` tables — see `AGENTS.md`.
- Open product questions (e.g. settings global vs per-project) — tracked in `spec/goal.md`; the human owns those decisions.
