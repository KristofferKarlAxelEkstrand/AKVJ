# Feature Proposal: Asset Ingestion & Authoring Workflow

## Background
Currently, the `mainframe` tool's upload process is fairly basic. It accepts frames, but lacks intermediate tweaking like scaling or saving the original source assets. To make the VJ setup process more professional, we need a staging/authoring UI where assets can be massaged before being committed.

## Core Requirements

### 1. Unified Staging UI
Instead of a simple upload button that immediately saves the clip, the user should be presented with an "Ingestion/Authoring" dashboard. 
- The user can drag & drop multiple single images (frames) or a pre-made sprite sheet.
- Support for both `.png` and `.jpg`.

### 2. Live Configuration & Preview
Before hitting "Save", the user should be able to edit parameters on the fly with a real-time preview canvas:
- **Scale:** Resize the input images to match the standard 240x135 resolution (or scale up pixel art).
- **Color Depth:** Preview how it looks in 1-bit, 2-bit, etc.
- **Timing:** Set how long each frame is displayed (`frameDurationBeats` or `frameRatesForFrames`).
- **Name:** Assign the clipId/name.

### 3. Raw Asset Retention
We should never throw away the original user uploads. If they uploaded 10 hi-res JPGs, we should store those in a `clips/.raw-assets/{clipId}/` folder (or similar). This allows the VJ to return to the clip weeks later and adjust the scaling or color depth from the original high-quality source rather than the downscaled pixel-art output.

### 4. Sprite Sheet Compilation
Regardless of the input (multiple JPGs or one PNG), the final output saved to the `clips/{clipId}/` bucket should *always* be compiled into a `.png` sprite sheet format. This keeps the rendering engine (`akvj`) extremely fast and homogeneous.

## Implementation Considerations
- **Backend (`mainframe/server/index.js`)**: 
  - Update `POST /api/clips` to accept configuration parameters (scale, bit depth).
  - Use the existing `sharp` dependency to dynamically resize, convert JPGs to PNGs, and stitch individual frames into a sprite sheet.
  - Implement logic to save the raw input files alongside the generated sprite sheet.
- **Frontend (`mainframe/src/main.js`)**:
  - Build the Staging UI view.
  - Integrate the existing Canvas preview player directly into the upload flow so the user can verify the frame rate and scaling before saving.
