# Task: Rename `numberOfFrames` to `frames`

## Core Goal
In the interest of keeping our `meta.json` schema as simple and clean as possible (KISS), we need to shorten the `numberOfFrames` property. 

Change it from:
`"numberOfFrames": 64`

To simply:
`"frames": 64`

## Requirements
- Update the schema validation scripts in the `mainframe` pipeline (e.g., `lib/validate/meta.js`).
- Update the `akvj` rendering engine (`ClipLoader.js`, `Clip.js`) to parse and use the new `"frames"` property instead of `"numberOfFrames"`.
- Write a quick migration script or manually update any existing `meta.json` files in the `clips/` folder to use the new field name.
