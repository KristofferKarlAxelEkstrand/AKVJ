# Clip Format Goals

The JSON schema for clips (specifically `meta.json`, `clips.json`, and `set-mapping.json`) is the foundational bridge of the entire AKVJ architecture. It must adhere to the following strict principles:

### 1. Human First (KISS)
- **Human Readable**: A user should be able to open any clip JSON file in a text editor and instantly understand what every field means. Use simple, unambiguous naming conventions.
- **Human Editable**: The baseline workflow for adding a clip is completely manual: a user drops a sprite into a folder and writes the `meta.json` by hand. The format must remain simple enough that doing this is easy and error-free.
- **Logical Structure**: Avoid deeply nested, convoluted structures. Keep fields as flat and logical as possible.

### 2. Machine Compatible
- **mainframe Readable**: The `mainframe` UI is a powerful tool to provide a great overview, a good visual feel, and bulk operations. It must cleanly read and write the exact same format that a human would write, without injecting unnecessary bloat or stripping human formatting.
- **akvj Readable**: The lightweight visualizer must be able to quickly ingest this format for 60fps high-performance rendering.

**Golden Rule:** If a schema change makes the JSON file harder for a human to write by hand, it is a bad change.
