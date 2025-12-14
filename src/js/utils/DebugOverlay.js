/**
 * DebugOverlay - Displays real-time MIDI and timing information
 * Toggle visibility with 'D' key
 */
import appState from '../core/AppState.js';

class DebugOverlay {
	#element;
	#styleElement;
	#midiLog = [];
	#maxLogEntries = 8;
	#unsubscribers = [];
	#boundToggle;
	#visible = false;

	constructor() {
		this.#boundToggle = this.#handleKeydown.bind(this);
		this.#createOverlay();
	}

	#createOverlay() {
		this.#element = document.createElement('div');
		this.#element.id = 'debug-overlay';
		this.#element.innerHTML = `
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
		this.#applyStyles();
	}

	#applyStyles() {
		// Check if style already exists (e.g., from HMR)
		if (document.getElementById('debug-overlay-styles')) {
			return;
		}
		const style = document.createElement('style');
		style.id = 'debug-overlay-styles';
		style.textContent = `
			#debug-overlay {
				position: fixed;
				top: 10px;
				right: 10px;
				background: rgba(0, 0, 0, 0.85);
				color: #0f0;
				font-family: 'Courier New', monospace;
				font-size: 12px;
				padding: 10px;
				border-radius: 4px;
				border: 1px solid #0f0;
				z-index: 9999;
				min-width: 200px;
				display: none;
				pointer-events: none;
			}
			#debug-overlay.visible {
				display: block;
			}
			.debug-header {
				font-weight: bold;
				margin-bottom: 8px;
				padding-bottom: 4px;
				border-bottom: 1px solid #0f0;
			}
			.debug-hint {
				font-weight: normal;
				font-size: 10px;
				opacity: 0.6;
			}
			.debug-section {
				display: flex;
				margin: 4px 0;
			}
			.debug-label {
				width: 50px;
				color: #888;
			}
			.debug-value {
				flex: 1;
				text-align: right;
			}
			.debug-log {
				flex: 1;
				font-size: 10px;
				max-height: 120px;
				overflow: hidden;
			}
			.debug-log-entry {
				margin: 2px 0;
				opacity: 0.9;
			}
			.debug-log-entry.note-on { color: #0f0; }
			.debug-log-entry.note-off { color: #f80; }
			.debug-log-entry.cc { color: #08f; }
			.debug-log-entry.clock { color: #888; }
		`;
		this.#styleElement = style;
		document.head.appendChild(style);
	}

	#handleKeydown(e) {
		if (e.key === 'd' || e.key === 'D') {
			// Don't toggle if user is typing in an input
			const targetTag = e.target?.tagName?.toUpperCase();
			if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
				return;
			}
			this.#visible = !this.#visible;
			this.#element.classList.toggle('visible', this.#visible);
		}
	}

	#updateBPM(bpm, source) {
		const bpmEl = document.getElementById('debug-bpm');
		const sourceEl = document.getElementById('debug-bpm-source');
		if (bpmEl) {
			bpmEl.textContent = bpm.toFixed(1);
		}
		if (sourceEl) {
			sourceEl.textContent = source;
		}
	}

	#updateMIDIStatus(connected) {
		const el = document.getElementById('debug-midi-status');
		if (el) {
			el.textContent = connected ? 'Connected' : 'Disconnected';
			el.style.color = connected ? '#0f0' : '#f00';
		}
	}

	#addLogEntry(type, message) {
		this.#midiLog.unshift({ type, message, time: performance.now() });
		if (this.#midiLog.length > this.#maxLogEntries) {
			this.#midiLog.pop();
		}
		this.#renderLog();
	}

	#renderLog() {
		const el = document.getElementById('debug-midi-log');
		if (!el) {
			return;
		}
		// Clear existing content
		el.textContent = '';
		// Build DOM safely (avoid innerHTML with dynamic content)
		for (const entry of this.#midiLog) {
			const div = document.createElement('div');
			div.className = `debug-log-entry ${entry.type}`;
			div.textContent = entry.message;
			el.appendChild(div);
		}
	}

	#formatNote(note) {
		const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		const octave = Math.floor(note / 12) - 1;
		return `${notes[note % 12]}${octave}`;
	}

	init() {
		document.body.appendChild(this.#element);
		document.addEventListener('keydown', this.#boundToggle);

		// Subscribe to BPM changes
		this.#unsubscribers.push(
			appState.subscribe('bpmChanged', e => {
				this.#updateBPM(e.detail.bpm, e.detail.source);
			})
		);

		// Subscribe to MIDI connection
		this.#unsubscribers.push(
			appState.subscribe('midiConnectionChanged', e => {
				this.#updateMIDIStatus(e.detail.connected);
			})
		);

		// Subscribe to Note On
		this.#unsubscribers.push(
			appState.subscribe('midiNoteOn', e => {
				const { channel, note, velocity } = e.detail;
				this.#addLogEntry('note-on', `CH${channel + 1} ${this.#formatNote(note)} v${velocity}`);
			})
		);

		// Subscribe to Note Off
		this.#unsubscribers.push(
			appState.subscribe('midiNoteOff', e => {
				const { channel, note } = e.detail;
				this.#addLogEntry('note-off', `CH${channel + 1} ${this.#formatNote(note)} OFF`);
			})
		);

		// Subscribe to CC
		this.#unsubscribers.push(
			appState.subscribe('midiControlChange', e => {
				const { channel, controller, value } = e.detail;
				this.#addLogEntry('cc', `CH${channel + 1} CC${controller}=${value}`);
			})
		);

		// Initialize with current state
		this.#updateBPM(appState.bpm, appState.bpmSource);
		this.#updateMIDIStatus(appState.midiConnected);
	}

	destroy() {
		document.removeEventListener('keydown', this.#boundToggle);
		for (const unsubscribe of this.#unsubscribers) {
			unsubscribe();
		}
		this.#unsubscribers = [];
		this.#element?.remove();
		this.#styleElement?.remove();
		this.#midiLog = [];
	}
}

export default DebugOverlay;
