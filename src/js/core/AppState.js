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
	#clockCount = 0;
	#accumulatedClockTime = 0;
	#clockTimeoutId = null;
	#beatMeasurements = []; // Rolling window of beat duration measurements
	#pulseTimestamps = []; // Recent pulse timestamps for sub-beat calculation

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
	 * @returns {number} Current BPM
	 */
	get bpm() {
		return this.#currentBPM;
	}

	/**
	 * Set the BPM value directly (for testing or manual override)
	 * @param {number} value - BPM value (will be clamped to min/max range)
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
	 * Improved algorithm for reduced jitter:
	 * 1. Calculates BPM more frequently (every 6 pulses = 16th note resolution)
	 * 2. Uses rolling average over multiple beat measurements
	 * 3. Rejects outlier measurements that deviate too far from the average
	 * 4. Applies exponential smoothing on top for extra stability
	 *
	 * @param {number} timestamp - Performance.now() timestamp
	 */
	dispatchMIDIClock(timestamp) {
		// Clear any existing timeout
		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
		}

		// Set timeout to fall back to CC if clock stops
		this.#clockTimeoutId = setTimeout(() => {
			const now = performance.now();
			// Only fall back if the last clock timestamp is older than the timeout
			if (this.#bpmSource === 'clock' && (this.#lastClockTime === null || now - this.#lastClockTime > settings.bpm.clockTimeoutMs)) {
				this.#bpmSource = 'cc';
				// Don't change BPM value, just the source
				this.dispatchEvent(
					new CustomEvent('bpmSourceChanged', {
						detail: { source: 'cc', bpm: this.#currentBPM }
					})
				);
			}
			this.#clockTimeoutId = null;
		}, settings.bpm.clockTimeoutMs);

		// Track pulse timestamps for sub-beat calculation
		this.#pulseTimestamps.push(timestamp);

		// Keep only the last 25 timestamps (24 intervals = 1 beat)
		if (this.#pulseTimestamps.length > 25) {
			this.#pulseTimestamps.shift();
		}

		if (this.#lastClockTime !== null) {
			this.#accumulatedClockTime += timestamp - this.#lastClockTime;
			this.#clockCount++;

			const pulsesPerUpdate = settings.bpm.pulsesPerUpdate ?? 6;

			// Calculate BPM more frequently for smoother updates
			if (this.#clockCount >= pulsesPerUpdate) {
				// Extrapolate to full beat: (accumulated time / pulses counted) * 24
				const msPerPulse = this.#accumulatedClockTime / this.#clockCount;
				const msPerBeat = msPerPulse * 24;

				// Ignore suspiciously fast clock (likely error): < 10 ms per beat -> > 6000 BPM
				if (msPerBeat < 10) {
					this.#clockCount = 0;
					this.#accumulatedClockTime = 0;
					this.#lastClockTime = timestamp;
					return;
				}

				const rawBPM = 60000 / msPerBeat;

				// Add to rolling window of measurements
				const windowSize = settings.bpm.rollingWindowSize ?? 8;
				const outlierThreshold = settings.bpm.outlierThreshold ?? 0.15;

				// Calculate rolling average for outlier detection
				let rollingAvg = rawBPM;
				if (this.#beatMeasurements.length > 0) {
					rollingAvg = this.#beatMeasurements.reduce((a, b) => a + b, 0) / this.#beatMeasurements.length;
				}

				// Reject outliers that deviate too far from the rolling average
				// Guard against division by zero in case rollingAvg is 0 (should be unlikely)
				const deviation = rollingAvg > 0 ? Math.abs(rawBPM - rollingAvg) / rollingAvg : 0;
				const isOutlier = this.#beatMeasurements.length >= 2 && deviation > outlierThreshold;

				if (!isOutlier) {
					// Add measurement to rolling window
					this.#beatMeasurements.push(rawBPM);
					if (this.#beatMeasurements.length > windowSize) {
						this.#beatMeasurements.shift();
					}

					// Calculate averaged BPM from rolling window
					const avgBPM = this.#beatMeasurements.reduce((a, b) => a + b, 0) / this.#beatMeasurements.length;

					// Apply exponential smoothing on top of the rolling average
					const smoothingFactor = settings.bpm.smoothingFactor;
					let smoothedBPM;

					// For the very first clock-derived BPM, prefer the avgBPM (no smoothing)
					if (this.#bpmSource !== 'clock' || this.#currentBPM === settings.bpm.default) {
						smoothedBPM = avgBPM;
					} else {
						smoothedBPM = this.#currentBPM * smoothingFactor + avgBPM * (1 - smoothingFactor);
					}

					this.#setBPM(smoothedBPM, 'clock');
				}

				this.#clockCount = 0;
				this.#accumulatedClockTime = 0;
			}
		}
		this.#lastClockTime = timestamp;

		// Dispatch clock event for any listeners
		this.dispatchEvent(
			new CustomEvent('midiClock', {
				detail: { timestamp }
			})
		);
	}

	/**
	 * Handle MIDI Start message (0xFA)
	 * Resets clock counter for fresh BPM calculation
	 */
	dispatchMIDIStart() {
		this.#lastClockTime = null;
		this.#clockCount = 0;
		this.#accumulatedClockTime = 0;
		this.#beatMeasurements = [];
		this.#pulseTimestamps = [];

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
		// Clear clock timing but keep the current BPM
		this.#lastClockTime = null;
		this.#clockCount = 0;
		this.#accumulatedClockTime = 0;
		// Keep beatMeasurements for faster re-lock on continue
		this.#pulseTimestamps = [];

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
		this.#clockCount = 0;
		this.#accumulatedClockTime = 0;
		this.#beatMeasurements = [];
		this.#pulseTimestamps = [];

		if (this.#clockTimeoutId !== null) {
			clearTimeout(this.#clockTimeoutId);
			this.#clockTimeoutId = null;
		}
	}
}

const appState = new AppState();

export default appState;
