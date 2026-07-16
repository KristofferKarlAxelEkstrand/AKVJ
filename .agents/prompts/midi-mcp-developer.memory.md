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
1. DLS Level 2.2 Specification transformer is **complete** (20 tests passing, JSON output generated).
2. Find and process the next untransformed MIDI specification document with structured/tabular data. Remaining candidates: MIDI 1.0 Detailed Spec (3252 lines, 10 tables), RTP-MIDI (8644 lines, 6 tables), MIDI 2.0 UMP/Protocol specs.
