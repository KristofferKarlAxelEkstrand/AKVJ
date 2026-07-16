# MIDI MCP Developer: Usability Ledger

This file contains ongoing thoughts, assessments, and ideas regarding the overall progress of the `midi-mcp` project.

Specifically, document here:
1. **Work Remaining**: High-level assessments of how much raw data is left to transform and the overall state of the project.
2. **Agent Usability**: Thoughts on how an AI agent interacting with our MCP server will actually *use* the structured JSON data we are generating.
3. **MCP Tool Ideas**: Brainstorming new tools or endpoints for the MCP server that would make the structured data incredibly helpful for AI coding assistants.

---

## Ongoing Thoughts

### DLS Level 1 Transformer (completed)
- Parsed 10 structured sections from the DLS 1.1 spec: connection blocks (29), articulator defaults (20), example parameters (8), RIFF definitions (11), DLS SysEx messages (4), connection sources/destinations/transforms (14/14/2), INFO chunk IDs (17), and parameter units (5).
- The DLS spec is unique in that it defines a **file format** (RIFF-based) rather than just MIDI messages. The structured JSON captures both the synthesis architecture (connection graph model) and the binary chunk layout.
- **Agent usability**: An AI agent working on a DLS parser/writer could use this JSON to look up chunk definitions, connection block constants, and INFO chunk ID meanings. The articulator defaults table is especially useful for validating synthesis parameters.
- **MCP tool idea**: `lookup_dls_chunk(chunk_id)` — returns the fields and description for a given DLS RIFF chunk. `lookup_dls_connection(source, control, destination)` — returns the connection block details including default/min/max values.

### DLS Level 2.2 Transformer (completed)
- Parsed 7 structured sections: note exclusivity (2), modulation routes (56), connection defaults (56), DLS SysEx messages (4), RIFF definitions (13), Level 1 connection constants (33), Level 2 connection constants (58).
- DLS 2.2 extends DLS 1.1 with: vibrato LFO, filter (cutoff/Q), 6-channel output, chorus/reverb sends, phase-locked samples, conditional chunks, and 2 new transforms (Convex, Switch).
- **Key parsing challenge**: PDF extraction introduced line-wrapped rows and space-separated identifiers (e.g., `SRC_ LFO`, `SRC_CHANNEL PRESSURE`). Fixed with pre-normalization regexes and multi-line row accumulation.
- **Agent usability**: Combined with DLS 1.1 data, an agent can now look up any DLS connection constant across both spec levels, including the new filter destinations and channel output destinations.
- **MCP tool idea**: `compare_dls_levels()` — returns the diff between DLS 1 and DLS 2 constants, showing what was added (vibrato, filter, channel output, new EG times, new transforms).

### MIDI 1.0 Detailed Specification Transformer (completed)
- Parsed 13 structured sections from the 3252-line spec: status byte summary (11), channel voice messages (7), controller numbers (46), registered parameter numbers (5), channel mode messages (8), system common messages (7), system real-time messages (8), system exclusive messages (2), universal SysEx non-real-time (41), universal SysEx real-time (36), manufacturer ID numbers (227), additional spec documents (5), and SysEx message formats (46).
- This is the **foundational MIDI 1.0 document** — it defines the core message structure that all other MIDI specs build upon. The structured JSON captures the complete message hierarchy from status bytes down to individual data byte descriptions.
- **Key parsing challenges**:
  - The document mixes body text (with SysEx format descriptions) and structured tables (Tables I-VIII). Used an `inTablesSection` flag to separate the two parsing modes.
  - F0H status byte was missed because the regex `^[0-9A-F]nH?$` didn't match `F0H` (has `0` not `n`). Fixed to `^[0-9A-F](n|0)H?$`.
  - Channel Mode row (BnH) has 5 tab-separated fields instead of the standard 4, requiring a separate parsing branch before the standard row handler.
  - Table VIIa has hierarchical entries: 3-part parent rows (e.g., "06 nn General Information") and 2-part sub-entries (e.g., "01 Identity Request"). Fixed parser to distinguish these and set `sub_id_2: null` for sub-entries.
  - Table VII notes section (after "NOTES:") had continuation lines being captured as data. Added `table7NotesSeen` flag to stop capturing after notes begin.
  - OCR errors in manufacturer IDs (e.g., "OOH" instead of "00H") normalized during parsing.
  - SysEx message formats in body text required associating named headers (e.g., "ACK") with subsequent F0-prefixed format lines using a `pendingSysExFormat` state variable.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up any status byte and its meaning (e.g., "What does 0xBn mean?" → Control Change / Channel Mode)
  - Get the complete controller number table with decimal/hex/function mappings
  - Resolve manufacturer IDs to company names (227 entries across American/European/Japanese regions)
  - Look up Universal SysEx message structures (non-real-time and real-time sub-IDs)
  - Get SysEx message format strings with field descriptions for code generation
  - Validate MIDI message structure (data byte counts, binary representations)
- **MCP tool ideas**:
  - `lookup_status_byte(hex)` — returns the message type, binary representation, data byte count, and description for any MIDI status byte
  - `lookup_controller(number)` — returns the hex, function, and category (control vs mode) for a given controller number
  - `lookup_manufacturer_id(id_hex)` — returns the manufacturer name and region for a given SysEx ID
  - `lookup_sysex_format(name)` — returns the complete format string and field descriptions for a named SysEx message (e.g., "Identity Request", "Master Volume")
  - `get_midi_message_hierarchy()` — returns the full hierarchy of MIDI 1.0 message types for educational/reference purposes

### Work Remaining
- ~37 raw markdown documents remain untransformed. Major ones: RTP-MIDI (8644 lines, 6 tables), MIDI 2.0 UMP/Protocol specs, plus many RP/CA documents.
- The project has 45 structured JSON outputs so far, covering the most commonly referenced MIDI specs.
