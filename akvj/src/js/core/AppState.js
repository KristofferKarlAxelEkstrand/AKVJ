import defaultSettings from './settings.js';
import { MS_PER_MINUTE, MS_PER_SECOND } from '../utils/timing.js';
import { MAX_MIDI_DATA_BYTE, DEFAULT_MAX_CLOCK_PULSES_PER_SECOND } from './midiConstants.js';

const EVENT_MIDI_CONNECTION_CHANGED = 'midiConnectionChanged';
const EVENT_MIDI_DEVICES_CHANGED = 'midiDevicesChanged';
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
const EVENT_PROJECT_SWITCH_REQUESTED = 'projectSwitchRequested';
const EVENT_PROJECT_CHANGED = 'projectChanged';
const EVENT_PROJECT_LOAD_START = 'projectLoadStart';
const EVENT_PROJECT_LOAD_COMPLETE = 'projectLoadComplete';
const EVENT_PROJECT_LOAD_ERROR = 'projectLoadError';
const EVENT_CLIP_LOAD_ERROR = 'clipLoadError';
const EVENT_USER_MESSAGE = 'userMessage';
const USER_MESSAGE_TYPES = new Set(['error', 'warning', 'info']);
const BPM_SOURCE_DEFAULT = 'default';
const BPM_SOURCE_MANUAL = 'manual';
const BPM_SOURCE_CLOCK = 'clock';
const BPM_SOURCE_CC = 'cc';
const MIN_CLOCK_INTERVALS_FOR_BPM = 6;
const BPM_CHANGE_THRESHOLD = 0.01;

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
	#activeProjectId = null;
	#isProjectSwitching = false;

	// BPM state
	#currentBPM;
	#bpmSource = BPM_SOURCE_DEFAULT; // 'default', 'clock', 'cc', or 'manual'

	// MIDI Clock timing state
	#lastClockTimestamp = null;
	#clockTimeoutId = null;
	#recentPulseIntervalsMs = []; // Last few pulse intervals (ms) for BPM calculation
	#resetGeneration = 0; // Increments on each reset() to invalidate pending callbacks
	#clockPulseCount = 0; // Rate limiting: count pulses in current time window
	#clockPulseWindowStart = 0; // Rate limiting: start of current time window

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
		return min + (ccValue / MAX_MIDI_DATA_BYTE) * range;
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
		this.#isClipsLoaded = loaded;
	}

	get clipsLoaded() {
		return this.#isClipsLoaded;
	}

	/**
	 * Get the currently active project ID.
	 * @returns {string|null}
	 */
	get activeProjectId() {
		return this.#activeProjectId;
	}

	/**
	 * Set the active project ID and announce the change.
	 * This is the output side of a project switch: EVENT_PROJECT_SWITCH_REQUESTED
	 * asks for one, EVENT_PROJECT_CHANGED reports the one now in effect.
	 * AppState is the single owner of this id — no other module keeps a copy.
	 * @param {string} projectId
	 */
	set activeProjectId(projectId) {
		if (this.#activeProjectId !== projectId) {
			this.#activeProjectId = projectId;
			this.#dispatchStateEvent(EVENT_PROJECT_CHANGED, { projectId });
		}
	}

	/**
	 * Whether a project switch is currently in progress.
	 * @returns {boolean}
	 */
	get isProjectSwitching() {
		return this.#isProjectSwitching;
	}

	/**
	 * Set project switching state and dispatch appropriate event.
	 * @param {boolean} switching
	 */
	set isProjectSwitching(switching) {
		this.#isProjectSwitching = switching;
		if (switching) {
			this.#dispatchStateEvent(EVENT_PROJECT_LOAD_START, {});
		}
	}

	/**
	 * Dispatch project load complete event.
	 * @param {string} projectId
	 */
	dispatchProjectLoadComplete(projectId) {
		this.#isProjectSwitching = false;
		this.#dispatchStateEvent(EVENT_PROJECT_LOAD_COMPLETE, { projectId });
	}

	/**
	 * Dispatch project load error event.
	 * @param {string} projectId
	 * @param {string} errorMessage
	 */
	dispatchProjectLoadError(projectId, errorMessage) {
		this.#isProjectSwitching = false;
		this.#dispatchStateEvent(EVENT_PROJECT_LOAD_ERROR, { projectId, errorMessage });
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
	 * @param {{ deviceId?: string|null, deviceName?: string|null }} [device] - Source input identity
	 */
	dispatchMIDINoteOn(channel, note, velocity, { deviceId = null, deviceName = null } = {}) {
		this.#dispatchStateEvent(EVENT_MIDI_NOTE_ON, { channel, note, velocity, deviceId, deviceName });
	}

	/**
	 * Dispatch a project selection request from MIDI.
	 * The note number corresponds to a project index in the projects index array.
	 * @param {number} note - MIDI note number (0-127), used as project index
	 */
	dispatchProjectSelection(note) {
		this.#dispatchStateEvent(EVENT_PROJECT_SWITCH_REQUESTED, { note });
	}

	/**
	 * Request a switch to a specific project by id.
	 * @param {string} projectId
	 */
	dispatchProjectSwitchRequest(projectId) {
		this.#dispatchStateEvent(EVENT_PROJECT_SWITCH_REQUESTED, { projectId });
	}

	/**
	 * Dispatch a clip-catalog load failure.
	 * @param {string} url - The catalog URL that failed
	 * @param {string} errorMessage - Error message
	 */
	dispatchClipLoadError(url, errorMessage) {
		this.#dispatchStateEvent(EVENT_CLIP_LOAD_ERROR, { url, errorMessage });
	}

	/**
	 * Dispatch MIDI note off event with parsed data
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {{ deviceId?: string|null, deviceName?: string|null }} [device] - Source input identity
	 */
	dispatchMIDINoteOff(channel, note, { deviceId = null, deviceName = null } = {}) {
		this.#dispatchStateEvent(EVENT_MIDI_NOTE_OFF, { channel, note, deviceId, deviceName });
	}

	/**
	 * Dispatch MIDI Control Change event
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} controller - CC number (0-127)
	 * @param {number} value - CC value (0-127)
	 * @param {{ deviceId?: string|null, deviceName?: string|null }} [device] - Source input identity
	 */
	dispatchMIDIControlChange(channel, controller, value, { deviceId = null, deviceName = null } = {}) {
		if (channel === this.#settings.bpm.controlChannel && controller === this.#settings.bpm.controlCC && this.#bpmSource !== BPM_SOURCE_CLOCK) {
			this.#setBPM(this.#convertCCToBPM(value), BPM_SOURCE_CC);
		}

		this.#dispatchStateEvent(EVENT_MIDI_CONTROL_CHANGE, { channel, controller, value, deviceId, deviceName });
	}

	/**
	 * Announce the current MIDI input device list (id, name, enabled).
	 * Fired on hot-plug and when a device is enabled/disabled.
	 * @param {{ id: string, name: string, enabled: boolean }[]} devices
	 */
	dispatchMIDIDevicesChanged(devices) {
		this.#dispatchStateEvent(EVENT_MIDI_DEVICES_CHANGED, { devices });
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
	 * Rate limiting: Reject excessive clock pulses to prevent CPU exhaustion
	 *
	 * @param {number} timestamp - Performance.now() timestamp
	 */
	dispatchMIDIClock(timestamp) {
		if (!this.#shouldProcessClockPulse(timestamp)) {
			return; // Rate limit exceeded, ignore this pulse
		}

		this.#resetClockTimeout();
		this.#processClockPulse(timestamp);
		this.#dispatchStateEvent(EVENT_MIDI_CLOCK, { timestamp });
	}

	/**
	 * Check if clock pulse should be processed based on rate limiting
	 * Consolidates rate-limiting logic to avoid double-increment bug
	 * @param {number} timestamp - Current timestamp
	 * @returns {boolean} True if pulse should be processed, false if rate limited
	 */
	#shouldProcessClockPulse(timestamp) {
		const maxPulsesPerSecond = this.#settings.midi?.maxClockPulsesPerSecond ?? DEFAULT_MAX_CLOCK_PULSES_PER_SECOND;
		const windowSizeMs = MS_PER_SECOND;

		if (this.#clockPulseWindowStart === 0) {
			this.#clockPulseWindowStart = timestamp;
			this.#clockPulseCount = 0;
		}

		if (timestamp - this.#clockPulseWindowStart > windowSizeMs) {
			this.#clockPulseWindowStart = timestamp;
			this.#clockPulseCount = 0;
		}

		if (this.#clockPulseCount >= maxPulsesPerSecond) {
			console.warn(`AppState: MIDI clock rate limit exceeded (${maxPulsesPerSecond} pulses/second), ignoring excess pulses`);
			return false;
		}

		this.#clockPulseCount++;
		return true;
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
		if (this.#lastClockTimestamp === null) {
			this.#lastClockTimestamp = timestamp;
			return;
		}

		const intervalMs = timestamp - this.#lastClockTimestamp;
		if (intervalMs < 1) {
			return;
		}

		this.#recentPulseIntervalsMs.push(intervalMs);
		if (this.#recentPulseIntervalsMs.length > this.#settings.midi.ppqn) {
			this.#recentPulseIntervalsMs.shift();
		}

		if (this.#recentPulseIntervalsMs.length >= MIN_CLOCK_INTERVALS_FOR_BPM) {
			this.#calculateBPMFromClock();
		}
	}

	#calculateBPMFromClock() {
		let totalMs = 0;
		for (const intervalMs of this.#recentPulseIntervalsMs) {
			totalMs += intervalMs;
		}
		const avgIntervalMs = totalMs / this.#recentPulseIntervalsMs.length;
		const msPerBeat = avgIntervalMs * this.#settings.midi.ppqn;
		const bpm = MS_PER_MINUTE / msPerBeat;
		this.#setBPM(bpm, BPM_SOURCE_CLOCK);
	}

	/**
	 * Handle MIDI Start message (0xFA)
	 * Resets clock state for fresh sync
	 */
	dispatchMIDIStart() {
		this.#lastClockTimestamp = null;
		this.#recentPulseIntervalsMs = [];

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
		this.#lastClockTimestamp = null;
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
		this.#activeProjectId = null;
		this.#isProjectSwitching = false;

		this.#currentBPM = this.#settings.bpm.default;
		this.#bpmSource = BPM_SOURCE_DEFAULT;
		this.#lastClockTimestamp = null;
		this.#recentPulseIntervalsMs = [];
		this.#clockPulseCount = 0;
		this.#clockPulseWindowStart = 0;

		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
			this.#clockTimeoutId = null;
		}
		this.#resetGeneration++;
	}

	/**
	 * Raise a user-facing modal message (consumed by `<akvj-user-messages>`).
	 * @param {{ type?: 'error'|'warning'|'info', text: string }} options
	 */
	showUserMessage({ type = 'info', text } = {}) {
		const normalizedType = USER_MESSAGE_TYPES.has(type) ? type : 'info';
		const messageText = String(text ?? '').trim();
		if (!messageText) {
			return;
		}
		this.#dispatchStateEvent(EVENT_USER_MESSAGE, { type: normalizedType, text: messageText });
	}

	/**
	 * Show an error message.
	 * @param {string} text
	 */
	showError(text) {
		this.showUserMessage({ type: 'error', text });
	}

	/**
	 * Show a warning message.
	 * @param {string} text
	 */
	showWarning(text) {
		this.showUserMessage({ type: 'warning', text });
	}

	/**
	 * Show an info message.
	 * @param {string} text
	 */
	showInfo(text) {
		this.showUserMessage({ type: 'info', text });
	}
}

const appState = globalThis.__AKVJ_APP_STATE__ ?? (globalThis.__AKVJ_APP_STATE__ = new AppState());

/**
 * Create a fresh AppState instance for testing isolation.
 * @param {Object} [settings] - Optional settings override
 * @returns {AppState}
 */
export function createAppState(settings) {
	return new AppState(settings);
}

export { AppState, EVENT_MIDI_CONNECTION_CHANGED, EVENT_MIDI_DEVICES_CHANGED, EVENT_BPM_CHANGED, EVENT_BPM_SOURCE_CHANGED, EVENT_MIDI_NOTE_ON, EVENT_MIDI_NOTE_OFF, EVENT_MIDI_CONTROL_CHANGE, EVENT_MIDI_CLOCK, EVENT_MIDI_START, EVENT_MIDI_CONTINUE, EVENT_MIDI_STOP, EVENT_VIDEO_JOCKEY_READY, EVENT_PROJECT_SWITCH_REQUESTED, EVENT_PROJECT_CHANGED, EVENT_PROJECT_LOAD_START, EVENT_PROJECT_LOAD_COMPLETE, EVENT_PROJECT_LOAD_ERROR, EVENT_CLIP_LOAD_ERROR, EVENT_USER_MESSAGE, USER_MESSAGE_TYPES, BPM_SOURCE_CLOCK };
export default appState;
