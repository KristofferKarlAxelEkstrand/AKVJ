# Task: Refactor Clip Naming, IDs, and Sprite Filenames

## Core Goal
We are moving away from abstract clip folder names (like `c1-n0-v0`) and generic sprite names (`sprite.png`). We want a flat bucket of clips where the unique identifier (the folder name), the display name, and the actual `.png` file name are all intrinsically linked to be human-readable.

## Requirements

### 1. The `name` Field
Every `meta.json` must now support a `"name"` field. This is the human-readable display name of the clip.
```json
{
  "name": "Hello darling ooo!",
  "numberOfFrames": 64,
  "framesPerRow": 8,
  "loop": true
}
```

### 2. Semantic Folder & PNG Names
When a clip is created via the mainframe UI, the underlying folder name (the `clipId`) should be generated as a URL-safe slug of the name (e.g., `hello-darling-ooo`). 
Furthermore, the actual sprite image file should also share this name (`hello-darling-ooo.png`) instead of defaulting to `sprite.png`. This makes browsing the filesystem infinitely easier for humans.

### 3. Make the `png` Field Optional
If the `.png` file exactly matches the folder name (e.g., `clips/hello-darling-ooo/hello-darling-ooo.png`), then the `"png"` field in `meta.json` is no longer required. The pipeline and `akvj` should just assume the file name matches the folder name. You only need to declare the `"png"` field if the filename is an exception.

### 4. mainframe UI Rename Warning
Because the folder name *is* the unique identifier for the clip, changing a clip's name in the mainframe UI will change its folder path. This will break any existing mappings in `set-mapping.json` (or `midi-layout.json`) that point to the old ID!
- **Implement a warning** in the mainframe UI frontend when a user tries to rename a clip, explicitly warning them that renaming will change the unique ID and may break existing MIDI mappings. (Alternatively, if you feel ambitious, have the backend automatically update the mapping file to the new ID when a rename occurs).

### 5. Migration Strategy
You will need to update the pipeline (generation/validation scripts), the `mainframe` API that creates these clips, and the `akvj` loader to respect this new semantic, optional-png structure. Ensure you write a migration script or update the existing clips to fit this new paradigm.
