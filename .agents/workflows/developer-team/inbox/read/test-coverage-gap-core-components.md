# [TEST] Test Coverage Gap: Core Components

## Affected Files
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/src/js/visuals/Renderer.js`
- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/midi-input/Midi.js`
- `akvj/src/js/visuals/LayerManager.js`

## Description
The test suite only has 2 test files (MaskManager.test.js, EffectsManager.test.js) covering visual effects components. Core application components have no unit tests:

- **AppState.js**: Central state management with complex BPM sync logic, MIDI clock handling, and event dispatching - completely untested
- **AdventureKidVideoJockey.js**: Main component with project switching, canvas lifecycle, and integration points - completely untested
- **Renderer.js**: 60fps render loop with compositor coordination - completely untested
- **Clip.js**: Clip playback, timing, and rendering logic - completely untested
- **ClipLoader.js**: Asset loading, validation, and batch processing - completely untested
- **Midi.js**: Web MIDI API integration, hot-plug support, and message parsing - completely untested
- **LayerManager.js**: MIDI routing, layer coordination, and cleanup - completely untested

## Impact
- High risk of regressions in core functionality
- BPM sync logic (MIDI clock, CC, manual) has no test coverage
- Project switching workflow is untested
- MIDI message parsing and routing is untested
- Asset loading and validation is untested
- Performance-critical render loop is untested

## Recommended Next Steps
1. Add unit tests for AppState BPM sync logic (clock, CC, manual modes)
2. Add unit tests for Midi message parsing and hot-plug behavior
3. Add unit tests for ClipLoader validation and sanitization
4. Add unit tests for Clip timing and playback modes
5. Add integration tests for project switching workflow
6. Add performance tests for render loop (ensure 60fps target)
7. Add unit tests for LayerManager MIDI routing
