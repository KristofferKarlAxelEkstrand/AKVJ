# [TECH-DEBT] DebugOverlay uses getElementById for DOM updates instead of cached references

## Severity: Low (Code quality)

## Location
`akvj/src/js/utils/DebugOverlay.js:136-175` — `#updateBPM()`, `#updateMIDIStatus()`, `#renderLog()`

## Description
The DebugOverlay creates its DOM elements in `#createOverlay()` but then uses `document.getElementById()` every time it needs to update them. This is called on every MIDI event and BPM change.

```javascript
#updateBPM(bpm, source) {
    const bpmElement = document.getElementById('debug-bpm');
    const sourceElement = document.getElementById('debug-bpm-source');
    ...
}
```

While `getElementById` is fast, it's still a DOM query on every event. The element references could be cached during `#createOverlay()`.

## Impact
Low — `getElementById` is O(1) and the debug overlay is not in the render loop. But it's a code quality issue and could become problematic if MIDI events arrive at high frequency.

## Recommendation
Cache element references as private fields during `#createOverlay()`:

```javascript
#bpmElement;
#bpmSourceElement;
#midiStatusElement;
#midiLogElement;

#createOverlay() {
    this.#element = document.createElement('div');
    this.#element.id = 'debug-overlay';
    this.#element.innerHTML = OVERLAY_HTML;
    this.#bpmElement = this.#element.querySelector('#debug-bpm');
    this.#bpmSourceElement = this.#element.querySelector('#debug-bpm-source');
    this.#midiStatusElement = this.#element.querySelector('#debug-midi-status');
    this.#midiLogElement = this.#element.querySelector('#debug-midi-log');
    this.#applyStyles();
}
```

Note: `querySelector` on the element (not `document`) is needed because the element isn't in the DOM yet during construction.
