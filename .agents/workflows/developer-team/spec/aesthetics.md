---
id: aesthetics
title: Aesthetics & Design Philosophy
status: draft
owner: human
maintainer: overseer
approved:
verified: 2026-07-20
---

# Aesthetics & Design Philosophy

This project has two distinct aesthetic requirements depending on whether you are working on the actual VJ visualizations (`akvj`) or the management interface (`mainframe`).

### 1. The Visualizations (Lo-Fi / Pixel Art)
The actual output of the `akvj` is focused entirely on **80s and 90s pixel art and lo-fi aesthetics**.
- **Near-zero UI**: Performance canvas only. Allowed exceptions: fullscreen (Enter / Space / double-click), debug overlay toggled with **D** (`DebugOverlay.js`), and the transient project-switch loading overlay (`AkvjLoadingOverlay.js`). No chrome, menus, or persistent HUD.
- **Pixel Perfection**: The rendering canvas defaults to `imageSmoothingEnabled = false` to preserve sharp, hard pixel edges. Individual clips may set metadata `scaling: "smooth"` for **akvj live playback** only. Mainframe staging / clip preview must stay nearest-neighbour (`imageSmoothingEnabled = false`) so authors always see pixel-for-pixel output — do not mirror `scaling: "smooth"` in preview. 
- **Retro Effects**: Any visual effects added to the renderer should lean into the retro, lo-fi route (e.g., bit-crushing, hard masking, pixelation, simple strobes). 
- **Performance Benefit**: Keep in mind that this lo-fi approach is inherently highly performant, which aligns perfectly with our 60fps locked requirement.

### 2. The mainframe UI (Minimalist)
The `mainframe` dashboard and user interface is **not** meant to be a retro skeuomorphic mess. 
- **Keep it Minimal**: The UI should be incredibly clean, simple, and minimal. 
- **Functional**: The goal of the UI is to get out of the way so the user can manage clips, adjust mappings, and overview the set quickly. It should look modern, stripped-down, and highly functional.

## Changelog

- 2026-07-20 — Re-verified: softened “Zero UI” to match shipped exceptions (D debug overlay,
  loading overlay, fullscreen). Pixel / preview nearest lock still holds; no Shadow DOM in
  akvj or mainframe.
- 2026-07-20 — Human lock: mainframe preview stays hard nearest always; `scaling: "smooth"` is akvj playback only. Soft/modern kernels belong on **upload/ingest downscale** (sprite bake), not preview.
- 2026-07-20 — Updated Pixel Perfection rule to reflect that individual clips can opt into smooth bilinear scaling via their metadata `scaling` property.
