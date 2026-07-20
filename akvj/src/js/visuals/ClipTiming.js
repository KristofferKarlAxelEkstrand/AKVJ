/**
 * ClipTiming — frame interval calculation and clock sync.
 *
 * Handles two timing modes:
 * 1. Free (FPS) — frame timing in frames-per-second (frameRatesForFrames), no sync
 * 2. Beat (BPM sync) — the whole clip is scaled to fit `syncBeats` total beats as a unit,
 *    preserving each frame's natural relative timing:
 *    - Time-based (no MIDI clock): a speed multiplier scales every frame's natural
 *      (FPS-derived) interval
 *    - Clock-driven (MIDI clock active, 24 PPQN): a precomputed cumulative-proportion
 *      table maps clock-pulse progress to a duration-weighted progress value passed to
 *      PlaybackController.setLinearProgress() — BPM is irrelevant, pulses are the tempo
 *
 * BPM and clock sources are injected for testability.
 */

import settings from '../core/settings.js';
import appState, { BPM_SOURCE_CLOCK, EVENT_MIDI_CLOCK, EVENT_MIDI_START } from '../core/AppState.js';
import { MS_PER_MINUTE } from '../utils/timing.js';
import { msToFps } from './timingConversion.js';

const MS_PER_SECOND = 1000;

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
 * @param {Object|null} options.frameDurationsMs - Frame index → ms per frame (takes priority over FPS)
 * @param {number|null} options.syncBeats - Resolved total clip duration in beats for
 *   `sync: "beat"` clips (null for free/unsynced clips)
 * @param {number} options.frames - Total frame count
 * @param {BpmProvider} [options.bpmProvider] - Function returning current BPM
 * @param {ClockSource} [options.clockSource] - Object with bpmSource getter and subscribe method
 */
class ClipTiming {
	#frameCount;
	#frameRatesForFrames;
	#frameDurationsMs;
	#defaultFrameRate;
	#naturalDuration;
	#cumulativeProportions;
	#isUsingBPMSync = false;
	#syncBeats = null;
	#totalPulses = null;
	#pulseCount = 0;
	#lastTimestamp = null;
	#clockUnsubscribe = null;
	#bpmProvider;
	#clockSource;
	#currentFrameIndex = 0;

	constructor({ frameRatesForFrames, frameDurationsMs, syncBeats, frames, bpmProvider, clockSource }) {
		this.#bpmProvider = bpmProvider ?? (() => appState.bpm);
		this.#clockSource = clockSource ?? defaultClockSource;
		this.#frameCount = frames;

		this.#initFrameRates(frameRatesForFrames, frameDurationsMs, frames);
		this.#initDefaultFrameRate();
		this.#naturalDuration = this.#computeNaturalDuration(frames);
		this.#cumulativeProportions = this.#computeCumulativeProportions(frames);

		if (syncBeats !== null && syncBeats !== undefined) {
			this.#initBPMSync(syncBeats);
		}
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
		return this.#isUsingBPMSync && this.#clockSource.bpmSource === BPM_SOURCE_CLOCK;
	}

	/**
	 * Calculate the interval (ms) for a given frame.
	 * Uses ms values directly when available (frameDurationsMs), falling back to FPS conversion.
	 * In beat mode, scales the frame's natural interval by the speed multiplier needed to fit
	 * `syncBeats` total beats at the current BPM (the whole clip is stretched/compressed as a unit —
	 * each frame keeps its relative speed).
	 * @param {number} frameIndex - The frame index
	 * @returns {number} - Interval in milliseconds
	 */
	getFrameInterval(frameIndex) {
		// Use ms values directly when available (no FPS conversion needed)
		const naturalInterval = this.#frameDurationsMs[frameIndex] ?? MS_PER_SECOND / (this.#frameRatesForFrames[frameIndex] ?? this.#defaultFrameRate);

		if (!this.#isUsingBPMSync) {
			return naturalInterval;
		}

		const minBPM = settings.bpm.min > 0 ? settings.bpm.min : 1;
		const maxBPM = settings.bpm.max > minBPM ? settings.bpm.max : minBPM;
		let bpm = this.#bpmProvider();
		if (Number.isFinite(bpm)) {
			bpm = Math.min(Math.max(bpm, minBPM), maxBPM);
		}
		const targetDuration = (this.#syncBeats * MS_PER_MINUTE) / bpm;
		const speedMultiplier = targetDuration / this.#naturalDuration;
		return naturalInterval * speedMultiplier;
	}

	/**
	 * Advance frames based on elapsed time.
	 * Calls `onAdvance()` for each frame interval elapsed; stops if it returns false.
	 * Used for free mode and time-based beat mode (unchanged for clock-driven — see
	 * `subscribeToClock`).
	 * @param {number} timestamp - Current performance.now() timestamp
	 * @param {() => boolean} onAdvance - Callback returning true to continue, false to stop
	 */
	advanceFrame(timestamp, onAdvance) {
		if (this.isClockDriven) {
			this.#lastTimestamp = null;
			return;
		}
		if (this.#lastTimestamp === null) {
			this.#lastTimestamp = timestamp;
		}

		let elapsedMs = timestamp - this.#lastTimestamp;
		while (elapsedMs > 0) {
			const intervalMs = this.getFrameInterval(this.#currentFrameIndex);
			if (elapsedMs < intervalMs) {
				break;
			}
			elapsedMs -= intervalMs;
			if (!onAdvance()) {
				break;
			}
		}
		this.#lastTimestamp = timestamp - Math.max(0, elapsedMs);
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
	 * Also listens for MIDI Start so residual pulse phase is cleared on DAW restart.
	 * Only subscribes if this clip uses BPM sync. Does not reset on Continue.
	 * @param {(progress: number) => boolean} onAdvance - Callback for clock-driven
	 *   progress advance; receives a 0.0-1.0 duration-weighted progress value and
	 *   returns true to keep playing, false once playback is finished
	 */
	subscribeToClock(onAdvance) {
		if (this.#isUsingBPMSync && !this.#clockUnsubscribe) {
			const unsubscribeFromClockPulses = this.#clockSource.subscribe(EVENT_MIDI_CLOCK, () => this.#handleClockPulse(onAdvance));
			const unsubscribeFromMidiStart = this.#clockSource.subscribe(EVENT_MIDI_START, () => this.reset());
			this.#clockUnsubscribe = () => {
				let firstError = null;
				for (const unsubscribe of [unsubscribeFromClockPulses, unsubscribeFromMidiStart]) {
					try {
						unsubscribe();
					} catch (error) {
						firstError ??= error;
					}
				}
				if (firstError) {
					throw firstError;
				}
			};
		}
	}

	/**
	 * Unsubscribe from MIDI clock events.
	 */
	unsubscribeFromClock() {
		if (this.#clockUnsubscribe) {
			try {
				this.#clockUnsubscribe();
			} catch (error) {
				console.error('Error unsubscribing from clock events in ClipTiming:', error);
			}
			this.#clockUnsubscribe = null;
		}
	}

	/**
	 * Reset timing state (lastTimestamp, pulseCount). Also runs on retrigger, so a
	 * clock-driven clip starts its own independent pulse count from the trigger
	 * moment, ignoring wherever the global MIDI clock currently is.
	 */
	reset() {
		this.#lastTimestamp = null;
		this.#pulseCount = 0;
	}

	/**
	 * Initialize BPM sync mode from the clip's resolved total sync duration in beats.
	 * @param {number} syncBeats
	 */
	#initBPMSync(syncBeats) {
		if (typeof syncBeats !== 'number' || syncBeats <= 0) {
			throw new Error('ClipTiming: invalid syncBeats');
		}
		this.#isUsingBPMSync = true;
		this.#syncBeats = syncBeats;
		this.#totalPulses = Math.max(1, Math.round(syncBeats * settings.midi.ppqn));
	}

	/**
	 * Validate and store frame timing, supporting both ms-based (priority) and FPS-based (fallback).
	 * @param {Object} frameRatesForFrames - Frame index → FPS mapping
	 * @param {Object|null} frameDurationsMs - Frame index → ms per frame mapping
	 * @param {number} frames - Total frame count for bounds checking
	 */
	#initFrameRates(frameRatesForFrames, frameDurationsMs, frames) {
		this.#frameDurationsMs = {};
		this.#frameRatesForFrames = {};

		// Priority: frameDurationsMs (ms-based timing)
		if (frameDurationsMs && typeof frameDurationsMs === 'object') {
			for (const [frameIndex, durationMs] of Object.entries(frameDurationsMs)) {
				const numericFrameIndex = Number(frameIndex);
				if (!Number.isInteger(numericFrameIndex) || numericFrameIndex < 0 || numericFrameIndex >= frames) {
					console.warn(`ClipTiming: frame duration key ${frameIndex} is not a valid frame index; skipping`);
					continue;
				}
				if (typeof durationMs === 'number' && durationMs > 0) {
					this.#frameDurationsMs[numericFrameIndex] = durationMs;
					// Also compute FPS for backward compatibility using utility
					this.#frameRatesForFrames[numericFrameIndex] = msToFps(durationMs);
				} else {
					console.warn(`ClipTiming: invalid frame duration for frame ${frameIndex}: ${durationMs}; skipping`);
				}
			}
		}

		// Fallback: frameRatesForFrames (FPS-based timing) - only if no ms values were stored
		if (Object.keys(this.#frameDurationsMs).length === 0) {
			for (const [frameIndex, frameRate] of Object.entries(frameRatesForFrames ?? {})) {
				const numericFrameIndex = Number(frameIndex);
				if (!Number.isInteger(numericFrameIndex) || numericFrameIndex < 0 || numericFrameIndex >= frames) {
					console.warn(`ClipTiming: frame rate key ${frameIndex} is not a valid frame index; skipping`);
					continue;
				}
				if (typeof frameRate === 'number' && frameRate > 0) {
					this.#frameRatesForFrames[numericFrameIndex] = frameRate;
				} else {
					console.warn(`ClipTiming: invalid frame rate for frame ${frameIndex}: ${frameRate}; skipping`);
				}
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
	 * Sum of natural frame intervals — the clip's unscaled duration.
	 * Uses ms values directly when available, falling back to FPS conversion.
	 * @param {number} frames
	 * @returns {number} Duration in milliseconds
	 */
	#computeNaturalDuration(frames) {
		let totalMs = 0;
		for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
			// Use ms values directly when available
			const intervalMs = this.#frameDurationsMs[frameIndex] ?? MS_PER_SECOND / (this.#frameRatesForFrames[frameIndex] ?? this.#defaultFrameRate);
			totalMs += intervalMs;
		}
		return totalMs;
	}

	/**
	 * Precompute cumulative natural-duration proportions per frame, static for the
	 * clip's lifetime (frame timing is clip metadata, not live state).
	 * `cumulativeProportions[i]` is the fraction of total natural duration elapsed
	 * at the start of frame i.
	 * @param {number} frames
	 * @returns {number[]} Length `frames`; values from 0.0 (frame 0's start) up to <1.0
	 */
	#computeCumulativeProportions(frames) {
		const proportions = [];
		let elapsedMs = 0;
		for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
			proportions.push(this.#naturalDuration > 0 ? elapsedMs / this.#naturalDuration : 0);
			// Use ms values directly when available
			const intervalMs = this.#frameDurationsMs[frameIndex] ?? MS_PER_SECOND / (this.#frameRatesForFrames[frameIndex] ?? this.#defaultFrameRate);
			elapsedMs += intervalMs;
		}
		return proportions;
	}

	/**
	 * Find the frame whose natural-duration span contains the given progress, via
	 * the precomputed cumulative-proportion table.
	 * @param {number} progress - Clamped 0.0-1.0
	 * @returns {number} Frame index
	 */
	#linearFrameIndexForProgress(progress) {
		for (let frameIndex = this.#frameCount - 1; frameIndex >= 0; frameIndex--) {
			if (this.#cumulativeProportions[frameIndex] <= progress) {
				return frameIndex;
			}
		}
		return 0;
	}

	/**
	 * Convert raw clock-pulse progress (pulseCount / totalPulses) into a
	 * duration-weighted progress that PlaybackController.setLinearProgress() can
	 * quantize uniformly — folding in the clip's non-uniform per-frame natural
	 * durations via the cumulative-proportion table. PlaybackController owns
	 * reinterpreting this per playback mode (loop/reverse/pingpong); this step is
	 * only about timing.
	 * @param {number} rawProgress - pulseCount / totalPulses
	 * @returns {number} 0.0-1.0
	 */
	#toUniformProgress(rawProgress) {
		if (rawProgress >= 1) {
			return 1;
		}
		if (rawProgress <= 0) {
			return 0;
		}
		const linearFrameIndex = this.#linearFrameIndexForProgress(rawProgress);
		return (linearFrameIndex + 0.5) / this.#frameCount;
	}

	/**
	 * Handle a MIDI clock pulse for real-time sync mode. Advances pulseCount and
	 * calls onAdvance with duration-weighted progress on every pulse. Once a full
	 * cycle completes (progress reaches 1.0), wraps pulseCount only if onAdvance
	 * signals playback continues (loop); otherwise leaves it — the caller is
	 * expected to unsubscribe once finished.
	 * @param {(progress: number) => boolean} onAdvance - Callback for progress advance
	 */
	#handleClockPulse(onAdvance) {
		if (this.#clockSource.bpmSource !== BPM_SOURCE_CLOCK) {
			return;
		}

		this.#pulseCount++;
		const rawProgress = this.#pulseCount / this.#totalPulses;
		const playbackContinues = onAdvance(this.#toUniformProgress(rawProgress));

		if (rawProgress >= 1 && playbackContinues) {
			this.#pulseCount %= this.#totalPulses;
		}
	}
}

export default ClipTiming;
