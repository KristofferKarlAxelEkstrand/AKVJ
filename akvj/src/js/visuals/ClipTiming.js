/**
 * ClipTiming — frame interval calculation and clock sync.
 *
 * Handles two timing modes:
 * 1. frameRatesForFrames (FPS) — frame timing in frames-per-second (default)
 * 2. frameDurationBeats (BPM sync) — frame timing in beats, synced to current BPM
 *    When MIDI clock is active, uses real-time clock pulses (24 PPQN)
 *    When no clock, falls back to time-based BPM calculation
 *
 * BPM and clock sources are injected for testability.
 */

import settings from '../core/settings.js';
import appState, { BPM_SOURCE_CLOCK, EVENT_MIDI_CLOCK } from '../core/AppState.js';
import { MS_PER_MINUTE } from '../utils/timing.js';

const MS_PER_SECOND = 1000;
const DEFAULT_FRAME_DURATION_BEATS = 0.25;
const DEFAULT_PULSES_PER_FRAME = 6;

/** @typedef {() => number} BpmProvider */
/** @typedef {{ bpmSource: string, subscribe: (event: string, handler: () => void) => () => void }} ClockSource */

/**
 * Default clock source backed by the global appState singleton.
 * @type {ClockSource}
 */
const defaultClockSource = {
	get bpmSource() {
		return appState.bpmSource;
	},
	subscribe(event, handler) {
		return appState.subscribe(event, handler);
	}
};

/**
 * @param {Object} options
 * @param {Object} options.frameRatesForFrames - Frame index → FPS mapping
 * @param {number|number[]|null} options.frameDurationBeats - Beats per frame (single or per-frame array)
 * @param {number} options.frames - Total frame count
 * @param {BpmProvider} [options.bpmProvider] - Function returning current BPM
 * @param {ClockSource} [options.clockSource] - Object with bpmSource getter and subscribe method
 */
class ClipTiming {
	#frameRatesForFrames;
	#frameDurationBeats;
	#defaultFrameRate;
	#isUsingBPMSync = false;
	#pulsesPerFrame = null;
	#pulseCount = 0;
	#lastTime = null;
	#unsubscribeClock = null;
	#bpmProvider;
	#clockSource;
	#currentFrameIndex = 0;

	constructor({ frameRatesForFrames, frameDurationBeats, frames, bpmProvider, clockSource }) {
		this.#bpmProvider = bpmProvider ?? (() => appState.bpm);
		this.#clockSource = clockSource ?? defaultClockSource;

		if (frameDurationBeats !== null && frameDurationBeats !== undefined) {
			this.#initBPMSync(frameDurationBeats, frames);
		}
		this.#initFrameRates(frameRatesForFrames, frames);
		this.#initDefaultFrameRate();
	}

	/**
	 * Whether this clip uses BPM sync mode.
	 * @returns {boolean}
	 */
	get isUsingBPMSync() {
		return this.#isUsingBPMSync;
	}

	/**
	 * Whether clock pulses are currently driving frame advancement.
	 * @returns {boolean}
	 */
	get isClockDriven() {
		return this.#isUsingBPMSync && this.#pulsesPerFrame !== null && this.#clockSource.bpmSource === BPM_SOURCE_CLOCK;
	}

	/**
	 * Calculate the interval (ms) for a given frame.
	 * Uses BPM sync if frameDurationBeats is defined, otherwise uses frameRatesForFrames.
	 * @param {number} frameIndex - The frame index
	 * @returns {number} - Interval in milliseconds
	 */
	getFrameInterval(frameIndex) {
		if (this.#isUsingBPMSync && this.#frameDurationBeats) {
			const beats = this.#frameDurationBeats[frameIndex] ?? this.#frameDurationBeats[0] ?? DEFAULT_FRAME_DURATION_BEATS;
			const minBPM = settings.bpm.min > 0 ? settings.bpm.min : 1;
			const bpm = Math.max(minBPM, this.#bpmProvider());
			return (beats * MS_PER_MINUTE) / bpm;
		}

		const framesPerSecond = this.#frameRatesForFrames[frameIndex] ?? this.#defaultFrameRate;
		return MS_PER_SECOND / framesPerSecond;
	}

	/**
	 * Advance frames based on elapsed time.
	 * Calls `onAdvance()` for each frame interval elapsed; stops if it returns false.
	 * @param {number} timestamp - Current performance.now() timestamp
	 * @param {() => boolean} onAdvance - Callback returning true to continue, false to stop
	 */
	advanceFrame(timestamp, onAdvance) {
		if (this.isClockDriven) {
			this.#lastTime = null;
			return;
		}
		if (this.#lastTime === null) {
			this.#lastTime = timestamp;
		}

		let elapsed = timestamp - this.#lastTime;
		while (elapsed > 0) {
			const interval = this.getFrameInterval(this.#currentFrameIndex);
			if (elapsed < interval) {
				break;
			}
			elapsed -= interval;
			if (!onAdvance()) {
				break;
			}
		}
		this.#lastTime = timestamp - Math.max(0, elapsed);
	}

	/**
	 * Set the current frame index for interval lookup.
	 * Must be called before advanceFrame() so the correct interval is used.
	 * @param {number} frameIndex
	 */
	setCurrentFrameIndex(frameIndex) {
		this.#currentFrameIndex = frameIndex;
	}

	/**
	 * Subscribe to MIDI clock events for BPM-synced playback.
	 * Only subscribes if this clip uses BPM sync.
	 * @param {() => boolean} onAdvance - Callback for clock-driven frame advance
	 */
	subscribeToClock(onAdvance) {
		if (this.#isUsingBPMSync && !this.#unsubscribeClock) {
			this.#unsubscribeClock = this.#clockSource.subscribe(EVENT_MIDI_CLOCK, () => this.#handleClockPulse(onAdvance));
		}
	}

	/**
	 * Unsubscribe from MIDI clock events.
	 */
	unsubscribeFromClock() {
		if (this.#unsubscribeClock) {
			try {
				this.#unsubscribeClock();
			} catch (error) {
				console.error('Error unsubscribing from clock events in ClipTiming:', error);
			}
			this.#unsubscribeClock = null;
		}
	}

	/**
	 * Reset timing state (lastTime, pulseCount).
	 */
	reset() {
		this.#lastTime = null;
		this.#pulseCount = 0;
	}

	/**
	 * Initialize BPM sync mode from frameDurationBeats metadata.
	 * @param {number|number[]} frameDurationBeats
	 * @param {number} frames - Total frame count for array validation
	 */
	#initBPMSync(frameDurationBeats, frames) {
		this.#isUsingBPMSync = true;
		if (Array.isArray(frameDurationBeats)) {
			if (frameDurationBeats.length !== frames) {
				throw new Error(`Clip: frameDurationBeats array length (${frameDurationBeats.length}) must equal frames (${frames})`);
			}
			this.#frameDurationBeats = frameDurationBeats;
			this.#pulsesPerFrame = frameDurationBeats.map(beats => Math.round(beats * settings.midi.ppqn));
		} else if (typeof frameDurationBeats === 'number' && frameDurationBeats > 0) {
			this.#frameDurationBeats = Array(frames).fill(frameDurationBeats);
			this.#pulsesPerFrame = Array(frames).fill(Math.round(frameDurationBeats * settings.midi.ppqn));
		} else {
			throw new Error('Clip: invalid frameDurationBeats');
		}
	}

	/**
	 * Validate and store frame rates, skipping invalid entries.
	 * @param {Object} frameRatesForFrames - Frame index → FPS mapping
	 * @param {number} frames - Total frame count for bounds checking
	 */
	#initFrameRates(frameRatesForFrames, frames) {
		this.#frameRatesForFrames = {};
		for (const [frameIndex, frameRate] of Object.entries(frameRatesForFrames)) {
			const numericFrameIndex = Number(frameIndex);
			if (!Number.isInteger(numericFrameIndex) || numericFrameIndex < 0 || numericFrameIndex >= frames) {
				console.warn(`Clip: frame rate key ${frameIndex} is not a valid frame index; skipping`);
				continue;
			}
			if (typeof frameRate === 'number' && frameRate > 0) {
				this.#frameRatesForFrames[numericFrameIndex] = frameRate;
			} else {
				console.warn(`Clip: invalid frame rate for frame ${frameIndex}: ${frameRate}; skipping`);
			}
		}
	}

	/**
	 * Cache the default frame rate, preferring frame 0 or the first defined value.
	 */
	#initDefaultFrameRate() {
		const keys = Object.keys(this.#frameRatesForFrames);
		const maybeDefault = this.#frameRatesForFrames[0] ?? (keys.length ? this.#frameRatesForFrames[keys[0]] : undefined) ?? 1;
		this.#defaultFrameRate = typeof maybeDefault === 'number' && maybeDefault > 0 ? maybeDefault : 1;
	}

	/**
	 * Handle MIDI clock pulse for real-time sync mode.
	 * @param {() => boolean} onAdvance - Callback for frame advance
	 */
	#handleClockPulse(onAdvance) {
		if (this.#clockSource.bpmSource !== BPM_SOURCE_CLOCK) {
			return;
		}

		this.#pulseCount++;
		const pulsesNeeded = this.#pulsesPerFrame[this.#currentFrameIndex] ?? this.#pulsesPerFrame[0] ?? DEFAULT_PULSES_PER_FRAME;

		if (this.#pulseCount >= pulsesNeeded) {
			this.#pulseCount = 0;
			onAdvance();
		}
	}
}

export default ClipTiming;
