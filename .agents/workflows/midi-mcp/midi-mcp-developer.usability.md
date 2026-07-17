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

### RTP-MIDI (RFC 6295) Transformer (completed)
- Parsed 6 structured sections from the 8644-line RFC: packet figures (10), channel chapters (8: P, C, M, W, N, E, T, A), system chapters (5: D, V, Q, F, X), configuration parameters (28), media type registrations (3: audio/rtp-midi, audio/mpeg4-generic, audio/asc), and ABNF parameter syntax definitions (55).
- This is the **network MIDI transport spec** — it defines how MIDI 1.0 is carried over RTP/UDP/TCP with a recovery journal for packet loss resilience. The structured JSON captures the complete packet format, recovery journal chapter hierarchy, and all session configuration parameters with their ABNF syntax and allowed values.
- **Key parsing challenges**:
  - RFC documents use ASCII art bitfield diagrams instead of tables. Field names extracted from pipe-delimited cells (e.g., `|S|Y|A|H|TOTCHAN|`).
  - TOC entries with dot leaders (e.g., `B.1. System Chapter D...83`) were being parsed as actual sections. Fixed with dot-leader detection (`/\.\.+\s*\d+$/`).
  - System chapters (Appendix B) use "System Chapter" prefix vs "Chapter" in channel chapters (Appendix A). Fixed regex to handle both: `(?:System\s+)?Chapter`.
  - Chapter field/figure capture was broken for system chapters because the lookup always preferred `channelChapters` last entry. Fixed by tracking `currentChapter` reference directly.
  - Subsection headings (e.g., `B.5.1. Chapter Format`) were incorrectly treated as chapter boundaries, clearing `currentChapter` before the figure block. Fixed by only matching top-level chapter/appendix headings.
  - Prose references to appendices (e.g., "Appendix A.1 definition of...") triggered boundary checks. Fixed by requiring `Appendix X.\s+[A-Z]` (heading format).
  - ABNF section references use "Parameters defined" (plural) for most sections but "Parameter defined" (singular) for C.4. Fixed regex to `Parameters?`.
  - ABNF `param-assign` lines have opening parenthesis before quoted parameter name: `param-assign =/  ("cm_unused=" ...`. Fixed regex to handle optional `(`.
  - Packet figure backward scan broke on empty lines between figure blocks. Fixed by skipping empty lines instead of breaking.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up any RTP-MIDI configuration parameter with its allowed values and ABNF syntax
  - Get the complete recovery journal chapter hierarchy with field names for each chapter
  - Understand the packet format structure (RTP header, MIDI command section, journal section)
  - Look up media type registration details for audio/rtp-midi, audio/mpeg4-generic, and audio/asc
  - Generate SDP session descriptions with correct parameter syntax
- **MCP tool ideas**:
  - `lookup_rtp_midi_param(name)` — returns the allowed values, ABNF syntax, and section reference for a configuration parameter
  - `get_recovery_journal_chapter(letter)` — returns the fields, figure reference, and size for a recovery journal chapter (e.g., "P" → Program Change, "X" → System Exclusive)
  - `get_rtp_midi_packet_format()` — returns the structured packet format with all figure field names
  - `get_media_type_registration(subtype)` — returns the required and optional parameters for a registered media type

### UMP/MIDI 2.0 Protocol (M2-104-UM) Transformer (completed)
- Parsed 19 structured sections from the 4019-line spec: message type allocation (16 MTs), attribute types (5), flex data format/address fields (4+4), status bank classifications (4), sharps/flats examples (3), tonic sharps/flats (5), chord types (29), bass note sharps/flats (6), text messages (18), system message formats (16), SysEx7/8 status values (4+4), special ID conversions (3), manufacturer ID conversions (9), registered per-note controllers (27), center value examples (5), UMP format layouts (34), and MIDI 2.0 addressing (17).
- This is the **core MIDI 2.0 protocol spec** — it defines the Universal MIDI Packet format (32/64/96/128-bit packets), all message types (MT 0x0-0xF), MIDI 2.0 channel voice messages with 16/32-bit resolution, Flex Data messages (lyrics, chords, tempo), SysEx7/SysEx8, and MIDI 1.0↔2.0 translation rules. The structured JSON captures the complete message hierarchy from MT allocation down to individual byte layouts.
- **Key parsing challenges**:
  - PDF-extracted markdown uses space-separated tables (not pipe-delimited) with page breaks interrupting rows. Parser skips `## Page N` headers and accumulates rows across boundaries.
  - Reserved MT entries (0x7-0xC) have empty descriptions after page break — regex made description optional.
  - Manufacturer ID table has variable-width name column (1-3 words) — solved by finding the MfrID (first 4-hex-digit value) and back-calculating column positions.
  - Registered Per-Note Controllers table has multi-line entries (name continues on next line) — two-pass parser: first tries dash-separated entries, then falls back to no-dash matching.
  - En-dash (`\u2013`) used instead of ASCII hyphen throughout the document.
  - MfrID values use lowercase hex (0x803b, 0xa025) — regex needed `[0-9A-Fa-f]` character class.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up any UMP message type and its packet size (e.g., "What size is MT 0x4?" → 64 bits)
  - Get the complete MIDI 2.0 channel voice message opcode table with resolution info
  - Look up any chord type value (29 types from Clear to Suspended 4th)
  - Get text message status bank/status combinations for Flex Data parsing
  - Look up manufacturer ID conversions between MIDI 1.0 (7-bit) and MIDI 2.0 (16-bit) formats
  - Get registered per-note controller numbers with their references (e.g., RPNC #3 → Pitch 7.25, Section 7.4.15.2)
  - Get byte-by-byte UMP format layouts for all message types (Tables 26-33)
  - Get center value examples for bit scaling between resolutions
- **MCP tool ideas**:
  - `lookup_ump_message_type(mt)` — returns the size, description, and byte layout for a UMP message type
  - `lookup_chord_type(value)` — returns the chord type name for a given chord type field value
  - `lookup_text_message(status_bank, status)` — returns the message name for a Flex Data text message
  - `lookup_per_note_controller(number)` — returns the controller name, default value, and reference for a registered per-note controller
  - `convert_manufacturer_id(mfid_1, mfid_2, mfid_3)` — returns the MIDI 2.0 16-bit MfrID for given MIDI 1.0 SysEx ID bytes
  - `get_ump_format(mt)` — returns all byte layout entries for a given message type

### MIDI-CI (M2-101-UM) Transformer (completed)
- Parsed 10 structured sections from the 2592-line spec: categories (8), standard format fields (14), bitmap allocation (7), message formats (407 fields across 33 tables), ACK status codes (3), NAK status codes (15), property exchange versions (1), endpoint info status values (2), profile ID formats (5), and message data control values (4).
- This is the **MIDI capability negotiation spec** — it defines bidirectional discovery (MUID exchange, device identification), profile configuration (enable/disable standardized behavior sets), property exchange (JSON resources over SysEx), and process inquiry (MIDI message reporting). The structured JSON captures all 46 tables including every message format with byte-level field descriptions.
- **Key parsing challenges**:
  - 33 of 46 tables share the same `Value | Parameter` format — merged into a single `message_formats` array with `table_number` to identify the source table.
  - Tab characters (`\t`) are the primary separator (unlike UMP spec which uses spaces) — multi-column parsers use `split('\t')`.
  - Tables 10 and 19 have different 3-column structures — parsed as separate sections (`endpoint_info_status_values` and `profile_id_formats`).
  - Section headers like `5.7.1` and note lines (`Note:`, `The following fields`) terminate table parsing.
  - ACK/NAK status code tables share the same 3-column format — both use `parseStatusCodes`.
  - Page breaks (`## Page N`) interrupt tables mid-data — parser skips them and continues accumulating rows.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up any MIDI-CI message format by table number (e.g., Table 6 = Discovery, Table 13 = ACK)
  - Get the standard MIDI-CI message header structure (F0 7E Device-ID 0D Sub-ID#2 Version MUIDs... F7)
  - Look up ACK/NAK status codes and their meanings
  - Get category bitmap allocation for capability negotiation
  - Look up profile ID byte formats (standard vs manufacturer-specific)
  - Get property exchange version compatibility info
  - Look up message data control values for process inquiry
- **MCP tool ideas**:
  - `lookup_midi_ci_message(table_number)` — returns all byte fields for a specific MIDI-CI message format table
  - `lookup_midi_ci_status_code(code, type)` — returns the reason for an ACK or NAK status code
  - `get_midi_ci_categories()` — returns the 8 message categories with Sub-ID#2 ranges
  - `get_midi_ci_standard_format()` — returns the common header structure shared by all MIDI-CI messages
  - `lookup_profile_id_format(byte_number)` — returns standard vs manufacturer-specific field for a profile ID byte

### Property Exchange (M2-103-UM) Transformer (completed)
- Parsed 6 structured sections from the 2721-line spec: PE message format (16 fields), PE messages (11 Sub-ID#2 entries), encoding types (3), property definitions (21 entries across 9 tables), reply status codes (19), and transaction examples (138 entries across 80+ tables).
- This is the **Property Exchange rules spec** — it defines how JSON-based resource data is exchanged over MIDI-CI SysEx messages, including chunking, headers (request/reply), status codes (HTTP-like 200/404/500), encoding (ASCII/Mcoded7/zlib), subscriptions, pagination, links, and ResourceList. The structured JSON captures all property header definitions, status codes, and transaction examples.
- **Key parsing challenges**:
  - 97 tables, most are transaction examples with `Header Data | Property Data` JSON snippets — merged into one array with `table_number`.
  - 9 property definition tables share `Property Key | Property Value Type | Description` format with multi-line descriptions — uses a pending-entry state machine that accumulates description lines until a new property key is detected.
  - Property key detection uses a known-props list (resource, resId, status, etc.) to distinguish new entries from continuation lines.
  - PE messages (Table 11) require known message type patterns to split type from description (e.g., "Inquiry: Get Property Data" is the type, rest is description).
  - Transaction examples capture multi-line JSON content by appending to the last entry.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up all valid request header properties (resource, resId, mutualEncoding, flowControl)
  - Look up all valid reply header properties (status, mutualEncoding, cacheTime)
  - Get reply status codes and their meanings (200=OK, 404=Not Found, 500=Internal Error)
  - Get encoding types (ASCII, Mcoded7, zlib+Mcoded7) and their descriptions
  - Look up subscription property fields (subscribeId, command)
  - Get link properties (resource, resId, title, role)
  - Browse transaction examples to understand PE message flows
  - Get the PE message byte-level format (F0 7E ... 0D ... F7)
- **MCP tool ideas**:
  - `lookup_pe_request_header_property(key)` — returns the value type and description for a request header property
  - `lookup_pe_reply_header_property(key)` — returns the value type and description for a reply header property
  - `lookup_pe_status_code(code)` — returns the description for a PE reply status code
  - `get_pe_encoding_types()` — returns the list of supported encoding/compression types
  - `get_pe_messages()` — returns all MIDI-CI messages used for Property Exchange with Sub-ID#2 values
  - `get_pe_transaction_examples(table_number)` — returns the Header Data and Property Data for a specific transaction example

### SMF (RP-001) Transformer (completed)
- Parsed 5 structured sections from the 596-line spec: variable-length examples (12), file formats (3), division formats (2), meta-events (15), and example events (38).
- This is the **Standard MIDI File specification** — it defines the .mid file format: chunk-based structure (MThd/MTrk), variable-length quantities, file formats (0/1/2), delta-time encoding, running status, SysEx events, and all 15 meta-event types (Sequence Number, Text, Copyright, Track Name, End of Track, Set Tempo, SMPTE Offset, Time Signature, Key Signature, Sequencer-Specific, etc.).
- **Key parsing challenges**:
  - No formal tables — all structured data extracted from prose and code examples using regex patterns.
  - Variable-length quantity examples: 8-digit hex numbers matched with `VARLEN_RE` — had to limit `SECTION_HEADER_RE` to 1-2 digit numbers to avoid matching hex data as section headers.
  - Meta-events: multi-line descriptions accumulated via pending-entry state machine; regex requires name to start with uppercase letter to distinguish new events from continuation lines.
  - Example events: only captured after "Delta Time...Event...Comment" header detected (`inExampleSection` flag) to avoid false positives from hex data earlier in the document.
  - Key Signature (FF 59) has `sf = -7` / `mi = 0` continuation lines handled specially in the description accumulator.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up any SMF meta-event by FF type byte (e.g., FF 51 = Set Tempo, FF 2F = End of Track)
  - Get the syntax and description for each meta-event
  - Convert between hex values and variable-length representations
  - Understand the three SMF file formats (0, 1, 2)
  - Distinguish metrical vs SMPTE division formats
  - Reference example MIDI file events for testing
- **MCP tool ideas**:
  - `lookup_smf_meta_event(ff_type)` — returns the syntax, name, and description for a given meta-event type byte
  - `get_smf_file_formats()` — returns the 3 SMF file format definitions
  - `encode_variable_length(number)` — returns the variable-length quantity representation for a given number
  - `get_smf_division_formats()` — returns metrical and SMPTE division format descriptions

### MSC (RP-002-014) Transformer (completed)
- Parsed 12 structured sections from the 1762-line spec: device IDs (3), command formats (57), general commands (12), sound commands (15), 2PC commands (7), command descriptions (40), 2PC normal sequence (4), 2PC exception sequence (3), status code ranges (4), CANCELLED status codes (6), ABORT status codes (20), command_format dependent status codes (7 groups).
- This is the **MIDI Show Control specification** — it defines the MSC protocol for controlling entertainment/show equipment (lighting, sound, machinery, video, projection, process control, pyrotechnics) via Universal Real Time SysEx messages. Includes the 2-Phase Commit (2PC) protocol for closed-loop control with error detection.
- **Key parsing challenges**:
  - Tab-separated tables with section-based dispatch: section headers like "4.3. General Commands" switch parsing mode.
  - Page number lines like "10 MIDI Show Control 1.1.1" leaked into command formats and commands — filtered with explicit check.
  - Command descriptions: multi-line descriptions with data format lines intermixed. Data format lines detected by regex matching angle brackets (`<Q_number>`) or lowercase 2-letter token pairs (`cc cc`, `hr mn sc fr ff`). Initial regex was too broad (`\w+\s+\w+`) and caught description text like "Terminates all" — fixed to only match `[a-z]{2}` tokens.
  - Status codes: hex field is the full 2-byte value (e.g., "80 04") from `parts[0]` after tab split. Initial code incorrectly joined `parts[0] + ' ' + parts[1]` including the messages column.
  - 2PC exception sequence header row "Message Sender Purpose" filtered with explicit check.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up any MSC command by hex code (e.g., 01 = GO, 20 = STANDBY)
  - Get command formats (lighting, sound, machinery, etc.) by hex code
  - Understand the 2PC protocol flow (STANDBY→STANDING_BY→GO_2PC→COMPLETE)
  - Look up status codes for error handling (ABORT, CANCELLED)
  - Get detailed command descriptions with data format and usage
  - Find command_format-specific status codes (e.g., lighting motor failure)
- **MCP tool ideas**:
  - `lookup_msc_command(hex)` — returns the name, data bytes, and description for a given command hex code
  - `get_msc_command_formats()` — returns all 57 command format definitions
  - `get_msc_2pc_sequence()` — returns the normal and exception 2PC message sequences
  - `lookup_msc_status_code(hex)` — returns the description for a given ABORT or CANCELLED status code
  - `get_msc_command_format_status_codes(command_format)` — returns status codes specific to a command format group

### MMC (RP-013) Transformer (completed)
- Parsed 6 structured sections from the 11042-line spec: message types (10), abbreviations (6), commands index (24), information fields index (18), command descriptions (32), field descriptions (59).
- This is the **MIDI Machine Control specification** — it defines the MMC protocol for transport control of recording equipment (play, stop, record, locate, chase) via Universal Real Time SysEx messages. Includes READ/WRITE access to device Information Fields, event triggering, and motion control.
- **Key parsing challenges**:
  - Heavily OCR-fragmented document (11042 lines, 197KB) with tab-separated tables broken across multiple lines.
  - TOC entries on pages 3-4 use same tab format as actual section headers — fixed by requiring `currentPage > 10` before accepting section headers.
  - Description text appears BEFORE hex marker lines (unlike most specs where it follows) — accumulator pattern assigns preceding text as description when hex marker is found.
  - Hex marker regex requires tab: `^[0-9A-Fa-f]{2}\s\t(.+)$` — some OCR-fragmented entries like "0 4 \tFAST FORWARD" (space in hex) are missed.
  - Commands index relaxed to 3 parts minimum (some entries like 7F RESUME lack data_bytes and min_sets columns).
- **Agent usability**: An AI agent can use this JSON to:
  - Look up any MMC command by hex code (e.g., 01 = STOP, 02 = PLAY, 42 = READ)
  - Get information field definitions (SELECTED TIME CODE, SIGNATURE, etc.)
  - Understand message type categories (Comm, Ctrl, Evnt, Gen, I/O, Sync, Math, MTC, Proc, Time)
  - Read detailed command and field descriptions
- **MCP tool ideas**:
  - `lookup_mmc_command(hex)` — returns the name, type, data bytes, and description for a given command hex code
  - `get_mmc_information_fields()` — returns all information field definitions
  - `lookup_mmc_field(hex)` — returns the description for a given information field hex code
  - `get_mmc_message_types()` — returns all message type categories

### MTC (RP-004-008) Transformer (completed)
- Parsed 8 structured sections from the 502-line spec: quarter frame types (8), bit field assignments (4), SMPTE types (4), full message (11 fields), user bits message, MTC cueing setup types (15), special subtypes (16), realtime cueing setup types (15), signal path modes (4), quarter frame example (8).
- This is the **MIDI Time Code specification** — it defines MTC for device synchronization via Quarter Frame messages (F1) and Full Messages (Universal Real Time SysEx). Includes SMPTE time encoding (24/25/30 fps), User Bits, MTC Cueing for event scheduling, and signal path modes.
- **Key parsing challenges**:
  - `FAST FORWARD/REWIND MODE` split across two lines — merged by detecting partial mode name (`FAST FORWARD/`) and merging with following `REWIND MODE:` line.
  - Page number lines (e.g., `6 \tMIDI Time Code (Doc 4.2.1)`) mixed with field data — filtered by checking if first part is a standalone number and second part starts with "MIDI Time Code".
  - Continuation lines in cueing descriptions (e.g., `00 through 04 00 ignore...`) filtered by requiring name to start with uppercase letter.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up quarter frame message types and their nibble assignments
  - Get bit field layouts for assembling/disassembling SMPTE time from quarter frame messages
  - Look up SMPTE frame rate codes (24, 25, 30 drop, 30 non-drop)
  - Get Full Message and User Bits Message SysEx byte layouts
  - Look up MTC Cueing setup types (punch in/out, event start/stop, cue points, etc.)
  - Understand signal path modes (PLAY, CUE, FAST FORWARD/REWIND, SHUTTLE)
  - See a worked example of quarter frame encoding for time 01:37:52:16
- **MCP tool ideas**:
  - `lookup_mtc_quarter_frame_type(type)` — returns the description for a given quarter frame type (0-7)
  - `get_mtc_full_message_format()` — returns the byte layout for the Full Message SysEx
  - `lookup_mtc_cueing_type(hex)` — returns the name and description for a given cueing setup type
  - `get_mtc_smpte_types()` — returns all SMPTE frame rate codes
  - `get_mtc_signal_path_modes()` — returns all signal path modes with descriptions

### MIDI Clip File (M2-116-U) Transformer (completed)
- Parsed 9 structured sections from the 591-line spec: version history (1), definitions (22), conformance words (7), normative references (6), SMF types (5), file header (8 bytes), file structure (3 sections), max times table (7 rows), useful MIDI messages (20).
- This is the **MIDI Clip File Specification (SMF2CLIP)** — defines a file format for storing UMP/MIDI 2.0 data as clips, similar to SMF Type 0. Uses 8-byte "SMF2CLIP" header, Delta Clockstamps for timing, and UMP messages throughout. Includes Clip Configuration Header for receiver setup and Clip Sequence Data for the main sequence.
- **Key parsing challenges**:
  - SMF types listed in section 1.2 Background (before section 2 header) — required detecting Background section as the entry point.
  - Max times table had label rows ("Per Beat", "Max Number of Quarter Notes") and section headers mixed in — filtered by matching label patterns and section number format.
  - YAML frontmatter parsed separately from markdown body.
  - Conformance words split across two tables (Table 2: required, Table 3: descriptive) — handled with category parameter.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up MIDI Clip File structure (3 sections: File Header, Clip Configuration Header, Clip Sequence Data)
  - Get the 8-byte file header values (SMF2CLIP = 0x53 0x4D 0x46 0x32 0x43 0x4C 0x49 0x50)
  - Understand SMF type evolution (Type 0/1/2 → MIDI Clip File / MIDI Container File)
  - Look up DCTPQ and DCS timing message definitions
  - Get max time addressable at various tempos and tick rates
  - Understand Clip Configuration Header structure (Profile, Tempo, Time Signature)
  - Understand Clip Sequence Data structure (Start of Clip, Set Tempo, MIDI Data, End of Clip)
  - Get the list of 20 useful MIDI messages for clip files (Set Tempo, Lyrics, Project Name, etc.)
  - Look up MIDI 2.0 terminology definitions (UMP, Group, Profile, MIDI-CI, etc.)
  - Check conformance word usage (shall/should/may vs must/will/can/might)
- **MCP tool ideas**:
  - `get_midi_clip_file_structure()` — returns the 3-section file structure
  - `get_midi_clip_file_header()` — returns the 8-byte header values
  - `lookup_smf_type(name)` — returns description for a given SMF type
  - `get_clip_configuration_sections()` — returns all sub-sections of the Clip Configuration Header
  - `get_clip_sequence_sections()` — returns all sub-sections of the Clip Sequence Data
  - `get_useful_midi_messages_for_clips()` — returns the list of 20 useful messages
  - `lookup_midi_term(term)` — returns the definition of a MIDI 2.0 term

### Network MIDI 2.0 (UDP) Transformer (completed)
- Parsed 11 structured sections from the 1844-line spec: version history (2), definitions (39), conformance words (7), normative references (14), DNS records (15: PTR 3, SRV 6, TXT 6), command packet header (3 fields), commands (17), session states (6), commands per session state (7), command field tables (18 tables), NAK reasons (5), Bye reasons (18 with 3 category headers), error reasons (2), authentication states (5).
- This is the **Network MIDI 2.0 (UDP) Transport Specification** — defines how to transport UMP messages over UDP/IP networks. Covers DNS-SD discovery, session management (invitation, authentication, reset, bye), UMP data transfer with FEC and retransmit, and all command packet formats.
- **Key parsing challenges**:
  - Table fields use single-space separation (not tab), requiring known field name matching.
  - Multi-line cell wrapping — fields like "Command Payload Length (pl)" span multiple lines.
  - Section boundaries between command tables (6.x headers) needed to reset parsing context.
  - NAK/Bye reason tables also use single-space format — required known reason name list for splitting reason from description.
  - Auth state values from two tables (15 and 17) with overlapping codes.
  - TOC entries with dots filtered out.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up all 17 command codes with names, directions, and section references
  - Get command packet header structure (4 bytes: Command Code, Payload Length, Specific Data)
  - Understand the 6 session states and which commands are valid in each
  - Get per-command field layouts (18 tables with field name, size, values, description)
  - Look up NAK reason codes (0x00-0x20) with descriptions
  - Look up Bye reason codes (0x00-0x80) with category headers (Either/Host→Client/Client→Host)
  - Look up Retransmit Error reason codes (0x00-0x01)
  - Get DNS-SD record formats (PTR, SRV, TXT) for _midi2._udp.local service discovery
  - Get the 4-byte UDP signature (0x4D494449 = "MIDI")
  - Look up authentication state values
  - Check conformance word usage (shall/should/may vs must/will/can/might)
  - Look up network MIDI terminology (Session, Host, Client, CryptoNonce, etc.)
- **MCP tool ideas**:
  - `get_network_midi_commands()` — returns all 17 command codes with names and directions
  - `lookup_network_midi_command(code)` — returns command details for a given hex code
  - `get_session_states()` — returns all 6 session states with descriptions
  - `get_commands_for_session_state(state)` — returns valid commands for a given state
  - `get_command_table(table_number)` — returns field layout for a specific command table
  - `lookup_nak_reason(code)` — returns NAK reason description
  - `lookup_bye_reason(code)` — returns Bye reason description
  - `get_dns_records()` — returns PTR/SRV/TXT record formats for MIDI 2.0 discovery
  - `get_udp_signature()` — returns the signature value and format

### RP-019 SMF Device/Program Name Meta Events Transformer (completed)
- Parsed 3 structured sections from the 64-line single-page spec: meta events (2), usage rules (6), device naming recommendations (13), plus approval dates.
- Defines two SMF Meta Events: Device Name (0x09, `FF 09 len text`) for naming the target device per track, and Program Name (0x08, `FF 08 len text`) for naming the program referenced by bank select/program change.
- **Agent usability**: An AI agent can use this JSON to:
  - Look up the Device Name Meta Event format (0x09) and usage rules (one per track, at beginning)
  - Look up the Program Name Meta Event format (0x08) and usage rules (multiple allowed, before program change)
  - Understand Type 0 vs Type 1 SMF usage differences
  - Get device naming recommendations for different distribution scenarios
- **MCP tool ideas**:
  - `get_rp19_meta_events()` — returns both meta event definitions
  - `get_rp19_usage_rules()` — returns usage rules for Type 0 and Type 1 SMF

### RP-022 Redefinition of RPN 01/02 Transformer (completed)
- Parsed 2 RPN change steps from the 29-line single-page spec.
- Renames RPN 01 to "Channel Fine Tuning" and RPN 02 to "Channel Coarse Tuning" under heading "Channel Tuning", due to naming conflict with CA-025 Master Fine/Coarse Tuning.
- **Agent usability**: Look up RPN rename history and Table IIIa updates.
- Approved by MMA 02/99, AMEI 05/99.

### RP-023 Renaming of CC91 and CC93 Transformer (completed)
- Parsed 2 CC rename entries from the 29-line single-page spec.
- CC91 (0x5B): "Effect 1 Depth" → "Reverb Send Level"; CC93 (0x5D): "Effect 3 Depth" → "Chorus Send Level".
- Note: actual response depends on formal R/P such as General MIDI Level 2.
- **Agent usability**: Look up CC rename history for effects sends.
- Approved by MMA 02/99, AMEI 05/99.

### RP-021 Sound Controller Defaults Transformer (completed)
- Parsed 10 sound controller entries (CC 70-79) from the 41-line single-page spec.
- CC 70-74 (Sound Controllers 1-5): unchanged defaults marked with asterisk (Sound Variation, Timbre/Harmonic Intensity, Release Time, Attack Time, Brightness).
- CC 75-78 (Sound Controllers 6-9): new defaults (Decay Time, Vibrato Rate, Vibrato Depth, Vibrato Delay).
- CC 79 (Sound Controller 10): undefined.
- Comments: MIDI spec to be revised to remove language forbidding Sound Controllers; defaults can be changed via Universal RT SysEx "Controller Destination Setting".
- **Agent usability**: Look up sound controller default names and CC mappings.
- Approved by MMA 02/99, AMEI 05/99.

### RP-036 Default Pan Formula Transformer (completed)
- Parsed pan formula details from the 43-line single-page spec.
- Defines default CC#10 (Pan) response: default value 64 (0x40) = center, range 0-127 with values 0 and 1 both hard left.
- Equal power formulas: Left Gain = 20*log(cos(π/2 * max(0, CC#10-1)/126)), Right Gain = 20*log(sin(π/2 * max(0, CC#10-1)/126)).
- Amends GM2 (RP-024). Overrides all previous recommended practices (GM1, GM2, DLS1, DLS2).
- **Agent usability**: Look up pan formula, default values, and channel gain equations.
- Approved by MMA 08/02, AMEI 11/02.

### CA-031 CC#88 High Resolution Velocity Prefix Transformer (completed)
- Parsed controller message, abstract, background, usage rules, and compatibility from the 44-line single-page spec.
- Defines CC#88 (0x58) as High Resolution Velocity Prefix: format `Bn 58 vv`, where vv = lower 7 bits affixed to subsequent Note On/Off velocity.
- 14-bit resolution achieved by combining prefix (lower 7 bits) with Note On/Off velocity (upper 7 bits).
- Range: 0080H to 3FFFH (16,256 steps). Running Status compatibility maintained.
- Backward compatible: receivers that don't recognize CC#88 ignore it and use standard 7-bit velocity.
- **Agent usability**: Look up high-res velocity prefix format and usage rules.
- Source: AMEI MIDI 1.0 Board.

### RP-018 Response to Data Inc/Dec Controllers Transformer (completed)
- Parsed controllers, problems, recommendation, RPN/NRPN behavior, receiving rules, and example from the 54-line single-page spec.
- Defines behavior for Data Increment (CC#96, 0x60) and Data Decrement (CC#97, 0x61): value byte is "don't care".
- RPN 0,1: inc/dec LSB by 1. RPN 2,3,4: inc/dec MSB by 1. Future RPNs: default LSB by 1 if unspecified. NRPNs: manufacturer must specify.
- Receiving devices track current value, increment LSB by 1; if LSB unsupported, change on wrap to MSB.
- Example: 6-step hex sequence for incrementing pitch bend sensitivity by 2 cents on channel 1.
- **Agent usability**: Look up Data Inc/Dec controller behavior, RPN/NRPN increment rules, and example sequences.
- Approved by MMA 9/97, AMEI 10/97.

### RP-032 XMF Patch Type Prefix Meta-Event Transformer (completed)
- Parsed meta-event definition, 3 param values, usage rules, and SysEx relationship from the 53-line single-page spec.
- Defines SMF Meta-Event `FF 60 <len> <param>` (type 0x60) for XMF Patch Type Prefix.
- 3 params: 0x01 = GM1 (default, player-supplied), 0x02 = GM2 (player-supplied, fallback GM1), 0x03 = DLS (XMF-supplied).
- Usage: must appear as first message in SMF Track; ignored elsewhere. No reassignment after initial prefix.
- SysEx: GM1/GM2 System On, DLS On/Off, GM System Off must not appear in same track as prefix; ignored if they do.
- **Agent usability**: Look up XMF patch type prefix meta-event format, param values, and SysEx constraints.
- Date: October 10, 2001. AMEI/MMA.

### Standards that Incorporate MIDI Transformer (completed)
- Parsed 12 external standards entries from the 39-line reference page.
- Each entry has SDO, specification name, specification number, form of reference, and MMA references.
- SDOs: 1394TA (FireWire/AM824), 3GPP/ETSI (UMTS/SP-MIDI), CMIA (China keyboards), IEC (3 entries: AM824, Loudspeakers, Abridged MIDI 1.0), IEEE (AVB), IETF (RTP MIDI), ISO/IEC JTC1 (2 entries: VRML, MPEG4), Khronos (OpenSL ES), USB-IF (USB MIDI).
- Parsing challenge: pipe-separated table on a single line with SDO names merged into previous entry's MMA refs field.
- **Agent usability**: Look up which external standards incorporate MIDI and their MMA reference relationships.

### MIDI.org Overview Pages Transformer (completed)
- Generic transformer `midiOrgOverviewTransformer.js` handles the common MIDI.org overview page structure.
- Processed 3 pages: Key-Based Instrument Controllers (CA-23), Modulation Depth Range RPN (CA-26/RPN#05), Global Parameter Control (CA-24).
- Each JSON has: metadata, description, download_file (file_name, category, file_size), summary.
- Key-Based: standard method for key-based instrument performance control.
- Modulation Depth Range: RPN #05 scales CC#1 (Modulation Wheel) effective range.
- Global Parameter Control: Universal RT SysEx for editing global (non-channel-specific) parameters, with optional slot identification for object hierarchies.
- **Agent usability**: Look up overview descriptions and source PDF references for CA-23, CA-24, CA-26.

### CA-026 Modulation Depth Range RPN Transformer (completed)
- Parsed approval info, abstract, background, RPN details, and comment from the 49-line single-page spec.
- Defines RPN #05 (LSB=5, MSB=0) as Modulation Depth Range to scale CC#1 (Modulation Wheel) effective range.
- Message format: `Bn 64 05 65 00` — must be followed by Data Entry, Increment, Decrement per normal RPN rules.
- No default setting or definition given for Modulation Depth values — left to manufacturer discretion unless specified by an RP (e.g., GM2).
- Comment: default destination is Vibrato, but other parameters may be controlled via "Controller Destination Setting" message.
- **Agent usability**: Look up RPN #05 message format, modulation depth range behavior, and GM2 reference.
- Date of issue: 3/02/99. Originated by MMA. CA# 26.

### MIDI Tuning Updated Specification Transformer (completed)
- Parsed description, 3 incorporated specs, 3 message types, and scale/octave tuning description from the 56-line overview page.
- Incorporates: CA-020 (Bank/Dump Extensions), CA-021/RP-020 (Scale/Octave Extensions), RP-020 (Defaults for Scale/Octave Tuning).
- Message types: Bulk Tuning Dump Request (non-real-time), Bulk Tuning Dump (non-real-time), Single-note Tuning Change (real-time).
- Scale/Octave Tuning: micro-tuning repeated per octave, offsets from equal-tempered half-step by the cent.
- **Agent usability**: Look up MIDI tuning message types, incorporated specs, and scale/octave tuning description.

### RP-054 TRS Connectors with MIDI Devices Transformer (completed)
- Parsed abstract, background, 3 numbered details, notes, and approval info from the 64-line 2-page spec.
- Detail 1: Pin-out Correspondence — female TRS to female MIDI-DIN wiring, devices use female TRS connectors.
- Detail 2: Connector Size — 2.5mm TRS connectors recommended.
- Detail 3: Cables — shielded twisted pairs as defined for MIDI cable; male TRS to female MIDI-DIN adapter cable.
- Notes: MIDI In/Out circuitry per CA-033 (2014), protection circuitry advised, adapter cables max 2 meters, no audio equipment cables (not twisted pair).
- Approval: MMA 06/08/2018, AMEI 07/18/2018, originated by MMA, version 0.941.
- **Agent usability**: Look up TRS connector wiring, recommended size, cable specs, and approval dates.
- Parsing fix: numbered detail items `(2)` and `(3)` on page 2 were missed because `currentSection` had changed to `'notes'` — fixed by matching detail patterns regardless of current section.

### RP-015 Response to Reset All Controllers Transformer (completed)
- Parsed description, spec quote, background, 7 reset actions, 8 do-not-reset items, documentation, GM1 entry, global controllers, and approval from the 69-line single-page spec.
- Reset actions: Expression #11→127, Modulation #1→0, Pedals #64-67→0, RPN/NRPN LSB/MSB→127, pitch bender→center, channel pressure→0, polyphonic pressure→0.
- Do NOT reset: Bank Select, Volume, Pan, Program Change, Effect Controllers #91-95, Sound Controllers #70-79, channel mode messages #120-127, RPN/NRPN parameters.
- GM1 ON SysEx should perform equivalent of Reset All Controllers.
- Approval: MMA 11/98, AMEI 05/99.
- **Agent usability**: Look up which controllers are reset vs preserved by CC#121, GM1 entry behavior, and global controller guidance.
- Parsing fix: `"Global"` section header with straight quotes was being consumed by entering_gm1 section — fixed stop condition regex.

### Summary of MIDI 1.0 Messages Transformer (completed)
- Parsed 4 categories with 24 total messages from the 76-line reference table.
- Categories: Channel Voice (7 messages), Channel Mode (1 message with sub-commands), System Common (8 messages), System Real-Time (8 messages).
- Each message has status byte pattern, data byte(s), and description.
- Channel Mode entry includes sub-commands: All Sound Off (c=120), Reset All Controllers (c=121), Local Control (c=122), All Notes Off (c=123), Omni Mode Off/On (c=124/125), Mono Mode On (c=126), Poly Mode On (c=127).
- Includes warning about implementation details impacting compatibility.
- **Agent usability**: Look up MIDI 1.0 message status bytes, data bytes, and descriptions by category.

### Specs MIDI.org Index Page Transformer (completed)
- Parsed description, 6 reference tables, and 4 spec categories from the 102-line index page.
- Reference tables: Summary of MIDI 1.0 Messages, Expanded MIDI 1.0 Messages List, MIDI 1.0 Control Change Messages, MIDI 1.0 Universal SysEx, Standards that Incorporate MIDI, DLS Proprietary Chunk IDs.
- Spec categories: MIDI 2.0 (extension of MIDI 1.0, MIDI-CI architecture), MIDI 1.0 (1983, 5-pin DIN), MIDI Transports (alternate transports), File Formats (SMF, DLS, XMF, Mobile MIDI).
- **Agent usability**: Look up MIDI specification catalog, reference table list, and spec category descriptions.
- Parsing fix: `###` subheadings were being skipped by the header filter — changed to only skip `#` and `##` level headers.

### MIDIConnectionEvent MDN Transformer (completed)
- Built generic `mdnWebMidiTransformer.js` for all Web MIDI API MDN reference pages.
- Parsed description, availability, secure context, constructor, instance properties, examples, and specifications.
- MIDIConnectionEvent: event passed to statechange of MIDIAccess/MIDIPort; has `port` property (Read only, returns MIDIPort instance).
- Example: `navigator.requestMIDIAccess().then((access) => { access.onstatechange = ... })`.
- Secure context: yes. Limited availability (not Baseline).
- **Agent usability**: Look up Web MIDI API interface descriptions, properties, constructors, and code examples from MDN.
- Parsing fix: frontmatter lines were leaking into description — added frontmatter skip logic in main loop.

### MIDIInput MDN Transformer (completed)
- Reused generic `mdnWebMidiTransformer.js` for MIDIInput MDN page.
- MIDIInput: receives messages from a MIDI input port. Inherits properties/methods from MIDIPort (no specific ones).
- Event: `midimessage` — fired when port receives a MIDI message.
- Example: `inputs.forEach((input) => { input.onmidimessage = (message) => { console.log(message.data); }; })`.
- No constructor (inherits from MIDIPort).
- Fix: `### Events` subheading wasn't being detected — changed regex from `^## Events` to `^##+ Events`.

### MIDIOutput MDN Transformer (completed)
- Reused generic `mdnWebMidiTransformer.js` for MIDIOutput MDN page.
- MIDIOutput: provides methods to add messages to output queue and clear the queue. Inherits from MIDIPort.
- Instance methods: `send()` (queues a message to be sent), `clear()` (clears pending send data).
- Example: sends middle C (0x90, 60, 0x7f) on MIDI channel 1 via `output.send(noteOnMessage)`.
- No constructor, no specific properties (inherits from MIDIPort).

### RP-017 SMF Lyric Meta Event Definition Transformer (completed)
- Parsed description, 7 numbered rules, example with 20+ Lyric Meta Event entries, 3 additional recommendations, accepted/reserved characters, and approval from the 111-line 2-page spec.
- Rules: (1) each syllable is individual event, (2) space as word delimiter, (3) punctuation placement, (4) CR as end-of-line, (5) LF as end-of-paragraph, (6) hyphenation guidelines, (7) melisma event (empty Lyric Meta Event).
- Additional recommendations: first event placement at bar 1 beat 1, max 40 chars before CR, reserved ASCII chars for future escape codes.
- Accepted chars: A-Z, a-z, 0-9, punctuation, SPACE, CR, LF. Reserved: `\ [ ] { }`.
- Approval: MMA 11/14/97, AMEI 10/3/97.
- **Agent usability**: Look up SMF lyric event formatting rules, character sets, and example sequences.

### MIDIMessageEvent MDN Transformer (completed)
- Reused generic `mdnWebMidiTransformer.js` for MIDIMessageEvent MDN page.
- MIDIMessageEvent: event passed to `midimessage` event of MIDIInput. Fired when a MIDI message is sent from a device.
- Constructor: `MIDIMessageEvent()` — creates new instance.
- Instance property: `data` — Uint8Array containing data bytes of a single MIDI message.
- No specific methods (inherits from Event).
- Example: `navigator.requestMIDIAccess().then((midiAccess) => { Array.from(midiAccess.inputs).forEach(...) })`.

### MIDIAccess MDN Transformer (completed)
- Reused generic `mdnWebMidiTransformer.js` for MIDIAccess MDN page.
- MIDIAccess: provides methods for listing MIDI input/output devices and obtaining access. Transferable object.
- 3 instance properties: `inputs` (Read only, MIDIInputMap), `outputs` (Read only, MIDIOutputMap), `sysexEnabled` (Read only, boolean for SysEx support).
- Event: `statechange` — fired when a new MIDI port is added or existing port changes state.
- Example: `navigator.requestMIDIAccess().then((access) => { access.onstatechange = ... })`.
- No constructor.

### Work Remaining
- ~3 raw markdown documents remain untransformed. Major ones: XMF (300KB), DLS 2.1 (mdls-public, 3418 lines), more Web MIDI MDN pages, plus RP/CA documents.
- The project has 79 structured JSON outputs so far, covering the most commonly referenced MIDI specs.
