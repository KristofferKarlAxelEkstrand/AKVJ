# Aesthetics & Design Philosophy

This project has two distinct aesthetic requirements depending on whether you are working on the actual VJ visualizations (`akvj`) or the management interface (`mainframe`).

### 1. The Visualizations (Lo-Fi / Pixel Art)
The actual output of the `akvj` is focused entirely on **80s and 90s pixel art and lo-fi aesthetics**.
- **Zero UI**: The `akvj` must have absolutely no user interface elements (no buttons, menus, or overlays). It is a pure, unadulterated visualization canvas.
- **Pixel Perfection**: The rendering canvas must strictly enforce `imageSmoothingEnabled = false` to preserve sharp, hard pixel edges. 
- **Retro Effects**: Any visual effects added to the renderer should lean into the retro, lo-fi route (e.g., bit-crushing, hard masking, pixelation, simple strobes). 
- **Performance Benefit**: Keep in mind that this lo-fi approach is inherently highly performant, which aligns perfectly with our 60fps locked requirement.

### 2. The mainframe UI (Minimalist)
The `mainframe` dashboard and user interface is **not** meant to be a retro skeuomorphic mess. 
- **Keep it Minimal**: The UI should be incredibly clean, simple, and minimal. 
- **Functional**: The goal of the UI is to get out of the way so the user can manage clips, adjust mappings, and overview the set quickly. It should look modern, stripped-down, and highly functional.
