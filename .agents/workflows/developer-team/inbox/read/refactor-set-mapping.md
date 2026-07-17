# Task: Refactor and Rename set-mapping.json

## Core Goal
The current `set-mapping.json` file violates our new Human-First (KISS) specification. It is a giant, un-grouped array of items that is a scrolling nightmare for a human to navigate or edit by hand. 

Your task is to research a better structural schema, implement it, and rename the file to something more intuitive.

## Requirements

### 1. Rename the File
The name "set-mapping" feels slightly off. Research and pick a better name that describes the actual physical layout of the controller. Some suggestions:
- `midi-layout.json` (Recommended)
- `clip-matrix.json`
- `trigger-grid.json`
- `midi-bindings.json`

### 2. Group by Channel
Instead of a flat array of hundreds of objects, group the data logically so a human can easily find what they are looking for.
For example, grouping by channel and note:
```json
{
  "channel-1": {
    "note-0": "c1-n0-v0",
    "note-1": "c1-n1-v0"
  }
}
```

### 3. Omit Empty Entries (Sparse Data)
If a note or a channel has no clip assigned to it, it should simply not exist in the JSON file. Do not pad the file with empty values. Keep it as small, sparse, and clean as possible.

### 4. Implementation
Once you have designed the new schema:
- Update the `mainframe` UI to read/write this new structure.
- Update the `ClipLoader` in the `akvj` to properly parse the nested grouping into its internal clip tree.
- Update any pipeline scripts (e.g., `validateMapping.js`) to support the new format.
