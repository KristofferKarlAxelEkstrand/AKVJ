# midi-mcp — MIDI Protocol MCP Server

A Model Context Protocol (stdio) server that gives AI coding agents fast, searchable access to the MIDI 1.0, MIDI 2.0, and Web MIDI specifications. Built for the AKVJ repo but self-contained.

## How it works

The knowledge base has two tiers:

| Tier        | Contents                                                                                                                   | Location                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `reference` | Curated quick-answer docs: status bytes, SysEx IDs, UMP quick reference, MIDI 1 vs 2, plus the repo's reviewed MIDI guides | `midi-mcp/reference/`, `docs/` (indexed in place) |
| `spec`      | Full extracted text of official specifications, page-anchored (`## Page N`)                                                | `midi-mcp/data/` (generated, committed)           |

Every doc carries a protocol tag: `midi1`, `midi2`, `web-midi`, or `general`. Search ranks `reference` hits above raw `spec` text.

`midi-mcp/data/` is **committed to git**, so a fresh clone works with zero setup — no extraction step needed to use the server.

## Data provenance

| Source                                                                                                                 | What                                                                                                                                    | Protocol |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `.midi-raw-data/` (local-only, gitignored)                                                                             | MIDI.org PDFs/HTML: MIDI 1.0 detailed spec, CC/SysEx tables, GM1/GM2, SMF, MTC, MMC, MSC, CA/RP addenda                                 | midi1    |
| [AMEI public mirror](https://amei-music.github.io/midi2.0-docs/)                                                       | Full official MIDI 2.0 suite: UMP & MIDI 2.0 Protocol (M2-104-UM), MIDI-CI, Property Exchange, Profiles, Network MIDI 2.0, USB-MIDI 2.0 | midi2    |
| [W3C](https://webaudio.github.io/web-midi-api/) + [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) | Web MIDI API editor's draft, TR snapshot, practical reference                                                                           | web-midi |
| [USB-IF](https://www.usb.org/sites/default/files/midi10.pdf), [IETF](https://www.ietf.org/rfc/rfc6295.txt)             | USB-MIDI 1.0 class definition, RTP-MIDI (RFC 6295)                                                                                      | midi1    |
| Community mirror (flagged `unofficial`)                                                                                | BLE-MIDI 1.0 (official download is login-walled on midi.org)                                                                            | midi1    |

## Tools

| Tool                    | Purpose                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `search_spec_data`      | Ranked snippet search; filters: `protocol`, `tier`; results cite page/heading anchors      |
| `read_spec_doc`         | Read one doc by name; `pages: "44-46"` targets the `## Page N` anchors from search results |
| `list_spec_docs`        | Catalog listing with titles, summaries, protocol, tier                                     |
| `fetch_online_resource` | Fetch a public URL (MDN/W3C/midi.org) to verify local data against live sources            |

Resources: `midi://parsed/list` (catalog JSON) and `midi://parsed/read/{name}` (doc text).

## Setup

Already wired for this repo:

- **VS Code / Copilot**: `.vscode/mcp.json` (`midi-spec`, stdio). Run `MCP: List Servers` to check status.
- **Claude Code**: root `.mcp.json` — picked up automatically, works in the dev container.

Manual run for debugging: `node midi-mcp/index.js` (speaks JSON-RPC on stdio).

## Rebuilding the corpus

```bash
npm run midi:extract   # from repo root
```

Regenerates `midi-mcp/data/` from `.midi-raw-data/` (if present) plus the online sources in `sources.json` (downloads cached in `midi-mcp/.cache/`). Network failures skip gracefully; duplicate documents are removed by content hash. Commit the regenerated `data/` afterwards.

- Add online sources: edit `sources.json` (explicit `protocol`/`title`/`summary` beat heuristics).
- Add local sources: drop PDFs/HTML into `.midi-raw-data/` and re-run.
- Never hand-edit `midi-mcp/data/` — it is fully regenerated. Curated content belongs in `midi-mcp/reference/`.

## Development rules

- **Never `console.log` in server code** — stdout is the JSON-RPC stream; use `console.error`.
- Tests: `npm run test -w midi-mcp` (Vitest, no network).
- The server loads the whole corpus (~3 MB) into memory at startup; searches are in-memory and instant.
