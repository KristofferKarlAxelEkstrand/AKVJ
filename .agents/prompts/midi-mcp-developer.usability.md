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

### Work Remaining
- ~38 raw markdown documents remain untransformed. Major ones: MIDI 1.0 Detailed Spec (3252 lines, 10 tables), RTP-MIDI (8644 lines, 6 tables), MIDI 2.0 UMP/Protocol specs, plus many RP/CA documents.
- The project has 44 structured JSON outputs so far, covering the most commonly referenced MIDI specs.
