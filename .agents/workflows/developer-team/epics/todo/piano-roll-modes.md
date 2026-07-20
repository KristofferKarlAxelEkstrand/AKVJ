# Pianoroll Modes Epic

## Overview

Single unified pianoroll custom element with three switchable modes: **Edit**, **Filter**, and **Play/Preview**. Mode selector buttons positioned left of channel picker for quick access. Each mode transforms the pianoroll's interaction model and display while preserving core grid/note structure.

## Modes

### Edit Mode
**Purpose**: Mapping creation and modification (default view)

- **Interactions**:
  - Click grid cells to place clips (note × velocity)
  - Right-click to delete clip placements
  - Drag to select multiple cells; batch operations
  - Show clip metadata tooltip on hover (clipId, name, triggerType)
  - Drag-and-drop reorder clips across velocities or notes

- **Display**:
  - Grid background with note labels (left axis) and velocity steps (top/bottom)
  - Occupied cells show clip icon or truncated clipId
  - Highlight hovered cell and selection
  - Visual feedback for valid/invalid placements

- **State**:
  - Dirty flag tracks unsaved changes
  - Undo/redo stack (optional MVP)

### Filter Mode
**Purpose**: Narrow visible clips by criteria (reusable across pages)

- **Interactions**:
  - Dropdown/text filters: by clipId, layer group (A/B/C), trigger type, role
  - Toggle: show only populated cells vs. all cells
  - Multi-select filters (AND/OR logic configurable)
  - Clear filters button

- **Display**:
  - Same grid, but cells outside filter criteria are dimmed or hidden
  - Active filter summary bar (e.g., "Showing: loop clips in Layer A")
  - Filter state persists per session (optional: to localStorage)

- **Notes**:
  - Not all pages need filters initially; extensible design
  - Can layer on top of Edit mode for targeted editing

### Play / Preview Mode
**Purpose**: Trigger clips and preview animations in real-time

- **Interactions**:
  - Click grid cells to trigger clips (fire MIDI note on)
  - Velocity mapped to click intensity or velocity slider (0–127)
  - Double-click or hold to sustain; release triggers note off
  - BPM sync indicator for beat-synced clips
  - Optional: keyboard shortcuts (e.g., QWERTY row = note row)

- **Display**:
  - Live animation preview in small canvas (or link to main renderer)
  - Clip playback indicator (progress bar or frame counter)
  - Currently-playing cells highlighted with pulse animation
  - BPM / tempo display if synced clips are active

- **State**:
  - Tracks actively playing clips; shows which layer groups are rendering
  - Real-time visual feedback tied to `Renderer` output

## UI Layout

```
┌─ Pianoroll Container ──────────────────────────┐
│                                                │
│  [Edit] [Filter] [Play]  ← Mode buttons (left)│
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Channel Picker (right)                  │  │
│  │ [0] [1] [2] [3] [4] [5] ...            │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─ Pianoroll Grid ──────────────────────────┐│
│  │  (Note labels)    Velocity / Clip Grid   ││
│  │  C-1 ┌─────────────────────────────────┐││
│  │  C#1 │  (cells vary by mode)           │││
│  │  D-1 │                                 │││
│  │  ...                                   │││
│  │  B-2 └─────────────────────────────────┘││
│  └──────────────────────────────────────────┘│
│                                                │
└────────────────────────────────────────────────┘
```

**Mode Selector**:
- Left of channel picker
- Three button tabs; active state clearly indicated (highlight, underline, or background color)
- Tooltip on hover explaining each mode

## Architecture

### Custom Element Structure
```
<pianoroll-element>
  #modeSelector (button group: Edit | Filter | Play)
  #channelPicker (existing or integrated)
  #gridContainer (canvas or grid DOM)
    - #editView (Edit mode content)
    - #filterView (Filter mode content + controls)
    - #playView (Play mode content + animation preview)
  #stateManager (AppState integration)
</pianoroll-element>
```

### State Management
- **Active Mode**: Stored in AppState; dispatch `pianoroll:mode-changed` event
- **Clip Mapping**: Synced to key-map.json (via mainframe API)
- **Filter State**: Private to pianoroll component or shared via AppState (TBD)
- **Play Session**: Tracks active note-ons; triggers via MIDI-like interface

### Event Flow
1. User clicks mode button → dispatch `pianoroll:mode-changed`
2. Component switches view; updates interaction handlers
3. Edit mode: click → `pianoroll:clip-placed` → AppState update → mainframe API
4. Filter mode: filter change → render grid with visibility mask
5. Play mode: click → `pianoroll:note-on` → Renderer preview

## Implementation Phases

### Phase 1: Infrastructure
- [ ] Add mode selector buttons (HTML + CSS)
- [ ] Implement mode state machine in component
- [ ] Wire mode changes to view toggling (show/hide Edit/Filter/Play divs)
- [ ] CSS for active mode styling

### Phase 2: Edit Mode (MVP)
- [ ] Grid rendering (canvas or DOM grid)
- [ ] Click-to-place clip logic
- [ ] Hover tooltip with clip metadata
- [ ] Visual feedback (selection, hover states)
- [ ] Right-click delete

### Phase 3: Filter Mode
- [ ] Filter control UI (dropdowns, toggles)
- [ ] Apply filter visibility logic to grid cells
- [ ] Filter state management

### Phase 4: Play Mode
- [ ] Click-to-trigger logic (fire note on/off)
- [ ] Velocity mapping (slider or click intensity)
- [ ] Animation preview canvas
- [ ] Playback indicator (pulse, progress bar)

### Phase 5: Polish & Integration
- [ ] Keyboard shortcuts (optional for MVP)
- [ ] Persistent filter state (localStorage)
- [ ] Undo/redo for Edit mode (optional)
- [ ] Performance: lazy rendering for large grids

## Key Decisions

1. **Single Element vs. Three Components**  
   → Single element with mode views; cleaner prop/state threading

2. **Canvas vs. DOM Grid**  
   → Start with DOM grid for ease; canvas optimization later if performance issues

3. **Filter Logic: Client-side or Server**  
   → Client-side; filter state is UI-only (doesn't persist to server unless user saves)

4. **Play Preview: Inline Canvas or Link to Main Renderer**  
   → Start inline small preview; can link to main renderer for full-screen playback

## Dependencies & Integrations

- `AppState` for mode and clip updates
- `mainframe` API for key-map.json persistence
- `Renderer` for Play mode preview (optional: mock for MVP)
- `ClipLoader` to fetch clip metadata (name, role, etc.)
- CSS framework (use existing AKVJ styles)

## Success Criteria

- [ ] Mode buttons visible and functional
- [ ] Edit mode allows click-to-place clips with visual feedback
- [ ] Filter mode hides/dims non-matching cells
- [ ] Play mode triggers clips and shows playback indication
- [ ] No performance degradation with large clip mappings (100+ placements)
- [ ] Responsive on desktop; touch-friendly for tablets (stretch goal)

## Open Questions

1. Should filter state persist across session/page reload?
2. Keyboard shortcuts in Play mode — which note layout (QWERTY, Dvorak, musical)?
3. Should Edit mode support drag-reorder or copy/paste operations?
4. How many preview clips should Play mode render simultaneously before throttling?
