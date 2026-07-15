import defaultSettings from './settings.js';

const EVENT_MIDI_CONNECTION_CHANGED = 'midiConnectionChanged';
const EVENT_ANIMATIONS_LOADED_CHANGED = 'animationsLoadedChanged';
const EVENT_BPM_CHANGED = 'bpmChanged';
const EVENT_BPM_SOURCE_CHANGED = 'bpmSourceChanged';
const EVENT_MIDI_NOTE_ON = 'midiNoteOn';
const EVENT_MIDI_NOTE_OFF = 'midiNoteOff';
const EVENT_MIDI_CONTROL_CHANGE = 'midiControlChange';
const EVENT_MIDI_CLOCK = 'midiClock';
const EVENT_MIDI_START = 'midiStart';
const EVENT_MIDI_CONTINUE = 'midiContinue';
const EVENT_MIDI_STOP = 'midiStop';
const EVENT_VIDEO_JOCKEY_READY = 'videoJockeyReady';
const BPM_SOURCE_DEFAULT = 'default';
const BPM_SOURCE_MANUAL = 'manual';
const BPM_SOURCE_CLOCK = 'clock';
const BPM_SOURCE_CC = 'cc';

/**
 * AppState - Event-based state management for AKVJ
 *
 * Provides centralized state with event notifications for loose coupling.
 * Handles all inter-module communication without direct references.
 * Extends EventTarget for native event dispatching and subscription.
 *
 * @extends EventTarget
 */
class AppState extends EventTarget {
	#settings;
	#midiConnected = false;
	#animationsLoaded = false;

	// BPM state
	#currentBPM;
	#bpmSource = BPM_SOURCE_DEFAULT; // 'default', 'clock', 'cc', or 'manual'

	// MIDI Clock timing state
	#lastClockTime = null;
	#clockTimeoutId = null;
	#recentPulseIntervals = []; // Last few pulse intervals for BPM calculation

	/**
	 * @param {Object} [settings=defaultSettings] - Runtime configuration (defaults to global settings)
	 */
	constructor(settings = defaultSettings) {
		super();
		this.#settings = settings;
		this.#currentBPM = this.#settings.bpm.default;
	}

	/**
	 * Convert a MIDI CC value (0-127) to BPM using the configured range.
	 * @param {number} ccValue - CC value (0-127)
	 * @returns {number} BPM value within configured min/max range
	 */
	#ccToBPM(ccValue) {
		const { min, max } = this.#settings.bpm;
		const range = max - min;
		return min + (ccValue / 127) * range;
	}

	#dispatchStateEvent(eventName, detail) {
		this.dispatchEvent(new CustomEvent(eventName, { detail }));
	}

	#clampBPM(bpmValue) {
		const { min, max } = this.#settings.bpm;
		return Math.min(max, Math.max(min, bpmValue));
	}

	set midiConnected(connected) {
		if (this.#midiConnected !== connected) {
			this.#midiConnected = connected;
			this.#dispatchStateEvent(EVENT_MIDI_CONNECTION_CHANGED, { connected });
		}
	}

	get midiConnected() {
		return this.#midiConnected;
	}

	set animationsLoaded(loaded) {
		if (this.#animationsLoaded !== loaded) {
			this.#animationsLoaded = loaded;
			this.#dispatchStateEvent(EVENT_ANIMATIONS_LOADED_CHANGED, { loaded });
		}
	}

	get animationsLoaded() {
		return this.#animationsLoaded;
	}

	/**
	 * Get the current BPM value
	 * @returns {number} Current BPM
	 */
	get bpm() {
		return this.#currentBPM;
	}

	/**
	 * Set the BPM value directly (for testing or manual override)
	 * @param {number} value - BPM value to set
	 */
	set bpm(value) {
		const clampedValue = this.#clampBPM(value);
		if (this.#currentBPM !== clampedValue) {
			this.#currentBPM = clampedValue;
			this.#bpmSource = BPM_SOURCE_MANUAL;
			this.#dispatchStateEvent(EVENT_BPM_CHANGED, { bpm: clampedValue, source: BPM_SOURCE_MANUAL });
		}
	}

	/**
	 * Get the current BPM source
	 * @returns {string} 'default', 'clock', 'cc', or 'manual'
	 */
	get bpmSource() {
		return this.#bpmSource;
	}

	/**
	 * Subscribe to state changes
	 * @param {string} eventName - The name of the event to subscribe to
	 * @param {Function} callback - The callback function to invoke when the event is dispatched
	 * @returns {Function} Unsubscribe function to remove the event listener
	 */
	subscribe(eventName, callback) {
		this.addEventListener(eventName, callback);
		return () => this.removeEventListener(eventName, callback);
	}

	/**
	 * Dispatch MIDI note on event with parsed data
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 */
	dispatchMIDINoteOn(channel, note, velocity) {
		this.#dispatchStateEvent(EVENT_MIDI_NOTE_ON, { channel, note, velocity });
	}

	/**
	 * Dispatch MIDI note off event with parsed data
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 */
	dispatchMIDINoteOff(channel, note) {
		this.#dispatchStateEvent(EVENT_MIDI_NOTE_OFF, { channel, note });
	}

	/**
	 * Dispatch MIDI Control Change event
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} controller - CC number (0-127)
	 * @param {number} value - CC value (0-127)
	 */
	dispatchMIDIControlChange(channel, controller, value) {
		// Check if this is the BPM controller and clock is not active
		if (channel === this.#settings.bpm.controlChannel && controller === this.#settings.bpm.controlCC && this.#bpmSource !== BPM_SOURCE_CLOCK) {
			this.#setBPM(this.#ccToBPM(value), BPM_SOURCE_CC);
		}

		// Dispatch generic CC event for other uses
		this.#dispatchStateEvent(EVENT_MIDI_CONTROL_CHANGE, { channel, controller, value });
	}

	/**
	 * Handle MIDI Clock pulse (0xF8)
	 * MIDI clock sends 24 pulses per quarter note (24 PPQN)
	 *
	 * Simple algorithm:
	 * 1. Track intervals between pulses
	 * 2. Average the last few intervals
	 * 3. Calculate BPM from average
	 *
	 * @param {number} timestamp - Performance.now() timestamp
	 */
	dispatchMIDIClock(timestamp) {
		// Clear any existing timeout
		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
		}

		// Set timeout to detect when clock stops
		this.#clockTimeoutId = setTimeout(() => {
			if (this.#bpmSource === BPM_SOURCE_CLOCK) {
				this.#bpmSource = BPM_SOURCE_DEFAULT;
				this.#dispatchStateEvent(EVENT_BPM_SOURCE_CHANGED, { source: BPM_SOURCE_DEFAULT, bpm: this.#currentBPM });
			}
			this.#clockTimeoutId = null;
		}, this.#settings.bpm.clockTimeoutMs);

		// Calculate interval from last pulse
		if (this.#lastClockTime !== null) {
			const interval = timestamp - this.#lastClockTime;

			// Ignore impossibly fast pulses (< 1ms = > 2500 BPM)
			if (interval >= 1) {
				// Keep last PPQN intervals (one beat worth)
				this.#recentPulseIntervals.push(interval);
				if (this.#recentPulseIntervals.length > this.#settings.midi.ppqn) {
					this.#recentPulseIntervals.shift();
				}

				// Calculate BPM from average interval
				// Need at least 6 intervals for reasonable accuracy (16th note)
				if (this.#recentPulseIntervals.length >= 6) {
					const avgInterval = this.#recentPulseIntervals.reduce((a, b) => a + b, 0) / this.#recentPulseIntervals.length;
					const msPerBeat = avgInterval * this.#settings.midi.ppqn; // PPQN
					const bpm = 60000 / msPerBeat;

					this.#setBPM(bpm, 'clock');
				}
			}
		}
		this.#lastClockTime = timestamp;

		// Dispatch clock event for animation sync
		this.#dispatchStateEvent(EVENT_MIDI_CLOCK, { timestamp });
	}

	/**
	 * Handle MIDI Start message (0xFA)
	 * Resets clock state for fresh sync
	 */
	dispatchMIDIStart() {
		this.#lastClockTime = null;
		this.#recentPulseIntervals = [];

		this.#dispatchStateEvent(EVENT_MIDI_START, {});
	}

	/**
	 * Handle MIDI Continue message (0xFB)
	 * Resumes clock counting from current state
	 */
	dispatchMIDIContinue() {
		this.#dispatchStateEvent(EVENT_MIDI_CONTINUE, {});
	}

	/**
	 * Handle MIDI Stop message (0xFC)
	 * Pauses BPM sync (keeps last BPM value)
	 */
	dispatchMIDIStop() {
		this.#lastClockTime = null;
		// Keep intervals for faster re-lock on continue

		this.#dispatchStateEvent(EVENT_MIDI_STOP, {});
	}

	/**
	 * Set BPM value and dispatch change event
	 * @param {number} bpm - New BPM value
	 * @param {string} source - BPM source ('default', 'clock', or 'cc')
	 */
	#setBPM(bpm, source) {
		// Clamp BPM to valid range
		const clampedBPM = Math.max(this.#settings.bpm.min, Math.min(this.#settings.bpm.max, bpm));

		const bpmChanged = Math.abs(this.#currentBPM - clampedBPM) > 0.01;
		const sourceChanged = this.#bpmSource !== source;

		this.#currentBPM = clampedBPM;
		this.#bpmSource = source;

		if (bpmChanged || sourceChanged) {
			this.#dispatchStateEvent(EVENT_BPM_CHANGED, { bpm: clampedBPM, source });
		}
	}

	/**
	 * Dispatch that the video jockey component is ready
	 */
	dispatchVideoJockeyReady() {
		this.#dispatchStateEvent(EVENT_VIDEO_JOCKEY_READY, {});
	}

	/**
	 * Reset state to initial values.
	 *
	 * This method is intended for use in tests or controlled cleanup scenarios,
	 * where you need to ensure the AppState is in its initial state without
	 * triggering event listeners or causing cascading state updates.
	 *
	 * It does NOT dispatch any change events, by design, to avoid unwanted
	 * side effects during teardown or test isolation.
	 *
	 * Note: Event listeners remain attached after reset. Use the unsubscribe
	 * function returned by subscribe() to remove listeners when needed.
	 *
	 * @example
	 * // In a test setup/teardown:
	 * import appState from './AppState';
	 * beforeEach(() => {
	 *   appState.reset();
	 * });
	 */
	reset() {
		this.#midiConnected = false;
		this.#animationsLoaded = false;

		// Reset BPM state
		this.#currentBPM = this.#settings.bpm.default;
		this.#bpmSource = BPM_SOURCE_DEFAULT;
		this.#lastClockTime = null;
		this.#recentPulseIntervals = [];

		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
			this.#clockTimeoutId = null;
		}
	}
}

const appState = new AppState();

export { AppState };
export default appState;
