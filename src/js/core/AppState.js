import settings from './settings.js';

/**
 * Convert a MIDI CC value (0-127) to BPM using the configured range
 * @param {number} ccValue - CC value (0-127)
 * @returns {number} BPM value within configured min/max range
 */
function ccToBPM(ccValue) {
	const { min, max } = settings.bpm;
	const range = max - min;
	return min + (ccValue / 127) * range;
}

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
	#midiConnected = false;
	#animationsLoaded = false;

	// BPM state
	#currentBPM = settings.bpm.default;
	#bpmSource = 'default'; // 'default', 'clock', or 'cc'

	// MIDI Clock timing state
	#lastClockTime = null;
	#clockTimeoutId = null;
	#recentPulseIntervals = []; // Last few pulse intervals for BPM calculation

	set midiConnected(connected) {
		if (this.#midiConnected !== connected) {
			this.#midiConnected = connected;
			this.dispatchEvent(
				new CustomEvent('midiConnectionChanged', {
					detail: { connected }
				})
			);
		}
	}

	get midiConnected() {
		return this.#midiConnected;
	}

	set animationsLoaded(loaded) {
		if (this.#animationsLoaded !== loaded) {
			this.#animationsLoaded = loaded;
			this.dispatchEvent(
				new CustomEvent('animationsLoadedChanged', {
					detail: { loaded }
				})
			);
		}
	}

	get animationsLoaded() {
		return this.#animationsLoaded;
	}

	/**
	 * Get the current BPM value
				if (this.#recentPulseIntervals.length > settings.midi.ppqn) {
	 */
	get bpm() {
		return this.#currentBPM;
	}

	/**
	 * Set the BPM value directly (for testing or manual override)
					const msPerBeat = avgInterval * settings.midi.ppqn; // PPQN
	 */
	set bpm(value) {
		const { min, max } = settings.bpm;
		const clampedValue = Math.min(max, Math.max(min, value));
		if (this.#currentBPM !== clampedValue) {
			this.#currentBPM = clampedValue;
			this.#bpmSource = 'manual';
			this.dispatchEvent(
				new CustomEvent('bpmChanged', {
					detail: { bpm: clampedValue, source: 'manual' }
				})
			);
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
		this.dispatchEvent(
			new CustomEvent('midiNoteOn', {
				detail: { channel, note, velocity }
			})
		);
	}

	/**
	 * Dispatch MIDI note off event with parsed data
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 */
	dispatchMIDINoteOff(channel, note) {
		this.dispatchEvent(
			new CustomEvent('midiNoteOff', {
				detail: { channel, note }
			})
		);
	}

	/**
	 * Dispatch MIDI Control Change event
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} controller - CC number (0-127)
	 * @param {number} value - CC value (0-127)
	 */
	dispatchMIDIControlChange(channel, controller, value) {
		// Check if this is the BPM controller and clock is not active
		if (channel === settings.bpm.controlChannel && controller === settings.bpm.controlCC && this.#bpmSource !== 'clock') {
			this.#setBPM(ccToBPM(value), 'cc');
		}

		// Dispatch generic CC event for other uses
		this.dispatchEvent(
			new CustomEvent('midiControlChange', {
				detail: { channel, controller, value }
			})
		);
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
			if (this.#bpmSource === 'clock') {
				this.#bpmSource = 'default';
				this.dispatchEvent(
					new CustomEvent('bpmSourceChanged', {
						detail: { source: 'default', bpm: this.#currentBPM }
					})
				);
			}
			this.#clockTimeoutId = null;
		}, settings.bpm.clockTimeoutMs);

		// Calculate interval from last pulse
		if (this.#lastClockTime !== null) {
			const interval = timestamp - this.#lastClockTime;

			// Ignore impossibly fast pulses (< 1ms = > 2500 BPM)
			if (interval >= 1) {
				// Keep last PPQN intervals (one beat worth)
				this.#recentPulseIntervals.push(interval);
				if (this.#recentPulseIntervals.length > settings.midi.ppqn) {
					this.#recentPulseIntervals.shift();
				}

				// Calculate BPM from average interval
				// Need at least 6 intervals for reasonable accuracy (16th note)
				if (this.#recentPulseIntervals.length >= 6) {
					const avgInterval = this.#recentPulseIntervals.reduce((a, b) => a + b, 0) / this.#recentPulseIntervals.length;
					const msPerBeat = avgInterval * settings.midi.ppqn; // PPQN
					const bpm = 60000 / msPerBeat;

					this.#setBPM(bpm, 'clock');
				}
			}
		}
		this.#lastClockTime = timestamp;

		// Dispatch clock event for animation sync
		this.dispatchEvent(
			new CustomEvent('midiClock', {
				detail: { timestamp }
			})
		);
	}

	/**
	 * Handle MIDI Start message (0xFA)
	 * Resets clock state for fresh sync
	 */
	dispatchMIDIStart() {
		this.#lastClockTime = null;
		this.#recentPulseIntervals = [];

		this.dispatchEvent(new CustomEvent('midiStart'));
	}

	/**
	 * Handle MIDI Continue message (0xFB)
	 * Resumes clock counting from current state
	 */
	dispatchMIDIContinue() {
		this.dispatchEvent(new CustomEvent('midiContinue'));
	}

	/**
	 * Handle MIDI Stop message (0xFC)
	 * Pauses BPM sync (keeps last BPM value)
	 */
	dispatchMIDIStop() {
		this.#lastClockTime = null;
		// Keep intervals for faster re-lock on continue

		this.dispatchEvent(new CustomEvent('midiStop'));
	}

	/**
	 * Set BPM value and dispatch change event
	 * @param {number} bpm - New BPM value
	 * @param {string} source - BPM source ('default', 'clock', or 'cc')
	 */
	#setBPM(bpm, source) {
		// Clamp BPM to valid range
		const clampedBPM = Math.max(settings.bpm.min, Math.min(settings.bpm.max, bpm));

		const bpmChanged = Math.abs(this.#currentBPM - clampedBPM) > 0.01;
		const sourceChanged = this.#bpmSource !== source;

		this.#currentBPM = clampedBPM;
		this.#bpmSource = source;

		if (bpmChanged || sourceChanged) {
			this.dispatchEvent(
				new CustomEvent('bpmChanged', {
					detail: { bpm: clampedBPM, source }
				})
			);
		}
	}

	/**
	 * Notify that the video jockey component is ready
	 */
	notifyVideoJockeyReady() {
		this.dispatchEvent(new CustomEvent('videoJockeyReady'));
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
		this.#currentBPM = settings.bpm.default;
		this.#bpmSource = 'default';
		this.#lastClockTime = null;
		this.#recentPulseIntervals = [];

		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
			this.#clockTimeoutId = null;
		}
	}
}

const appState = new AppState();

export default appState;
