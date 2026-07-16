# MIDI MCP Developer: Persistent Memory

This file is the persistent ledger for the "MIDI MCP Developer" agent. 
Read this file at the start of your run, and update it at the end of your run.

## Goal
Transform the raw, unstructured markdown in `midi-mcp/data/` into pristine, strongly-typed JSON data via programmatic transformers, making this the best MIDI MCP server ever.

## Progress Checklist
- `[x]` Setup `midi-mcp/lib/transformers/` and `midi-mcp/data/structured/` directories.
- `[x]` Transformer: Control Change Messages (`control-change-messages-data-bytes.md` -> `cc-messages.json`)
- `[ ]` Transformer: Universal SysEx Messages (`universal-system-exclusive-messages.md` -> `universal-sysex.json`)
- `[ ]` Transformer: SysEx ID Table (`sysex-id-table-midi-org.md` -> `sysex-ids.json`)
- *(Add more documents here as you discover them)*

## Designed Schemas

*(Document your JSON schemas here once you design them)*

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

## Current TODO
1. Execute the second item on the Progress Checklist: Transformer for Universal SysEx Messages. Design the schema, write the transformer script, and ensure 100% test coverage!
