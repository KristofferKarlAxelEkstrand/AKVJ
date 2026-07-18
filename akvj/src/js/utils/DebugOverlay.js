/**
 * DebugOverlay - Displays real-time MIDI and timing information
 * Toggle visibility with 'D' key
 */
import appState, { EVENT_BPM_CHANGED, EVENT_MIDI_CONNECTION_CHANGED, EVENT_MIDI_NOTE_ON, EVENT_MIDI_NOTE_OFF, EVENT_MIDI_CONTROL_CHANGE } from '../core/AppState.js';

const MAX_LOG_ENTRIES = 8;
const NOTES_PER_OCTAVE = 12;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const OVERLAY_HTML = `
		<div class="debug-header">DEBUG <span class="debug-hint">(D to toggle)</span></div>
		<div class="debug-section">
			<div class="debug-label">BPM</div>
			<div class="debug-value" id="debug-bpm">--</div>
		</div>
		<div class="debug-section">
			<div class="debug-label">Source</div>
			<div class="debug-value" id="debug-bpm-source">--</div>
		</div>
		<div class="debug-section">
			<div class="debug-label">MIDI</div>
			<div class="debug-value" id="debug-midi-status">--</div>
		</div>
		<div class="debug-section">
			<div class="debug-label">Input</div>
			<div class="debug-log" id="debug-midi-log"></div>
		</div>
	`;

class DebugOverlay {
	#element;
	#bpmElement = null;
	#bpmSourceElement = null;
	#midiStatusElement = null;
	#midiLogElement = null;
	#midiLog = [];
	#unsubscribers = [];
	#boundHandleKeydown;
	#isVisible = false;

	constructor() {
		this.#boundHandleKeydown = this.#handleKeydown.bind(this);
		this.#createOverlay();
	}

	#createOverlay() {
		this.#element = document.createElement('div');
		this.#element.id = 'debug-overlay';
		this.#element.innerHTML = OVERLAY_HTML;
		this.#cacheDomElements();
	}

	#cacheDomElements() {
		this.#bpmElement = this.#element.querySelector('#debug-bpm');
		this.#bpmSourceElement = this.#element.querySelector('#debug-bpm-source');
		this.#midiStatusElement = this.#element.querySelector('#debug-midi-status');
		this.#midiLogElement = this.#element.querySelector('#debug-midi-log');
	}

	#handleKeydown(event) {
		if (event.key === 'd' || event.key === 'D') {
			// Don't toggle if user is typing in an input or contenteditable element
			const target = event.target;
			const targetTag = target?.tagName?.toUpperCase();
			if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || target?.isContentEditable) {
				return;
			}
			this.#isVisible = !this.#isVisible;
			this.#element.classList.toggle('visible', this.#isVisible);
		}
	}

	#updateBPM(bpm, source) {
		if (this.#bpmElement) {
			this.#bpmElement.textContent = bpm.toFixed(1);
		}
		if (this.#bpmSourceElement) {
			this.#bpmSourceElement.textContent = source;
		}
	}

	#updateMIDIStatus(connected) {
		if (this.#midiStatusElement) {
			this.#midiStatusElement.textContent = connected ? 'Connected' : 'Disconnected';
			this.#midiStatusElement.style.color = connected ? '#0f0' : '#f00';
		}
	}

	#addLogEntry(type, message) {
		this.#midiLog.unshift({ type, message, time: performance.now() });
		if (this.#midiLog.length > MAX_LOG_ENTRIES) {
			this.#midiLog.pop();
		}
		this.#renderLog();
	}

	#renderLog() {
		if (!this.#midiLogElement) {
			return;
		}
		this.#midiLogElement.textContent = '';
		// Build DOM safely (avoid innerHTML with dynamic content)
		for (const entry of this.#midiLog) {
			const div = document.createElement('div');
			div.className = `debug-log-entry ${entry.type}`;
			div.textContent = entry.message;
			this.#midiLogElement.appendChild(div);
		}
	}

	#formatNote(note) {
		const octave = Math.floor(note / NOTES_PER_OCTAVE) - 1;
		return `${NOTE_NAMES[note % NOTES_PER_OCTAVE]}${octave}`;
	}

	setup() {
		document.body.appendChild(this.#element);
		document.addEventListener('keydown', this.#boundHandleKeydown);
		this.#subscribeToEvents();
		this.#updateBPM(appState.bpm, appState.bpmSource);
		this.#updateMIDIStatus(appState.midiConnected);
	}

	#subscribeToEvents() {
		this.#subscribeBPMEvents();
		this.#subscribeNoteEvents();
		this.#subscribeControlChangeEvents();
	}

	#subscribeBPMEvents() {
		this.#unsubscribers.push(
			appState.subscribe(EVENT_BPM_CHANGED, event => {
				this.#updateBPM(event.detail.bpm, event.detail.source);
			})
		);
		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_CONNECTION_CHANGED, event => {
				this.#updateMIDIStatus(event.detail.connected);
			})
		);
	}

	#subscribeNoteEvents() {
		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_NOTE_ON, event => {
				const { channel, note, velocity } = event.detail;
				this.#addLogEntry('note-on', `CH${channel + 1} ${this.#formatNote(note)} v${velocity}`);
			})
		);
		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_NOTE_OFF, event => {
				const { channel, note } = event.detail;
				this.#addLogEntry('note-off', `CH${channel + 1} ${this.#formatNote(note)} OFF`);
			})
		);
	}

	#subscribeControlChangeEvents() {
		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_CONTROL_CHANGE, event => {
				const { channel, controller, value } = event.detail;
				this.#addLogEntry('cc', `CH${channel + 1} CC${controller}=${value}`);
			})
		);
	}

	destroy() {
		this.#removeKeydownListener();
		this.#unsubscribeAll();
		this.#removeDOMElements();
		this.#midiLog = [];
	}

	#removeKeydownListener() {
		try {
			document.removeEventListener('keydown', this.#boundHandleKeydown);
		} catch (error) {
			console.error('Error removing keydown listener in DebugOverlay:', error);
		}
	}

	#unsubscribeAll() {
		for (const unsubscribe of this.#unsubscribers) {
			try {
				unsubscribe();
			} catch (error) {
				console.error('Error unsubscribing in DebugOverlay:', error);
			}
		}
		this.#unsubscribers = [];
	}

	#removeDOMElements() {
		try {
			this.#element?.remove();
		} catch (error) {
			console.error('Error removing DebugOverlay element:', error);
		}
	}
}

export default DebugOverlay;
