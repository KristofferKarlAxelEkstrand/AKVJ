# Task: Review and Refine the Clip JSON Format

## Core Goal
Perform a thorough review of the current clip format schema (specifically the `meta.json` structure, but also how clips are aggregated into `clips.json` and mapped in `set-mapping.json`). Evaluate the schema for simplicity, logic, and human readability.

## Requirements

### 1. Human-Readable & Editable (KISS)
- The format must be dead simple to understand. A human should be able to open a `meta.json` file in a text editor, instantly understand what every field does, and edit it by hand without causing errors.
- Ensure field names are intuitive and follow clear naming conventions.

### 2. Machine Compatibility
- The format must remain perfectly usable by both the heavy `mainframe` manager (which writes and edits these files) and the lightweight `akvj` (which reads these files for high-performance rendering).

### 3. Iteration & Refactoring
- **You are allowed to change the schema.** If you find fields that are confusing, poorly structured, or unnecessarily complex, refactor them! 
- If you make changes to the format, ensure that the mainframe UI, the pipeline generation scripts, and the `akvj` loading logic are all updated to support the new schema. 

## Context
We have made several changes to the metadata structure recently (adding advanced timing fields, etc.). Take a step back and look at the big picture to ensure the schema hasn't become bloated or convoluted. Keep it simple!
