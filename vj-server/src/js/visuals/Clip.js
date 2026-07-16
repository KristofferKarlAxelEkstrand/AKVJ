/**
 * Clip - Handles individual sprite clip playback and rendering
 * Manages frame-based clips with customizable frame rates and loop behavior
 *
 * Supports two timing modes:
 * 1. frameRatesForFrames (FPS) - Frame timing in frames-per-second (default)
 * 2. frameDurationBeats (BPM sync) - Frame timing in beats, synced to current BPM
 *    When MIDI clock is active, uses real-time clock pulses (24 PPQN)
 *    When no clock, falls back to time-based BPM calculation
 */
import settings from '../core/settings.js';
import appState, { BPM_SOURCE_CLOCK, EVENT_MIDI_CLOCK } from '../core/AppState.js';

const MS_PER_MINUTE = 60000;
const MS_PER_SECOND = 1000;
const DEFAULT_FRAME_DURATION_BEATS = 0.25;
const DEFAULT_PULSES_PER_FRAME = 6;

class Clip {
	// Configuration (immutable after construction)
	#displayContext;
	#image;
	#numberOfFrames;
	#framesPerRow;
	#frameRatesForFrames;
	#frameDurationBeats; // Array or single number for BPM sync
	#frameWidth;
	#frameHeight;
	#isLooping;
	#shouldRetrigger;
	#bitDepth; // For mask mixing (1, 2, 4, or 8 bit)
	#canvasWidth;
	#canvasHeight;

	// Clip state (mutable)
	#frame = 0;
	/** @type {number|null} Last timestamp from performance.now(), null if never played */
	#lastTime = null;
	#lastAdvanceTimestamp = null; // Prevent double-advancement within same timestamp
	#isFinished = false;
	#defaultFrameRate; // Cached fallback rate when frame-specific rate is undefined
	#isUsingBPMSync = false; // Whether to use BPM sync mode
	#pulsesPerFrame; // Array of pulses per frame for clock sync (derived from frameDurationBeats)
	#pulseCount = 0; // Accumulated clock pulses since last frame advance
	#unsubscribeClock = null; // Cleanup for clock subscription

	constructor({ displayContext, image, numberOfFrames, framesPerRow, loop = true, frameRatesForFrames = { 0: 1 }, frameDurationBeats = null, retrigger = true, bitDepth = null }) {
		this.#validateConstructorParams(numberOfFrames, framesPerRow);
		this.#initCoreFields(displayContext, image, numberOfFrames, framesPerRow, bitDepth);
		this.#initTimingMode(frameDurationBeats, numberOfFrames, frameRatesForFrames);
		this.#initDimensions(image, numberOfFrames, framesPerRow);
		this.#isLooping = loop;
		this.#shouldRetrigger = retrigger;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
		this.#initDefaultFrameRate();
	}

	#validateConstructorParams(numberOfFrames, framesPerRow) {
		if (!numberOfFrames || numberOfFrames < 1) {
			throw new Error('Clip requires numberOfFrames >= 1');
		}
		if (!framesPerRow || framesPerRow < 1) {
			throw new Error('Clip requires framesPerRow >= 1');
		}
	}

	#initCoreFields(displayContext, image, numberOfFrames, framesPerRow, bitDepth) {
		this.#displayContext = displayContext;
		this.#image = image;
		this.#numberOfFrames = numberOfFrames;
		this.#framesPerRow = framesPerRow;
		this.#bitDepth = bitDepth;
	}

	#initTimingMode(frameDurationBeats, numberOfFrames, frameRatesForFrames) {
		if (frameDurationBeats !== null && frameDurationBeats !== undefined) {
			this.#initBPMSync(frameDurationBeats, numberOfFrames);
		}
		this.#initFrameRates(frameRatesForFrames, numberOfFrames);
	}

	#initDimensions(image, numberOfFrames, framesPerRow) {
		this.#frameWidth = image.width / framesPerRow;
		this.#frameHeight = image.height / Math.ceil(numberOfFrames / framesPerRow);
		if (!this.#frameWidth || !this.#frameHeight) {
			throw new Error('Clip: Invalid image dimensions');
		}
	}

	/**
	 * Internal render step: advance frame and draw to the provided context.
	 * @param {CanvasRenderingContext2D} ctx - Target canvas context
	 * @param {number} timestamp - performance.now() timestamp
	 */
	#renderFrame(ctx, timestamp) {
		if (this.#isFinished) {
			return;
		}
		this.#advanceFrame(timestamp);
		this.#drawToContext(ctx);
	}

	/**
	 * Render the current clip frame and advance to the next frame if enough time has passed.
	 * Accepts an optional timestamp (from requestClipFrame) to use as timing source, which
	 * improves determinism during rendering and tests.
	 * @param {number} [timestamp] - Optional performance.now() timestamp, typically provided by RAF
	 */
	play(timestamp = performance.now()) {
		this.#renderFrame(this.#displayContext, timestamp);
	}

	/**
	 * Render the current clip frame to a specific context.
	 * Useful for off-screen rendering in multi-layer-group compositing.
	 *
	 * Note: This method advances the clip frame based on the timestamp.
	 * To prevent double-advancement, ensure only one of play() or renderToContext()
	 * is called per clip per frame with the same timestamp.
	 *
	 * @param {CanvasRenderingContext2D} ctx - Target canvas context
	 * @param {number} [timestamp] - Optional performance.now() timestamp
	 */
	renderToContext(ctx, timestamp = performance.now()) {
		this.#renderFrame(ctx, timestamp);
	}

	/**
	 * Advance the clip frame based on elapsed time
	 * Uses BPM sync if frameDurationBeats is defined, otherwise uses frameRatesForFrames
	 * Clock sync mode skips time-based advancement (pulses drive frames directly)
	 * @param {number} timestamp - Current timestamp
	 */
	#advanceFrame(timestamp) {
		if (this.#isUsingBPMSync && this.#pulsesPerFrame && appState.bpmSource === BPM_SOURCE_CLOCK) {
			return;
		}
		if (this.#lastAdvanceTimestamp === timestamp || !this.#image) {
			return;
		}
		if (this.#lastTime === null) {
			this.#lastTime = timestamp;
		}

		const elapsed = this.#consumeFrameIntervals(timestamp - this.#lastTime);
		this.#lastTime = timestamp - Math.max(0, elapsed);
		this.#lastAdvanceTimestamp = timestamp;
	}

	#consumeFrameIntervals(elapsed) {
		while (elapsed > 0) {
			const interval = this.#getFrameInterval(this.#frame);
			if (elapsed < interval) {
				break;
			}
			elapsed -= interval;
			this.#frame++;
			if (!this.#wrapOrFinishFrame()) {
				break;
			}
		}
		return elapsed;
	}

	/**
	 * Calculate the interval (ms) for a given frame
	 * Uses BPM sync if frameDurationBeats is defined, otherwise uses frameRatesForFrames
	 * @param {number} frameIndex - The frame index
	 * @returns {number} - Interval in milliseconds
	 */
	#getFrameInterval(frameIndex) {
		if (this.#isUsingBPMSync && this.#frameDurationBeats) {
			// BPM sync mode: interval = (frameDurationBeats * 60000) / bpm
			// frameDurationBeats[i] = number of beats this frame should last
			// e.g., frameDurationBeats=0.25 at 120 BPM = 125ms (16th note)
			const beats = this.#frameDurationBeats[frameIndex] ?? this.#frameDurationBeats[0] ?? DEFAULT_FRAME_DURATION_BEATS;
			// Ensure BPM is at least the configured minimum to prevent extremely long intervals.
			// Fallback to 1 if settings.bpm.min is 0 or invalid to prevent division by zero.
			const minBPM = settings.bpm.min > 0 ? settings.bpm.min : 1;
			const bpm = Math.max(minBPM, appState.bpm);
			return (beats * MS_PER_MINUTE) / bpm;
		}

		// FPS mode (default when BPM sync is not used)
		const framesPerSecond = this.#frameRatesForFrames[frameIndex] ?? this.#defaultFrameRate;
		return MS_PER_SECOND / framesPerSecond;
	}

	/**
	 * Draw the current frame to a canvas context
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 */
	#drawToContext(ctx) {
		if (!this.#image || !ctx || this.#isFinished) {
			return;
		}

		const drawFrame = Math.min(this.#frame, this.#numberOfFrames - 1);
		const posY = Math.floor(drawFrame / this.#framesPerRow);
		const posX = drawFrame - posY * this.#framesPerRow;
		ctx.drawImage(this.#image, this.#frameWidth * posX, this.#frameHeight * posY, this.#frameWidth, this.#frameHeight, 0, 0, this.#canvasWidth, this.#canvasHeight);
	}

	/**
	 * Whether this clip is completed and won't draw anymore.
	 * Useful for external managers or renderers to clear finished clips.
	 * @returns {boolean}
	 */
	get isFinished() {
		return this.#isFinished;
	}

	/**
	 * Get the bit depth for this clip (used for mask mixing)
	 * @returns {number|null} Bit depth (1, 2, 4, or 8) or null if not specified
	 */
	get bitDepth() {
		return this.#bitDepth;
	}

	/**
	 * Stop the clip and optionally reset to the first frame.
	 * Called when a MIDI note off event is received for this clip.
	 */
	stop() {
		if (this.#shouldRetrigger) {
			this.#resetState();
		}
	}

	/**
	 * Reset clip to first frame if retrigger is enabled.
	 * Called when a MIDI note on event activates this clip.
	 */
	reset() {
		if (!this.#shouldRetrigger && !this.#isFinished) {
			return;
		}
		this.#resetState();
	}

	#resetState() {
		this.#frame = 0;
		this.#lastTime = null;
		this.#isFinished = false;
		this.#pulseCount = 0;
		this.#lastAdvanceTimestamp = null;
	}

	/**
	 * Initialize BPM sync mode from frameDurationBeats metadata.
	 * Subscribes to MIDI clock events for real-time sync.
	 * @param {number|number[]} frameDurationBeats - Beats per frame (single or per-frame array)
	 * @param {number} numberOfFrames - Total frame count for array validation
	 */
	#initBPMSync(frameDurationBeats, numberOfFrames) {
		this.#isUsingBPMSync = true;
		if (Array.isArray(frameDurationBeats)) {
			if (frameDurationBeats.length !== numberOfFrames) {
				throw new Error(`Clip: frameDurationBeats array length (${frameDurationBeats.length}) must equal numberOfFrames (${numberOfFrames})`);
			}
			this.#frameDurationBeats = frameDurationBeats;
			this.#pulsesPerFrame = frameDurationBeats.map(b => Math.round(b * settings.midi.ppqn));
		} else if (typeof frameDurationBeats === 'number' && frameDurationBeats > 0) {
			this.#frameDurationBeats = Array(numberOfFrames).fill(frameDurationBeats);
			this.#pulsesPerFrame = Array(numberOfFrames).fill(Math.round(frameDurationBeats * settings.midi.ppqn));
		} else {
			throw new Error('Clip: invalid frameDurationBeats');
		}
		this.#unsubscribeClock = appState.subscribe(EVENT_MIDI_CLOCK, () => this.#handleClockPulse());
	}

	/**
	 * Validate and store frame rates, skipping invalid entries.
	 * @param {Object} frameRatesForFrames - Frame index → FPS mapping
	 * @param {number} numberOfFrames - Total frame count for bounds checking
	 */
	#initFrameRates(frameRatesForFrames, numberOfFrames) {
		this.#frameRatesForFrames = {};
		for (const [frameIndex, frameRate] of Object.entries(frameRatesForFrames)) {
			const numericFrameIndex = Number(frameIndex);
			if (!Number.isInteger(numericFrameIndex) || numericFrameIndex < 0 || numericFrameIndex >= numberOfFrames) {
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
	 * Wrap frame index on overflow or mark clip as finished.
	 * @returns {boolean} True if clip continues (looping), false if finished
	 */
	#wrapOrFinishFrame() {
		if (this.#frame < this.#numberOfFrames) {
			return true;
		}
		if (this.#isLooping) {
			this.#frame %= this.#numberOfFrames;
			return true;
		}
		this.#frame = this.#numberOfFrames - 1;
		this.#isFinished = true;
		return false;
	}

	/**
	 * Destroy clip and release image resources for garbage collection.
	 * Unsubscribes from clock events and clears the image reference.
	 */
	destroy() {
		if (this.#unsubscribeClock) {
			try {
				this.#unsubscribeClock();
			} catch (error) {
				console.error('Error unsubscribing from clock events in Clip:', error);
			}
			this.#unsubscribeClock = null;
		}
		this.#image = null;
	}

	/**
	 * Handle MIDI clock pulse for real-time sync mode
	 * Advances frame when enough pulses have accumulated
	 * Only active when MIDI clock is the BPM source
	 */
	#handleClockPulse() {
		if (this.#isFinished || !this.#pulsesPerFrame) {
			return;
		}
		if (appState.bpmSource !== BPM_SOURCE_CLOCK) {
			return;
		}

		this.#pulseCount++;
		const pulsesNeeded = this.#pulsesPerFrame[this.#frame] ?? this.#pulsesPerFrame[0] ?? DEFAULT_PULSES_PER_FRAME;

		if (this.#pulseCount >= pulsesNeeded) {
			this.#pulseCount = 0;
			this.#frame++;
			this.#wrapOrFinishFrame();
		}
	}
}

export default Clip;
