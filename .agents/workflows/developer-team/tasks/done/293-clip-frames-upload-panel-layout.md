---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 293: Clip Frames + Upload Area — Unified Panel Layout

## Description

Create a custom element that combines the clip frames strip and an upload area side-by-side in a single 100%-wide container. Frames scroll horizontally on the left; the upload drop zone is always visible on the right.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Frames (scrollable horizontally) →  │  Upload Area (fixed)      │
│                                         │                           │
│  [frame][frame][frame][frame][frame]... │  [+] Drop / click to     │
│                                         │      upload new frames    │
│                                         │                           │
└─────────────────────────────────────────────────────────────────────┘
  ← ─────────── 100% width ─────────────────────────────────── →
```

## Requirements

- Outer container: 100% width, single custom element.
- Left pane: horizontal scrollable strip containing all clip frames (as they are now).
- Right pane: upload area, always visible (never scrolls away).
  - Same height as the frames pane (uniform, scales together).
  - Width matches roughly one frame width or a comfortable drop target.
- Behavior: adding a frame is intuitive; upload target is always next to the last frame.
- Responsive: outer element stretches to available width; frames pane takes remaining space after upload area.

## Implementation Notes

- Use `display: flex` on the outer container.
- Left pane: `flex: 1; overflow-x: auto;`.
- Right pane: `flex: 0 0 auto; width: {frame-width}px;` (or `min-width`).
- Both panes share the same height (`align-items: stretch` or explicit height).

## Affected files

- New custom element: likely `mainframe/src/js/ClipFramesUploadPanel.js` or extend existing clip frames component.
- `mainframe/src/scss/` — new or updated SCSS for the panel layout.
- `mainframe/src/index.html` — clip editor integration.
- `mainframe/test/` — unit tests for the new component.

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npm run build -w mainframe` passes.
4. The clip editor shows frames and upload area side-by-side at 100% width.
5. Horizontal scrolling affects only the frames pane; upload area stays visible.

## Notes

- Coordinate with the clip editor and existing `<piano-roll>`/`<preview-clip>` work.
- This is a UI/layout task; no runtime behavior changes for clip processing.
