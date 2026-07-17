import defaultSettings from './settings.js';

const EVENT_MIDI_CONNECTION_CHANGED = 'midiConnectionChanged';
const EVENT_CLIPS_LOADED_CHANGED = 'clipsLoadedChanged';
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
const MAX_MIDI_CC_VALUE = 127;
const MIN_CLOCK_INTERVALS_FOR_BPM = 6;
const BPM_CHANGE_THRESHOLD = 0.01;
const MS_PER_MINUTE = 60000;

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
	#isMidiConnected = false;
	#isClipsLoaded = false;

	// BPM state
	#currentBPM;
	#bpmSource = BPM_SOURCE_DEFAULT; // 'default', 'clock', 'cc', or 'manual'

	// MIDI Clock timing state
	#lastClockTime = null;
	#clockTimeoutId = null;
	#recentPulseIntervals = []; // Last few pulse intervals for BPM calculation
	#resetGeneration = 0; // Increments on each reset() to invalidate pending callbacks

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
	#convertCCToBPM(ccValue) {
		const { min, max } = this.#settings.bpm;
		const range = max - min;
		return min + (ccValue / MAX_MIDI_CC_VALUE) * range;
	}

	#dispatchStateEvent(eventName, detail) {
		this.dispatchEvent(new CustomEvent(eventName, { detail }));
	}

	#clampBPM(bpmValue) {
		const { min, max } = this.#settings.bpm;
		return Math.min(max, Math.max(min, bpmValue));
	}

	set midiConnected(connected) {
		if (this.#isMidiConnected !== connected) {
			this.#isMidiConnected = connected;
			this.#dispatchStateEvent(EVENT_MIDI_CONNECTION_CHANGED, { connected });
		}
	}

	get midiConnected() {
		return this.#isMidiConnected;
	}

	set clipsLoaded(loaded) {
		if (this.#isClipsLoaded !== loaded) {
			this.#isClipsLoaded = loaded;
			this.#dispatchStateEvent(EVENT_CLIPS_LOADED_CHANGED, { loaded });
		}
	}

	get clipsLoaded() {
		return this.#isClipsLoaded;
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
		if (channel === this.#settings.bpm.controlChannel && controller === this.#settings.bpm.controlCC && this.#bpmSource !== BPM_SOURCE_CLOCK) {
			this.#setBPM(this.#convertCCToBPM(value), BPM_SOURCE_CC);
		}

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
		this.#resetClockTimeout();
		this.#processClockPulse(timestamp);
		this.#dispatchStateEvent(EVENT_MIDI_CLOCK, { timestamp });
	}

	#resetClockTimeout() {
		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
		}
		const generation = this.#resetGeneration;
		this.#clockTimeoutId = setTimeout(() => {
			this.#clockTimeoutId = null;
			if (generation !== this.#resetGeneration) {
				return;
			}
			if (this.#bpmSource === BPM_SOURCE_CLOCK) {
				this.#bpmSource = BPM_SOURCE_DEFAULT;
				this.#dispatchStateEvent(EVENT_BPM_SOURCE_CHANGED, { source: BPM_SOURCE_DEFAULT, bpm: this.#currentBPM });
			}
		}, this.#settings.bpm.clockTimeoutMs);
	}

	#processClockPulse(timestamp) {
		if (this.#lastClockTime === null) {
			this.#lastClockTime = timestamp;
			return;
		}

		const interval = timestamp - this.#lastClockTime;
		if (interval < 1) {
			return;
		}

		this.#recentPulseIntervals.push(interval);
		if (this.#recentPulseIntervals.length > this.#settings.midi.ppqn) {
			this.#recentPulseIntervals.shift();
		}

		if (this.#recentPulseIntervals.length >= MIN_CLOCK_INTERVALS_FOR_BPM) {
			this.#calculateBPMFromClock();
		}
		this.#lastClockTime = timestamp;
	}

	#calculateBPMFromClock() {
		let total = 0;
		for (const interval of this.#recentPulseIntervals) {
			total += interval;
		}
		const avgInterval = total / this.#recentPulseIntervals.length;
		const msPerBeat = avgInterval * this.#settings.midi.ppqn;
		const bpm = MS_PER_MINUTE / msPerBeat;
		this.#setBPM(bpm, BPM_SOURCE_CLOCK);
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
		const clampedBPM = Math.max(this.#settings.bpm.min, Math.min(this.#settings.bpm.max, bpm));

		const bpmChanged = Math.abs(this.#currentBPM - clampedBPM) > BPM_CHANGE_THRESHOLD;
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
		this.#isMidiConnected = false;
		this.#isClipsLoaded = false;

		this.#currentBPM = this.#settings.bpm.default;
		this.#bpmSource = BPM_SOURCE_DEFAULT;
		this.#lastClockTime = null;
		this.#recentPulseIntervals = [];

		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
			this.#clockTimeoutId = null;
		}
		this.#resetGeneration++;
	}
}

const appState = new AppState();

/**
 * Create a fresh AppState instance for testing isolation.
 * @param {Object} [settings] - Optional settings override
 * @returns {AppState}
 */
export function createAppState(settings) {
	return new AppState(settings);
}

export { AppState, EVENT_MIDI_CONNECTION_CHANGED, EVENT_CLIPS_LOADED_CHANGED, EVENT_BPM_CHANGED, EVENT_BPM_SOURCE_CHANGED, EVENT_MIDI_NOTE_ON, EVENT_MIDI_NOTE_OFF, EVENT_MIDI_CONTROL_CHANGE, EVENT_MIDI_CLOCK, EVENT_MIDI_START, EVENT_MIDI_CONTINUE, EVENT_MIDI_STOP, EVENT_VIDEO_JOCKEY_READY, BPM_SOURCE_CLOCK };
export default appState;
