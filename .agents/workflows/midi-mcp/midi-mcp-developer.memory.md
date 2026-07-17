# MIDI MCP Developer: Persistent Memory

This file is the persistent ledger for the "MIDI MCP Developer" agent.
Read this file at the start of your run, and update it at the end of your run.

## Goal
Transform the raw, unstructured markdown in `midi-mcp/data/` into pristine, strongly-typed JSON data via programmatic transformers, making this the best MIDI MCP server ever.

## Progress Checklist
- `[x]` Setup `midi-mcp/lib/transformers/` and `midi-mcp/data/structured/` directories.
- `[x]` Transformer: Control Change Messages (`control-change-messages-data-bytes.md` -> `cc-messages.json`)
- `[x]` Transformer: Universal SysEx Messages (`universal-system-exclusive-messages.md` -> `universal-sysex.json`)
- `[x]` Transformer: SysEx ID Table (`sysex-id-table-midi-org.md` -> `sysex-ids.json`)
- `[x]` Transformer: MIDI 1.0 Status Bytes (`reference/status-bytes.md` -> `status-bytes.json`)
- `[x]` Transformer: MIDI 2.0 UMP Quick Reference (`reference/midi2-ump-quick-reference.md` -> `midi2-ump.json`)
- `[x]` Transformer: MIDI 1.0 vs MIDI 2.0 Comparison (`reference/midi1-vs-midi2.md` -> `midi1-vs-midi2.json`)
- `[x]` Transformer: CA-018 File Reference SysEx (`data/ca18.md` -> `ca18-file-reference.json`)
- `[x]` Transformer: CA-019 Sample Dump Extensions (`data/ca19.md` -> `ca19-sample-dump.json`)
- `[x]` Transformer: Expanded MIDI 1.0 Messages List (`data/expanded-midi-1-0-messages-list-midi-org.md` -> `expanded-messages.json`)
- `[x]` Transformer: Summary of MIDI 1.0 Messages (`data/summary-of-midi-1-0-messages-midi-org.md` -> `summary-messages.json`)
- `[x]` Transformer: CA-022 Controller Destination Setting (`data/ca22-controller-destination-sysex-message.md` -> `ca22-controller-destination.json`)
- `[x]` Transformer: CA-024 Global Parameter Control (`data/ca24-global-parameter-control-sysex-message.md` -> `ca24-global-parameter-control.json`)
- `[x]` Transformer: CA-023 Key-Based Instrument Controllers (`data/ca23-key-based-instrument-controller-sysex-message.md` -> `ca23-key-based-instrument-controllers.json`)
- `[x]` Transformer: CA-025 Master Fine/Coarse Tuning (`data/ca25-master-fine-coarse-tuning-sysex-message.md` -> `ca25-master-fine-coarse-tuning.json`)
- `[x]` Transformer: CA-028 Extension 00-01 to File Reference SysEx (`data/ca28.md` -> `ca28-extension-file-reference.json`)
- `[x]` Transformer: MIDI Tuning Updated Specification (`data/midi-tuning-updated-specification.md` -> `midi-tuning-updated.json`)
- `[x]` Transformer: MIDI 1.0 Control Change Messages (`data/midi-1-0-control-change-messages-data-bytes-midi-org.md` -> `control-change-messages.json`)
- `[x]` Transformer: SysEx ID Table (`data/sysex-id-table-midi-org.md` -> `syex-id-table.json`)
- `[x]` Transformer: Default Control Change Mapping Profile (`data/m2-113-um-default-control-change-mapping-profile.md` -> `default-cc-mapping-profile.json`)
- `[x]` Transformer: Default Drum Note Map Profile (`data/m2-125-um-default-drum-note-map-profile.md` -> `default-drum-note-map-profile.json`)
- `[x]` Transformer: MIDI 2.0 Bit Scaling and Resolution (`data/m2-115-u-midi-2-0-bit-scaling-and-resolution.md` -> `bit-scaling-and-resolution.json`)
- `[x]` Transformer: Mobile Phone Control Message RP-046 (`data/rp46public.md` -> `mobile-phone-control.json`)
- `[x]` Transformer: DLS Proprietary Chunk IDs (`data/dls-proprietary-chunk-ids-midi-org.md` -> `dls-proprietary-chunk-ids.json`)
- `[x]` Transformer: CC#88 High Resolution Velocity Prefix CA-031 (`data/ca31.md` -> `ca31-high-res-velocity-prefix.json`)
- `[x]` Transformer: Modulation Depth Range RPN CA-026 (`data/ca26-rpn05-modulation-depth-range.md` -> `ca26-modulation-depth-range.json`)
- `[x]` Transformer: Three Dimensional Sound Controllers RP-049 (`data/rp49public.md` -> `three-d-sound-controllers.json`)
- `[x]` Transformer: MIDI Implementation Chart V2 RP-028 (`data/midi-chart-v2.md` -> `midi-implementation-chart-v2.json`)
- `[x]` Transformer: Mobile Musical Interface RP-048/amd1 (`data/rp48amd1-spec.md` -> `mobile-musical-interface.json`)
- `[x]` Transformer: MIDI over IEEE-1394 RP-027 (`data/rp27v10-spec.md` -> `midi-over-ieee-1394.json`)
- `[x]` Transformer: General MIDI Level 2 RP-024 (`data/general-midi-level-2-07-2-6-1-2a.md` -> `general-midi-level-2.json`)
- `[x]` Transformer: Property Exchange Controller Resources M2-117-UM (`data/m2-117-um-property-exchange-controller-resources.md` -> `property-exchange-controller-resources.json`)
- `[x]` Transformer: Note-On Orchestral Articulation Profile M2-123-UM (`data/m2-123-um-note-on-orchestral-articulation-profile.md` -> `note-on-orchestral-articulation-profile.json`)
- `[x]` Transformer: Rotary Speaker Profile M2-122-UM (`data/m2-122-um-rotary-speaker-profile.md` -> `rotary-speaker-profile.json`)
- `[x]` Transformer: Drawbar Organ Profile M2-121-UM (`data/m2-121-um-drawbar-organ-profile.md` -> `drawbar-organ-profile.json`)
- `[x]` Transformer: MPE Profile M2-120-UM (`data/m2-120-um-midi-polyphonic-expression-profile.md` -> `mpe-profile.json`)
- `[x]` Transformer: GM2 Function Block Profile M2-118-UM (`data/m2-118-um-general-midi-2-function-block-profile.md` -> `gm2-function-block-profile.json`)
- `[x]` Transformer: GM2 Single Channel Profile M2-119-UM (`data/m2-119-um-general-midi-2-single-channel-profile.md` -> `gm2-single-channel-profile.json`)
- `[x]` Transformer: GM1 System Level 1 RP-003 (`data/rp-003-general-midi-system-level-1-specification-96-1-4-0-1.md` -> `gm1-system-level-1.json`)
- `[x]` Transformer: SP-MIDI RP-034/RP-035 (`data/spmidi-all-1-0b.md` -> `sp-midi.json`)
- `[x]` Transformer: General MIDI Lite RP-033 (`data/gml-v1.md` -> `gml.json`)
- `[x]` Transformer: BLE-MIDI RP-052 (`data/ble-midi-specification.md` -> `ble-midi.json`)
- `[x]` Transformer: USB-MIDI 1.0 Device Class (`data/usb-midi-1-0-device-class.md` -> `usb-midi-1-0.json`)
- `[x]` Transformer: USB-MIDI 2.0 Device Class (`data/usb-midi-2-0-device-class.md` -> `usb-midi-2-0.json`)
- `[x]` Transformer: DLS Level 1 Specification (`data/dls1v11b.md` -> `dls1.json`)
- `[x]` Transformer: DLS Level 2.2 Specification (`data/dls2amd2-all-a-pub.md` -> `dls2.json`)
- `[x]` Transformer: MIDI 1.0 Detailed Specification (`data/m1-midi-1-0-detailed-specification.md` -> `midi1.json`)
- `[x]` Transformer: RTP-MIDI RFC 6295 (`data/rfc6295-rtp-midi.md` -> `rtp-midi.json`)
- `[x]` Transformer: UMP/MIDI 2.0 Protocol M2-104-UM (`data/m2-104-um-ump-and-midi-2-0-protocol-specification.md` -> `ump-midi2-protocol.json`)
- `[x]` Transformer: MIDI-CI M2-101-UM (`data/m2-101-um-midi-ci-specification.md` -> `midi-ci.json`)
- `[x]` Transformer: Property Exchange M2-103-UM (`data/m2-103-um-common-rules-for-midi-ci-property-exchange.md` -> `property-exchange.json`)
- `[x]` Transformer: SMF RP-001 (`data/rp-001-v1-0-standard-midi-files-specification-96-1-4.md` -> `smf.json`)
- `[x]` Transformer: MSC RP-002-014 (`data/rp-002-014-v1-1-1-midi-show-control-specification-96-1-4.md` -> `msc.json`)
- `[x]` Transformer: MMC RP-013 (`data/rp-013-v1-0-midi-machine-control-specification-96-1-4.md` -> `mmc.json`)
- `[x]` Transformer: MTC RP-004-008 (`data/rp-004-008-v4-2-1-midi-time-code-specification-96-1-4.md` -> `mtc.json`)
- `[x]` Transformer: MIDI Clip File M2-116-U (`data/m2-116-u-midi-clip-file-specification.md` -> `midi-clip-file.json`)
- `[x]` Transformer: Network MIDI 2.0 UDP M2-124-UM (`data/m2-124-um-v1-0-1-network-midi-2-0-udp.md` -> `network-midi.json`)
- `[x]` Transformer: RP-019 SMF Device/Program Name Meta Events (`data/rp19-smf-device-program-name-meta-events.md` -> `rp19.json`)
- `[x]` Transformer: RP-022 Redefinition of RPN 01/02 (`data/rp22.md` -> `rp22.json`)
- `[x]` Transformer: RP-023 Renaming of CC91 and CC93 (`data/rp23.md` -> `rp23.json`)
- `[x]` Transformer: RP-021 Sound Controller Defaults (`data/rp21.md` -> `rp21.json`)
- `[x]` Transformer: RP-036 Default Pan Formula (`data/rp36.md` -> `rp36.json`)
- `[x]` Transformer: CA-031 CC#88 High Resolution Velocity Prefix (`data/ca31.md` -> `ca31.json`)
- `[x]` Transformer: RP-018 Response to Data Inc/Dec Controllers (`data/rp18.md` -> `rp18.json`)
- `[x]` Transformer: RP-032 XMF Patch Type Prefix Meta-Event (`data/rp32-xmf-patch-prefix-meta-event.md` -> `rp32.json`)
- `[x]` Transformer: Standards that Incorporate MIDI (`data/standards-that-incorporate-midi-midi-org.md` -> `standards-that-incorporate-midi.json`)
- `[x]` Transformer: Key-Based Instrument Controllers overview (`data/key-based-instrument-controllers-midi-org.md` -> `key-based-instrument-controllers-midi-org.json`)
- `[x]` Transformer: Modulation Depth Range RPN overview (`data/modulation-depth-range-rpn-midi-org.md` -> `modulation-depth-range-rpn-midi-org.json`)
- `[x]` Transformer: Global Parameter Control overview (`data/global-parameter-control-midi-org.md` -> `global-parameter-control-midi-org.json`)
- `[x]` Transformer: CA-026 Modulation Depth Range RPN (`data/ca26-rpn05-modulation-depth-range.md` -> `ca26.json`)
- `[x]` Transformer: MIDI Tuning Updated Specification overview (`data/midi-tuning-updated-specification-midi-org.md` -> `midi-tuning-updated-specification-midi-org.json`)
- `[x]` Transformer: RP-054 TRS Connectors with MIDI Devices (`data/rp54-specification-for-use-of-trs-connectors-with-midi-devices.md` -> `rp54.json`)
- `[x]` Transformer: RP-015 Response to Reset All Controllers (`data/rp15.md` -> `rp15.json`)
- `[x]` Transformer: Summary of MIDI 1.0 Messages (`data/summary-of-midi-1-0-messages-midi-org.md` -> `summary-of-midi-1-0-messages-midi-org.json`)
- `[x]` Transformer: MIDI.org Specs index page (`data/specs-midi-org.md` -> `specs-midi-org.json`)
- `[x]` Transformer: MIDIConnectionEvent MDN (`data/web-midi-midiconnectionevent-mdn.md` -> `web-midi-midiconnectionevent-mdn.json`)
- `[x]` Transformer: MIDIInput MDN (`data/web-midi-midiinput-mdn.md` -> `web-midi-midiinput-mdn.json`)
- `[x]` Transformer: MIDIOutput MDN (`data/web-midi-midioutput-mdn.md` -> `web-midi-midioutput-mdn.json`)
- `[x]` Transformer: RP-017 SMF Lyric Meta Event Definition (`data/rp17-smf-lyric-events-definition.md` -> `rp17.json`)
- `[x]` Transformer: MIDIMessageEvent MDN (`data/web-midi-midimessageevent-mdn.md` -> `web-midi-midimessageevent-mdn.json`)
- `[x]` Transformer: MIDIAccess MDN (`data/web-midi-midiaccess-mdn.md` -> `web-midi-midiaccess-mdn.json`)
- *(Add more documents here as you discover them)*

## Designed Schemas

### DLS Level 2.2 Schema

```json
{
  "metadata": { "title": "string", "doc_id": "DLS-2", "protocol": "midi1", "version": "string", "date": "YYYY-MM" },
  "note_exclusivity": [{ "mode": "string", "retrigger_behavior": "string", "release_behavior": "string", "required_channels": "string" }],
  "modulation_routes": [{ "section": "string", "articulator_name": "string", "source": "string", "source_bipolar": "boolean", "source_invert": "boolean", "source_transform": "string", "control": "string", "control_bipolar": "boolean", "control_invert": "boolean", "control_transform": "string", "destination": "string" }],
  "connection_defaults": [{ "section": "string", "articulator": "string", "default_value": "string", "min_value": "string", "max_value": "string", "units": "string" }],
  "dls_system_messages": [{ "name": "string", "message": "string", "bytes": [{ "byte": "string", "description": "string" }] }],
  "riff_definitions": [{ "chunk": "string", "definition": "string" }],
  "level1_connection_constants": [{ "value": "string", "name": "string", "description": "string", "category": "string" }],
  "level2_connection_constants": [{ "value": "string", "name": "string", "description": "string", "category": "string" }],
  "summary": { "..._count": "number" }
}
```

**Schema notes:** Preserve extracted values as strings, including hexadecimal constants and text units. Model routing flags as booleans, group semantically related rows with their source-table section, and retain byte-level SysEx descriptions so the data supports code generation and conformance validation.

### Example: CC Messages Schema
```json
{
  "metadata": {
    "title": "Control Change Messages and RPNs",
    "version": "1.0.0",
    "source": "control-change-messages-data-bytes.md"
  },
  "control_changes": [
    {
      "cc_number": 74,
      "hex": "4A",
      "binary": "01001010",
      "name": "Sound Controller 5 (default: Brightness)",
      "range": "0-127",
      "type": "LSB"
    }
  ]
}
```

### Universal SysEx Messages Schema
```json
{
  "metadata": {
    "title": "Universal System Exclusive Messages",
    "version": "1.0.0",
    "source": "universal-system-exclusive-messages.md"
  },
  "categories": [
    {
      "type": "non_real_time",
      "sysex_id": "7E",
      "messages": [
        {
          "sub_id_1": "00",
          "sub_id_2": null,
          "description": "Unused",
          "children": []
        },
        {
          "sub_id_1": "04",
          "sub_id_2": "nn",
          "description": "MIDI Time Code",
          "children": [
            {
              "sub_id_2": "00",
              "description": "Special"
            },
            {
              "sub_id_2": "01",
              "description": "Punch In Points"
            }
          ]
        },
        {
          "sub_id_1": "7B",
          "sub_id_2": null,
          "description": "End of File",
          "children": []
        }
      ]
    },
    {
      "type": "real_time",
      "sysex_id": "7F",
      "messages": [
        {
          "sub_id_1": "0A",
          "sub_id_2": "01",
          "description": "Key-based Instrument Control",
          "children": []
        }
      ]
    }
  ]
}
```

**Schema notes:**
- `sub_id_2` for parent messages: `null` (none, was `--`), `"nn"` (variable), or specific hex like `"01"` (fixed)
- `sub_id_2` for children: specific hex like `"00"` or range like `"00-7F"`
- `children` array is empty for standalone entries (no `nn` sub-ID #2)
- Non-Real Time: 19 parent messages, 51 children total
- Real Time: 13 parent messages, 36 children total

### SysEx ID Table Schema
```json
{
  "metadata": {
    "title": "SysEx ID Table",
    "version": "1.0.0",
    "source": "sysex-id-table-midi-org.md"
  },
  "groups": [
    {
      "name": "Assigned Manufacturer MIDI SysEx ID Numbers",
      "id_type": "one_byte",
      "entries": [
        {
          "id_hex": "00H",
          "id": "00",
          "company": "[Used for ID Extensions]"
        },
        {
          "id_hex": "40H to 5FH",
          "id_range": ["40", "5F"],
          "company": "[Assigned by AMEI for Japanese Manufacturers]"
        }
      ]
    },
    {
      "name": "Standard Three-Byte IDs",
      "id_type": "three_byte",
      "entries": [
        {
          "id_hex": "00H 00H 01H",
          "id_bytes": ["00", "00", "01"],
          "company": "Time/Warner Interactive"
        }
      ]
    },
    {
      "name": "European & Asian Group",
      "id_type": "three_byte",
      "entries": [
        {
          "id_hex": "00H 20H 00H",
          "id_bytes": ["00", "20", "00"],
          "company": "Dream SAS"
        }
      ]
    },
    {
      "name": "Japanese (AMEI) Group",
      "id_type": "mixed",
      "entries": [
        {
          "id_hex": "41H",
          "id": "41",
          "company": "Roland Corporation"
        },
        {
          "id_hex": "00H 40H 00H",
          "id_bytes": ["00", "40", "00"],
          "company": "Crimson Technology Inc."
        }
      ]
    },
    {
      "name": "Japanese (AMEI) SysEx Id Holders",
      "id_type": "three_byte",
      "entries": [
        {
          "id_hex": "00H 48H 00H",
          "id_bytes": ["00", "48", "00"],
          "company": "sigboost Inc."
        }
      ]
    }
  ]
}
```

**Schema notes:**
- 5 groups: 1-byte (66 entries), Standard 3-byte (~371 entries), European & Asian 3-byte (~312 entries), Japanese AMEI mixed (~30 entries), Japanese AMEI SysEx Holders (9 entries)
- 1-byte entries use `id` field; 1-byte ranges use `id_range` array; 3-byte entries use `id_bytes` array
- `id_hex` preserves the original human-readable hex notation (e.g. "00H", "00H 00H 01H", "40H to 5FH")
- Source data has known duplicates (00H 00H 01H appears twice, 00H 48H 00H appears twice) and gaps (00H 01H 07H missing, 00H 02H 67H missing, 00H 22H 10H missing, 00H 21H 5FH missing) — preserved as-is from source

### MIDI 1.0 Status Bytes Schema
```json
{
  "metadata": {
    "title": "MIDI 1.0 Status Byte Quick Reference",
    "version": "1.0.0",
    "source": "status-bytes.md"
  },
  "categories": [
    {
      "name": "channel_voice",
      "description": "Channel Voice Messages",
      "messages": [
        {
          "status": "0x8n",
          "message": "Note Off",
          "total_bytes": 3,
          "data_byte_1": "Note number (0–127)",
          "data_byte_2": "Release velocity"
        }
      ]
    },
    {
      "name": "system_common",
      "description": "System Common Messages",
      "messages": [
        {
          "status": "0xF0",
          "message": "System Exclusive start",
          "total_bytes": "variable",
          "data": "Manufacturer ID, then data bytes until 0xF7"
        }
      ]
    },
    {
      "name": "system_real_time",
      "description": "System Real-Time Messages",
      "messages": [
        {
          "status": "0xF8",
          "message": "Timing Clock",
          "notes": "24 pulses per quarter note (fixed)"
        }
      ]
    }
  ],
  "parsing_rules": [
    "Running status: after a channel-message status byte...",
    "System Real-Time bytes (0xF8–0xFF) may appear between...",
    "Data bytes without a preceding status byte..."
  ]
}
```

**Schema notes:**
- 3 categories: channel_voice (8 messages), system_common (8 messages), system_real_time (8 messages)
- Channel voice entries have `data_byte_1` and `data_byte_2` fields
- System common entries have `data` field (single column)
- System real-time entries have `notes` field (single column)
- `total_bytes` is numeric for fixed-size messages, string "variable" for SysEx
- Reserved/undefined entries have `total_bytes: null` and appropriate placeholder text
- Parsing rules are extracted as an array of strings from the "## Parsing rules" section

## Current TODO
1. MIDIAccess MDN transformer is **complete** (21 tests passing, JSON output generated at `data/structured/web-midi-midiaccess-mdn.json`). Reused generic `mdnWebMidiTransformer.js`.
2. Find and process the next untransformed MIDI specification document. Remaining candidates: XMF (300KB), DLS 2.1 (mdls-public, 3418 lines), more Web MIDI MDN pages (midiport, etc.), plus RP/CA documents (ca22, ca28, rp27, rp46, rp48, rp49, rp50).

### RP-019 Schema

```json
{
  "metadata": { "title": "Recommended Practice (RP-019) SMF Device Name and Program Name Meta Events", "doc_id": "RP-019", "protocol": "midi1", "pages": 1, "source": "string", "summary": "string" },
  "meta_events": [
    { "meta_event_type": "0x09", "format": "FF 09 len text", "label": "DEVICE NAME", "name": "Device Name Meta Event", "description": "The Device Name is the name of the device..." },
    { "meta_event_type": "0x08", "format": "FF 08 len text", "label": "PROGRAM NAME", "name": "Program Name Meta Event", "description": "One purpose of this event is to aid in reorchestration..." }
  ],
  "usage_rules": ["Each track of a MIDI File can contain one MIDI stream...", "Since a Type 0 Standard MIDI File has only one track..."],
  "device_naming_recommendations": ["There are many ways MIDI Files are used...", "When MIDI Files are authored for widespread distribution..."],
  "approval": { "mma_date": "4/10/98", "amei_date": "5/7/99", "copyright": "1999" },
  "summary": { "meta_event_count": 2, "usage_rule_count": 6, "device_naming_recommendation_count": 13 }
}
```

**Schema notes:**
- 64-line single-page document defining two SMF Meta Events
- Device Name (0x09): Names the target device for a track; one per track, at beginning before events
- Program Name (0x08): Names the program referenced by following bank select/program change; can appear multiple times
- Usage rules for Type 0 (single track, single device) and Type 1 (multi-track, one device per track)
- Device naming recommendations for single-user, cross-computer, and widespread distribution scenarios
- Approved by MMA 4/10/98, AMEI 5/7/99

### Network MIDI 2.0 (UDP) Schema (M2-124-UM v1.0.1)

```json
{
  "metadata": { "title": "User Datagram Protocol for Universal MIDI Packets Network MIDI 2.0 (UDP)", "doc_id": "M2-124-UM", "protocol": "midi2", "version": "1.0.1", "pages": 56, "source": "string", "summary": "string" },
  "version_history": [{ "date": "2024-11-20", "version": "1.0", "changes": "Initial release" }],
  "definitions": [{ "term": "AMEI", "definition": "Association of Musical Electronics Industry..." }],
  "conformance_words": [{ "word": "shall", "reserved_for": "Statements of requirement", "relation": "Mandatory...", "category": "required|descriptive" }],
  "normative_references": [{ "reference": "[RFC768]", "description": "User Datagram Protocol (UDP)..." }],
  "dns_records": {
    "ptr": [{ "field": "Service Type", "value": "_midi2._udp.local", "description": "The registered service type..." }],
    "srv": [{ "field": "Port", "value": "16-bit number", "description": "The UDP port number..." }],
    "txt": [{ "field": "UMPEndpointName", "value": "", "description": "The UMP Endpoint Name of the Host..." }]
  },
  "signature": { "value": "0x4D494449", "ascii": "MIDI", "size_bytes": 4, "description": "All UDP packets shall start with..." },
  "command_packet_header": { "fields": [{ "field": "Command Code", "size_bytes": 1, "description": "" }, { "field": "Command Payload Length", "size_bytes": 1, "description": "Length in 32-bit words..." }, { "field": "Command Specific Data", "size_bytes": 2, "description": "" }] },
  "commands": [{ "code": "0xFF", "name": "UMP Data", "direction": "both", "section": "7.1" }],
  "session_states": [{ "state": "Idle", "description": "Device may be aware of each other..." }],
  "commands_per_session_state": [{ "state": "Every State", "valid_commands": ["NAK", "Ping", "Ping Reply", "Bye"] }],
  "command_tables": { "table_10": { "table_number": 10, "name": "Invitation", "fields": [{ "field": "Command Code", "size_bytes": "1", "values": "0x01", "description": "" }] } },
  "nak_reasons": [{ "code": "0x00", "reason": "Other", "description": "The Text Message field..." }],
  "bye_reasons": [{ "code": "0x00", "reason": "Unknown or Undefined", "description": "" }, { "code": "", "reason": "— Sent by Either Client or Host —", "description": "category header" }],
  "error_reasons": [{ "code": "0x00", "reason": "Unknown", "description": "" }],
  "authentication_states": [{ "code": "0x00", "description": "First authentication request" }],
  "summary": { "version_history_count": 2, "definition_count": 39, "conformance_word_count": 7, "normative_reference_count": 14, "dns_record_count": 15, "command_count": 17, "session_state_count": 6, "command_table_count": 18, "nak_reason_count": 5, "bye_reason_count": 18, "error_reason_count": 2 }
}
```

**Schema notes:**
- 1844-line document with YAML frontmatter (title, docId, version, protocol, source, pages, summary)
- Defines UDP transport for UMP/MIDI 2.0 over IP networks (LAN, Ethernet, WiFi)
- 17 command codes (0xFF UMP Data, 0x01-0x03 Invitations, 0x10-0x13 Invitation Replies, 0x20-0x21 Ping, 0x80-0x83 Retransmit/Reset, 0x8F NAK, 0xF0-0xF1 Bye)
- 6 session states (Idle, Pending Invitation, Authentication Required, Established Session, Pending Session Reset, Pending Bye)
- 18 command field tables (Tables 10-14, 16, 18-24, 26, 28-31) with per-field size/values/description
- 5 NAK reasons, 18 Bye reasons (with 3 category headers), 2 error reasons
- 5 authentication state values (from Tables 15 and 17)
- DNS-SD discovery: PTR/SRV/TXT records for _midi2._udp.local service
- 4-byte signature "MIDI" (0x4D494449) at start of every UDP packet
- Command packet header: 4 bytes (Command Code 1B, Payload Length 1B, Specific Data 2B)
- Key parsing challenges: single-space separated table fields (not tab), multi-line cell wrapping, section boundaries between command tables (6.x headers), TOC entries with dots filtered, known field/reason name matching for single-space format

### MIDI Clip File (M2-116-U) Schema

```json
{
  "metadata": { "title": "MIDI Clip File Specification (SMF2CLIP)", "doc_id": "M2-116-U", "protocol": "midi2", "version": "1.0", "pages": 24, "source": "string", "summary": "string" },
  "version_history": [{ "date": "string", "version": "string", "changes": "string" }],
  "definitions": [{ "term": "string", "definition": "string" }],
  "conformance_words": [{ "word": "string", "reserved_for": "string", "relation": "string", "category": "required|descriptive" }],
  "normative_references": [{ "reference": "[MA01]", "description": "string" }],
  "smf_types": [{ "number": 1, "name": "Type 0", "description": "string" }],
  "file_header": { "format": "SMF2CLIP", "byte_count": 8, "bytes": [{ "byte_index": 1, "hex": "0x53", "text": "S" }] },
  "file_structure": [{ "number": 1, "name": "File Header", "description": "string" }],
  "dctpq": { "name": "string", "description": "string" },
  "dcs": { "name": "string", "description": "string" },
  "max_times_table": [{ "row": ["string"] }],
  "clip_configuration_header": { "name": "string", "sections": [{ "name": "string", "description": "string" }], "description": "string" },
  "clip_sequence_data": { "name": "string", "sections": [{ "name": "string", "description": "string" }], "description": "string" },
  "useful_midi_messages": ["string"],
  "summary": { "version_history_count": 1, "definition_count": 22, "conformance_word_count": 7, "normative_reference_count": 6, "smf_type_count": 5, "file_header_byte_count": 8, "file_structure_section_count": 3, "max_times_table_rows": 7, "useful_midi_message_count": 20 }
}
```

**Schema notes:**
- 591-line document with YAML frontmatter (title, docId, version, protocol, source, pages, summary)
- Defines the MIDI Clip File format (SMF2CLIP) for storing UMP/MIDI 2.0 data as clips
- 3 file sections: File Header (8 bytes "SMF2CLIP"), Clip Configuration Header (UMP messages for receiver setup), Clip Sequence Data (UMP messages with Delta Clockstamps)
- SMF types: 5 entries covering legacy Type 0/1/2 and new MIDI Clip File / MIDI Container File
- 22 definitions covering MIDI 2.0 terminology (UMP, Group, Profile, MIDI-CI, etc.)
- 7 conformance words (shall/should/may = required; must/will/can/might = descriptive)
- 6 normative references [MA01]-[MA06]
- Max times table: 7 rows showing maximum time addressable at various tempos and tick rates
- Clip Configuration Header has 5 sub-sections (timing, tempo, time signature, profile config, other messages, PE exclusion)
- Clip Sequence Data has 6 sub-sections (start of clip, set tempo, set time signature, pickup bars, MIDI data, end of clip)
- 20 useful MIDI messages listed in Appendix B (Set Tempo, Set Time Signature, Project Name, Lyrics, etc.)
- Key parsing: frontmatter parsed via YAML; SMF types found in section 1.2 Background (before section 2 header); max times table requires filtering label rows and section headers

### MTC (RP-004-008) Schema

```json
{
  "metadata": { "title": "MIDI Time Code", "doc_id": "RP-004-008", "protocol": "midi1", "version": "4.2.1", "date": "1996-01", "source": "string" },
  "quarter_frame_types": [{ "type": 0, "description": "string" }],
  "bit_field_assignments": [{ "field": "string", "bit_pattern": "string", "bit_descriptions": [{ "bits": "string", "description": "string" }] }],
  "smpte_types": [{ "code": "string", "description": "string" }],
  "full_message": { "format": "string", "byte_count": 10, "fields": [{ "byte": "string", "description": "string" }] },
  "user_bits_message": { "format": "string", "byte_count": 15, "fields": [{ "byte": "string", "description": "string" }] },
  "mtc_cueing_setup_types": [{ "hex": "string", "name": "string" }],
  "special_subtypes": [{ "hex": "string", "name": "string", "description": "string" }],
  "realtime_cueing_setup_types": [{ "hex": "string", "name": "string" }],
  "signal_path_modes": [{ "mode": "string", "description": "string" }],
  "quarter_frame_example": [{ "message": "string", "note": "string" }],
  "summary": { "quarter_frame_type_count": 8, "bit_field_assignment_count": 4, "smpte_type_count": 4, "mtc_cueing_setup_type_count": 15, "special_subtype_count": 16, "realtime_cueing_setup_type_count": 15, "signal_path_mode_count": 4, "quarter_frame_example_count": 8 }
}
```

**Schema notes:**
- 502-line document, clean structure with tab-separated field descriptions
- Quarter frame types: 8 types (0-7) encoding SMPTE time digits as nibbles
- Bit field assignments: 4 fields (FRAME, SECONDS, MINUTES, HOURS COUNT) with bit patterns and descriptions
- SMPTE types: 4 frame rates (24, 25, 30 drop, 30 non-drop fps)
- Full message: 10-byte Universal Real Time SysEx for complete time code
- User bits message: 15-byte SysEx for SMPTE user bits
- MTC cueing setup types: 15 types (00-0E) for non-real-time cueing
- Special subtypes: 16 entries including special sub-types (00 00 through 05 00) and type descriptions (01/02, 03/04, etc.)
- Realtime cueing setup types: 15 types (00-0E) for real-time cueing (subset with Reserved entries)
- Signal path modes: 4 modes (PLAY, CUE, FAST FORWARD/REWIND, SHUTTLE)
- Quarter frame example: 8 messages encoding time 01:37:52:16
- Key parsing challenges: FAST FORWARD/REWIND MODE split across two lines; page number lines mixed with field data; continuation lines in cueing descriptions filtered by requiring uppercase name start

### MMC (RP-013) Schema

```json
{
  "metadata": { "title": "MIDI Machine Control", "doc_id": "RP-013", "protocol": "midi1", "version": "1.0", "date": "1996-01", "source": "string" },
  "message_types": [{ "abbreviation": "string", "description": "string" }],
  "abbreviations": [{ "abbreviation": "string", "description": "string" }],
  "commands": [{ "hex": "string", "name": "string", "type": "string", "data_bytes": "string", "guideline_min_sets": "string" }],
  "information_fields": [{ "hex": "string", "name": "string", "type": "string", "data_bytes": "string", "read_write": "string", "guideline_min_sets": "string" }],
  "command_descriptions": [{ "hex": "string", "name": "string", "description": "string" }],
  "field_descriptions": [{ "hex": "string", "name": "string", "description": "string" }],
  "summary": { "message_type_count": 10, "abbreviation_count": 6, "command_count": 24, "information_field_count": 18, "command_description_count": 32, "field_description_count": 59 }
}
```

**Schema notes:**
- 11042-line document, heavily OCR-fragmented with tab-separated tables broken across lines
- Section detection requires tab character AND page > 10 (TOC on pages 3-4 uses same format)
- Message types: 10 categories (Comm, Ctrl, Evnt, Gen, I/O, Sync, Math, MTC, Proc, Time)
- Abbreviations: 6 (ATR, MCP, MCS, MMC, r, RW)
- Commands index: 24 entries (STOP, PLAY, DEFERRED PLAY, FAST FORWARD, REWIND, RECORD STROBE, etc.)
- Information fields index: 18 entries (SELECTED TIME CODE, SIGNATURE, RESPONSE ERROR, etc.)
- Command descriptions: 32 entries with descriptions (text appears BEFORE hex marker, accumulated then assigned)
- Field descriptions: 59 entries with descriptions
- Hex marker regex requires tab: `^[0-9A-Fa-f]{2}\s\t(.+)$` — some OCR-fragmented entries (e.g., "0 4 \tFAST FORWARD") are missed
- Commands index relaxed to 3 parts minimum (some entries lack data_bytes/min_sets columns)

### MSC (RP-002-014) Schema

```json
{
  "metadata": { "title": "MIDI Show Control 1.1.1", "doc_id": "RP-002-014", "protocol": "midi1", "version": "1.1.1", "date": "1996-02", "source": "string" },
  "device_ids": [{ "range": "string", "description": "string" }],
  "command_formats": [{ "hex": "string", "name": "string" }],
  "general_commands": [{ "hex": "string", "name": "string", "data_bytes": "string", "recommended_minimum_sets": "string" }],
  "sound_commands": [{ "hex": "string", "name": "string", "data_bytes": "string", "recommended_minimum_sets": "string" }],
  "two_phase_commands": [{ "hex": "string", "name": "string", "data_bytes": "string", "recommended_minimum_sets": "string" }],
  "command_descriptions": [{ "hex": "string", "name": "string", "data_format": "string", "description": "string" }],
  "two_phase_normal_sequence": [{ "order": "string", "message": "string", "sender": "string", "purpose": "string" }],
  "two_phase_exception_sequence": [{ "message": "string", "sender": "string", "purpose": "string" }],
  "status_code_ranges": [{ "hex_range": "string", "description": "string" }],
  "cancelled_status_codes": [{ "hex": "string", "messages": "string", "description": "string" }],
  "abort_status_codes": [{ "hex": "string", "messages": "string", "description": "string" }],
  "command_format_status_codes": [{ "command_format_range": "string", "codes": [{ "hex": "string", "messages": "string", "description": "string" }] }],
  "summary": { "device_id_count": 3, "command_format_count": 57, "general_command_count": 12, "sound_command_count": 15, "two_phase_command_count": 7, "command_description_count": 40, "two_phase_normal_sequence_count": 4, "two_phase_exception_sequence_count": 3, "status_code_range_count": 4, "cancelled_status_code_count": 6, "abort_status_code_count": 20, "command_format_status_code_count": 7 }
}
```

**Schema notes:**
- Tab-separated tables parsed by section detection (section headers like "4.3. General Commands" switch parsing mode)
- Device IDs: 3 ranges (00-6F individual, 70-7E group, 7F all-call)
- Command formats: 57 entries (hex 00-7F) covering Lighting, Sound, Machinery, Video, Projection, Process Control, Pyro, All-types
- General commands: 12 (GO, STOP, RESUME, TIMED_GO, LOAD, SET, FIRE, ALL_OFF, RESTORE, RESET, GO_OFF)
- Sound commands: 15 (GO/JAM_CLOCK through CLOSE_CUE_PATH)
- 2PC commands: 7 (STANDBY, STANDING_BY, GO_2PC, COMPLETE, CANCEL, CANCELLED, ABORT)
- Command descriptions: 40 entries with data_format and multi-line description; uses pending-entry state machine with regex for data format lines (angle brackets or lowercase 2-letter token pairs like "cc cc", "hr mn sc fr ff")
- 2PC normal sequence: 4 messages (STANDBY→STANDING_BY→GO_2PC→COMPLETE)
- 2PC exception sequence: 3 messages (ABORT, CANCEL, CANCELLED)
- Status code ranges: 4 (manufacturer-dependent, command_format-dependent, independent, undefined)
- CANCELLED status codes: 6; ABORT status codes: 20
- Command_format dependent status codes: 7 groups (lighting, sound, machinery, video, projection, process control, pyrotechnics)
- Page number lines like "10 MIDI Show Control 1.1.1" filtered out from command formats and commands
- Status code hex field is the full 2-byte value (e.g., "80 04") from parts[0] after tab split

### SMF (RP-001) Schema

```json
{
  "metadata": { "title": "Standard MIDI Files 1.0", "doc_id": "RP-001", "protocol": "midi1", "version": "1.0", "date": "1996-02", "source": "string" },
  "variable_length_examples": [{ "number_hex": "string", "representation_hex": "string" }],
  "file_formats": [{ "format": "number", "description": "string" }],
  "division_formats": [{ "type": "string", "description": "string" }],
  "meta_events": [{ "ff_type": "string", "syntax": "string", "name": "string", "description": "string" }],
  "example_events": [{ "delta_time": "number", "event_code": "string", "other_bytes": "string" }],
  "summary": { "variable_length_example_count": 12, "file_format_count": 3, "division_format_count": 2, "meta_event_count": 15, "example_event_count": 38 }
}
```

**Schema notes:**
- No formal tables in this document — all structured data is extracted from prose and code examples
- Variable-length quantity examples: 12 hex number → representation pairs (00000000→00 through 0FFFFFFF→FF FF FF 7F)
- File formats: 3 (format 0 = single track, 1 = simultaneous tracks, 2 = independent patterns)
- Division formats: 2 (metrical = ticks per quarter-note, SMPTE = ticks per frame)
- Meta-events: 15 entries (FF 00-7F) with syntax, name, and multi-line description; uses pending-entry state machine with uppercase-name regex to distinguish new events from continuation lines
- Example events: 38 entries from the example MIDI file section (delta-time + event code + other bytes)
- SECTION_HEADER_RE limited to 1-2 digit numbers to avoid matching 8-digit hex data
- Example events only captured after "Delta Time...Event...Comment" header line detected (inExampleSection flag)

### Property Exchange (M2-103-UM) Schema

```json
{
  "metadata": { "title": "Common Rules for MIDI-CI Property Exchange", "doc_id": "M2-103-UM", "protocol": "midi2", "version": "1.2", "date": "2023-11", "source": "string" },
  "pe_message_format": [{ "value": "string", "parameter": "string" }],
  "pe_messages": [{ "sub_id_2": "string", "message_type": "string", "description": "string" }],
  "encoding_types": [{ "property_value": "string", "description": "string" }],
  "property_definitions": [{ "property_key": "string", "value_type": "string", "description": "string", "table_number": "number" }],
  "reply_status_codes": [{ "value": "string", "description": "string" }],
  "transaction_examples": [{ "table_number": "number", "field": "string", "content": "string" }],
  "summary": { "pe_message_format_field_count": 16, "pe_message_count": 11, "encoding_type_count": 3, "property_definition_count": 21, "reply_status_code_count": 19, "transaction_example_count": 138 }
}
```

**Schema notes:**
- 97 tables in the document; most are transaction example tables with `Header Data | Property Data` JSON snippets — merged into `transaction_examples` with `table_number`
- 9 property definition tables (13, 14, 16, 19, 20, 39, 64, 79, 80) share `Property Key | Property Value Type | Description` format — merged into `property_definitions` with `table_number`; multi-line descriptions accumulated via pending-entry state machine
- PE messages (Table 11) use known message type patterns to split type from description (e.g., "Inquiry: Get Property Data" vs description text)
- Reply status codes (Table 15) are HTTP-like (200, 404, 500) with range headers (200-299, 400-499)
- Encoding types (Table 12): ASCII, Mcoded7, zlib+Mcoded7
- Property key detection uses a known-props list to distinguish new entries from continuation lines
- Transaction examples capture multi-line JSON content by appending to the last entry

### MIDI-CI (M2-101-UM) Schema

```json
{
  "metadata": { "title": "MIDI Capability Inquiry (MIDI-CI) Specification", "doc_id": "M2-101-UM", "protocol": "midi2", "version": "1.2", "date": "2023-11", "source": "string" },
  "categories": [{ "category": "number", "sub_id_2_range": "string", "description": "string" }],
  "standard_format": [{ "value": "string", "parameter": "string" }],
  "bitmap_allocation": [{ "bit": "string", "category": "number", "sub_id_2_range": "string", "description": "string" }],
  "message_formats": [{ "value": "string", "parameter": "string", "table_number": "number" }],
  "ack_status_codes": [{ "status_code": "string", "status_data": "string", "reason": "string" }],
  "nak_status_codes": [{ "status_code": "string", "status_data": "string", "reason": "string" }],
  "property_exchange_versions": [{ "common_rules_version": "string", "major_version": "string", "minor_version": "string" }],
  "endpoint_info_status_values": [{ "status_value": "string", "target_property": "string", "details": "string" }],
  "profile_id_formats": [{ "byte_name": "string", "standard_defined": "string", "manufacturer_specific": "string" }],
  "message_data_control_values": [{ "value": "string", "description": "string" }],
  "summary": { "category_count": 8, "standard_format_field_count": 14, "bitmap_allocation_count": 7, "message_format_count": 407, "ack_status_code_count": 3, "nak_status_code_count": 15, "property_exchange_version_count": 1, "endpoint_info_status_value_count": 2, "profile_id_format_count": 5, "message_data_control_value_count": 4 }
}
```

**Schema notes:**
- 46 tables in the document; 33 are message format tables with `Value | Parameter` columns, merged into a single `message_formats` array with `table_number` to identify the source table
- Tables 10 and 19 have different structures (3-column) and are parsed as separate sections: `endpoint_info_status_values` and `profile_id_formats`
- Tab characters (`\t`) are the primary separator in this document (unlike UMP spec which uses spaces); parsers use `split('\t')` for multi-column tables
- Section headers like `5.7.1` and note lines like `Note:` or `The following fields` terminate table parsing
- ACK/NAK status code tables share the same 3-column format and use the same `parseStatusCodes` function
- `standard_format` (Table 5) captures the common MIDI-CI message header structure shared by all messages

### UMP/MIDI 2.0 Protocol (M2-104-UM) Schema

```json
{
  "metadata": { "title": "Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol Specification", "doc_id": "M2-104-UM", "protocol": "midi2", "version": "1.1.2", "date": "2023-11", "source": "string" },
  "message_type_allocation": [{ "mt": "string", "ump_size": "string", "description": "string" }],
  "attribute_types": [{ "attribute_type": "string", "definition": "string" }],
  "flex_data_format_fields": [{ "value": "number", "ump_type": "string" }],
  "flex_data_address_fields": [{ "value": "number", "addressing": "string" }],
  "status_bank_classifications": [{ "status_bank": "string", "classification": "string" }],
  "sharps_flats_examples": [{ "sharps_flats_field": "string", "tonic_note": "string", "intended_tonic_note": "string" }],
  "tonic_sharps_flats": [{ "twos_complement": "string", "decimal_value": "number", "applied_to_tonic": "string" }],
  "chord_types": [{ "value": "string", "chord_type": "string" }],
  "bass_note_sharps_flats": [{ "twos_complement": "string", "decimal_value": "number", "applied_to_bass_note": "string" }],
  "text_messages": [{ "status_bank": "string", "status": "string", "message": "string" }],
  "system_message_formats": [{ "message": "string", "status": "string", "byte_2": "string", "byte_3": "string" }],
  "sysex7_status_values": [{ "status": "string", "ump_type": "string" }],
  "sysex8_status_values": [{ "status": "string", "ump_type": "string" }],
  "special_id_conversions": [{ "special_id": "string", "seven_bit_value": "string", "sixteen_bit_value": "string" }],
  "manufacturer_id_conversions": [{ "manufacturer": "string", "mfid_1": "string", "mfid_2": "string", "mfid_3": "string", "mfid_32": "string", "mfrid": "string", "mfrid_hi": "string", "mfrid_lo": "string" }],
  "registered_per_note_controllers": [{ "number": "string", "controller_name": "string", "default_value": "string", "reference": "string" }],
  "center_value_examples": [{ "value_size": "string", "center_hex": "string", "center_binary": "string" }],
  "ump_formats": [{ "message": "string", "mt": "string", "group": "string", "fields": "string" }],
  "midi2_addressing": [{ "entry": "string" }],
  "summary": { "message_type_allocation_count": 16, "attribute_type_count": 5, "flex_data_format_field_count": 4, "flex_data_address_field_count": 4, "status_bank_classification_count": 4, "sharps_flats_example_count": 3, "tonic_sharps_flats_count": 5, "chord_type_count": 29, "bass_note_sharps_flats_count": 6, "text_message_count": 18, "system_message_format_count": 16, "sysex7_status_value_count": 4, "sysex8_status_value_count": 4, "special_id_conversion_count": 3, "manufacturer_id_conversion_count": 9, "registered_per_note_controller_count": 27, "center_value_example_count": 5, "ump_format_count": 34, "midi2_addressing_count": 17 }
}
```

**Schema notes:**
- Tables are space-separated (not pipe-delimited) with page breaks interrupting table rows; the parser skips `## Page N` headers and accumulates rows across page boundaries
- `message_type_allocation` includes reserved MTs (0x7-0xC) with empty description strings
- `manufacturer_id_conversions` uses a find-by-MfrID approach: the first `0xXXXX` 4-hex-digit value is the MfrID, and the manufacturer name is everything before the MFID fields
- `registered_per_note_controllers` uses two-pass parsing: first tries matching with a dash separator (for entries with references on the same line), then falls back to no-dash matching (for multi-line entries); MMA RP references are extracted from the controller name
- `ump_formats` merges Tables 26-33 into a single array with message name, MT, group field, and remaining fields as a string
- The `isHeaderValue` function filters out header rows by matching common header keywords
- En-dash (`\u2013`) is used as the dash character in the source document, not ASCII hyphen

### RTP-MIDI (RFC 6295) Schema

```json
{
  "metadata": { "title": "RTP Payload Format for MIDI (RTP-MIDI)", "doc_id": "RFC6295", "protocol": "midi1", "version": "6295", "date": "2011-06", "source": "string" },
  "packet_figures": [{ "figure_id": "string", "title": "string", "fields": ["string"] }],
  "channel_chapters": [{ "appendix": "string", "section_number": "string", "chapter_letter": "string", "name": "string", "figure_id": "string|null", "fields": ["string"], "size": "string|null", "description": "string" }],
  "system_chapters": [{ "appendix": "string", "section_number": "string", "chapter_letter": "string", "name": "string", "figure_id": "string|null", "fields": ["string"], "size": "string|null", "description": "string" }],
  "configuration_parameters": [{ "name": "string", "description": "string", "allowed_values": ["string"], "section_ref": "string|null" }],
  "media_type_registrations": [{ "section": "string", "title": "string", "media_type": "string|null", "subtype": "string|null", "required_parameters": [{ "name": "string", "description": "string" }], "optional_parameters": [{ "name": "string", "description": "string" }] }],
  "abnf_definitions": [{ "parameter": "string", "syntax": "string", "section_ref": "string|null" }],
  "summary": { "packet_figure_count": 10, "channel_chapter_count": 8, "system_chapter_count": 5, "configuration_parameter_count": 28, "media_type_registration_count": 3, "abnf_definition_count": 55 }
}
```

**Schema notes:**
- `packet_figures` are extracted from ASCII art bitfield diagrams by scanning backwards from "Figure N --" labels; field names are all-caps tokens from pipe-delimited cells
- `channel_chapters` (Appendix A, letters P/C/M/W/N/E/T/A) and `system_chapters` (Appendix B, letters D/V/Q/F/X) use a `currentChapter` reference to correctly associate figures and fields regardless of which array the chapter was pushed to
- `configuration_parameters` are built post-processing from IANA registration parameter lists, enriched with ABNF syntax and allowed values (quoted strings extracted from ABNF definitions)
- `abnf_definitions` include both `param-assign` entries (matching IANA parameter names) and structural ABNF rules (command-type, chapter-list, midi-chan, etc.)
- `section_ref` in ABNF definitions comes from "; Parameters defined in Appendix C.N" comments; C.4 uses singular "Parameter defined"
- Chapter boundary detection must distinguish top-level chapter headings from subsections (B.5.1.) and prose references ("Appendix A.1 definition of")

### MIDI 1.0 Detailed Specification Schema

```json
{
  "metadata": { "title": "MIDI 1.0 Detailed Specification", "doc_id": "M1", "protocol": "midi1", "version": "4.2.1", "date": "1996-02" },
  "status_byte_summary": [{ "status_hex": "string|null", "binary": "string", "data_bytes": "string", "description": "string" }],
  "channel_voice_messages": [{ "status_hex": "string", "binary": "string", "data_bytes": ["string"], "description": "string", "data_byte_descriptions": ["string"] }],
  "controller_numbers": [{ "decimal": "string", "hex": "string", "function": "string" }],
  "registered_parameter_numbers": [{ "lsb": "string", "msb": "string", "function": "string" }],
  "channel_mode_messages": [{ "controller_number": "number", "description": "string", "values": ["string"] }],
  "system_common_messages": [{ "status_hex": "string", "binary": "string", "data_bytes": ["string"], "description": "string", "data_byte_descriptions": ["string"] }],
  "system_real_time_messages": [{ "status_hex": "string", "binary": "string", "description": "string" }],
  "system_exclusive_messages": [{ "status_hex": "string", "binary": "string", "data_bytes": ["string"], "description": "string", "data_byte_descriptions": ["string"] }],
  "universal_sysex_non_real_time": [{ "sub_id_1": "string", "sub_id_2": "string|null", "description": "string" }],
  "universal_sysex_real_time": [{ "sub_id_1": "string", "sub_id_2": "string|null", "description": "string" }],
  "manufacturer_id_numbers": [{ "region": "string", "number": "string", "manufacturer": "string" }],
  "additional_spec_documents": [{ "title": "string", "description": "string" }],
  "sysex_message_formats": [{ "name": "string|null", "format": "string", "fields": [{ "field": "string", "description": "string" }] }],
  "summary": { "status_byte_count": 11, "channel_voice_message_count": 7, "controller_number_count": 46, "registered_parameter_number_count": 5, "channel_mode_message_count": 8, "system_common_message_count": 7, "system_real_time_message_count": 8, "system_exclusive_message_count": 2, "universal_sysex_non_real_time_count": 41, "universal_sysex_real_time_count": 36, "manufacturer_id_number_count": 227, "additional_spec_document_count": 5, "sysex_message_format_count": 46 }
}
```

**Schema notes:**
- `status_byte_summary` includes special rows with `status_hex: null` for System Common (11110sss) and System Real Time (11111ttt) groups
- `channel_mode_messages` uses numeric `controller_number` (120-127) with `values` array for multi-value entries (e.g., Local Control has on/off values)
- `universal_sysex_*` entries: parent rows have `sub_id_2` as a string (e.g., "nn"), sub-entries have `sub_id_2: null`
- `manufacturer_id_numbers` includes 3 regions: american (01H-1FH + 00H 00H 01H+), european (20H-3FH + 00H 20H 00H+), japanese (40H-5FH + 00H 40H 00H+)
- `sysex_message_formats` captures body-text SysEx format descriptions with named headers (ACK, NAK, etc.) and their F0-prefixed format strings with field-level descriptions
- OCR errors (OOH → 00H) normalized in manufacturer IDs
