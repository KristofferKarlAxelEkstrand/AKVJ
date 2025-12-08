/**
 * AnimationLayer - Handles individual sprite animation playback and rendering
 * Manages frame-based animations with customizable frame rates and loop behavior
 *
 * Supports two timing modes:
 * 1. frameRatesForFrames (legacy) - Frame timing in frames-per-second
 * 2. beatsPerFrame (BPM sync) - Frame timing in beats, synced to current BPM
 */
import settings from '../core/settings.js';
import appState from '../core/AppState.js';

class AnimationLayer {
	// Configuration (immutable after construction)
	#canvas2dContext;
	#image;
	#numberOfFrames;
	#framesPerRow;
	#frameRatesForFrames;
	#beatsPerFrame; // Array or single number for BPM sync
	#frameWidth;
	#frameHeight;
	#loop;
	#retrigger;
	#canvasWidth;
	#canvasHeight;

	// Animation state (mutable)
	#frame = 0;
	/** @type {number|null} Last timestamp from performance.now(), null if never played */
	#lastTime = null;
	#lastAdvanceTimestamp = null; // Prevent double-advancement within same timestamp
	#isFinished = false;
	#defaultFrameRate; // Cached fallback rate when frame-specific rate is undefined
	#useBPMSync = false; // Whether to use BPM sync mode

	constructor({ canvas2dContext, image, numberOfFrames, framesPerRow, loop = true, frameRatesForFrames = { 0: 1 }, beatsPerFrame = null, retrigger = true }) {
		if (!numberOfFrames || numberOfFrames < 1) {
			throw new Error('AnimationLayer requires numberOfFrames >= 1');
		}
		if (!framesPerRow || framesPerRow < 1) {
			throw new Error('AnimationLayer requires framesPerRow >= 1');
		}

		this.#canvas2dContext = canvas2dContext;
		this.#image = image;
		this.#numberOfFrames = numberOfFrames;
		this.#framesPerRow = framesPerRow;

		// Process beatsPerFrame (takes priority over frameRatesForFrames)
		if (beatsPerFrame !== null && beatsPerFrame !== undefined) {
			this.#useBPMSync = true;
			if (Array.isArray(beatsPerFrame)) {
				// Validate non-empty array to fail fast rather than using 0.25 fallback
				if (beatsPerFrame.length === 0) {
					console.warn('AnimationLayer: beatsPerFrame array is empty, falling back to frameRatesForFrames');
					this.#useBPMSync = false;
				} else {
					this.#beatsPerFrame = beatsPerFrame;
				}
			} else if (typeof beatsPerFrame === 'number' && beatsPerFrame > 0) {
				// Shorthand: single number applies to all frames
				this.#beatsPerFrame = Array(numberOfFrames).fill(beatsPerFrame);
			} else {
				console.warn('AnimationLayer: invalid beatsPerFrame, falling back to frameRatesForFrames');
				this.#useBPMSync = false;
			}
		}

		// Make a defensive shallow copy and validate the provided frame rates.
		// Ensure we only store positive numeric values to avoid division by zero
		// and to fail-fast on invalid animation metadata.
		this.#frameRatesForFrames = {};
		for (const [k, v] of Object.entries(frameRatesForFrames)) {
			const idx = Number(k);
			if (!Number.isInteger(idx) || idx < 0 || idx >= numberOfFrames) {
				console.warn(`AnimationLayer: frame rate key ${k} is not a valid frame index; skipping`);
				continue;
			}
			if (typeof v === 'number' && v > 0) {
				this.#frameRatesForFrames[idx] = v;
			} else {
				// If invalid, log and skip - constructor enforces valid metadata
				console.warn(`AnimationLayer: invalid frame rate for frame ${k}: ${v}; skipping`);
			}
		}
		this.#frameWidth = image.width / framesPerRow;
		this.#frameHeight = image.height / Math.ceil(numberOfFrames / framesPerRow);
		if (!this.#frameWidth || !this.#frameHeight) {
			throw new Error('AnimationLayer: Invalid image dimensions');
		}
		this.#loop = loop;
		this.#retrigger = retrigger;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
		// Cache the default frame rate - prefer frame 0, otherwise use first defined value
		const keys = Object.keys(this.#frameRatesForFrames);
		const maybeDefault = this.#frameRatesForFrames[0] ?? (keys.length ? this.#frameRatesForFrames[keys[0]] : undefined) ?? 1;
		// Ensure the default frame rate is a positive number > 0
		this.#defaultFrameRate = typeof maybeDefault === 'number' && maybeDefault > 0 ? maybeDefault : 1;
	}

	/**
	 * Render the current animation frame and advance to the next frame if enough time has passed.
	 * Accepts an optional timestamp (from requestAnimationFrame) to use as timing source, which
	 * improves determinism during rendering and tests.
	 * @param {number} [timestamp] - Optional performance.now() timestamp, typically provided by RAF
	 */
	play(timestamp = performance.now()) {
		// Non-looping animation completed - stop rendering
		if (this.#isFinished) {
			return;
		}
		this.#advanceFrame(timestamp);
		this.#drawToContext(this.#canvas2dContext);
	}

	/**
	 * Render the current animation frame to a specific context.
	 * Useful for off-screen rendering in multi-layer compositing.
	 *
	 * Note: This method advances the animation frame based on the timestamp.
	 * To prevent double-advancement, ensure only one of play() or playToContext()
	 * is called per animation per frame with the same timestamp.
	 *
	 * @param {CanvasRenderingContext2D} ctx - Target canvas context
	 * @param {number} [timestamp] - Optional performance.now() timestamp
	 */
	playToContext(ctx, timestamp = performance.now()) {
		// Non-looping animation completed - stop rendering
		if (this.#isFinished) {
			return;
		}
		this.#advanceFrame(timestamp);
		this.#drawToContext(ctx);
	}

	/**
	 * Advance the animation frame based on elapsed time
	 * Uses BPM sync if beatsPerFrame is defined, otherwise uses frameRatesForFrames
	 * @param {number} timestamp - Current timestamp
	 */
	#advanceFrame(timestamp) {
		// Prevent double-advancement when the same timestamp is used to advance
		if (this.#lastAdvanceTimestamp === timestamp) {
			return;
		}
		if (!this.#image) {
			return;
		}

		// Initialize lastTime on first play to prevent skipping frame 0
		if (this.#lastTime === null) {
			this.#lastTime = timestamp;
		}

		// Use a delta-based approach that advances the frame by a number of
		// steps proportional to the elapsed time. This avoids drift and
		// ensures that if many intervals have passed (due to GC or blocking
		// work) we advance by the right number of frames instead of only one.
		let elapsed = timestamp - this.#lastTime;

		// Loop and advance while we have accumulated enough time for the
		// current frame. Because frame rates may vary per frame, recompute
		// interval for each advanced frame.
		while (elapsed > 0) {
			const interval = this.#getFrameInterval(this.#frame);

			if (elapsed < interval) {
				break;
			}

			// Consume one interval worth of elapsed time and advance.
			elapsed -= interval;
			this.#frame++;

			// Handle wrapping / completion for the advanced frame
			if (this.#frame >= this.#numberOfFrames) {
				if (this.#loop) {
					this.#frame %= this.#numberOfFrames;
				} else {
					// Non-looping animations are considered finished; keep
					// a state that indicates a completed animation.
					this.#frame = this.#numberOfFrames;
					this.#isFinished = true;
					break;
				}
			}
		}

		// Preserve leftover fractional elapsed time so frames stay consistent
		// across calls; next tick will start from timestamp - leftover.
		this.#lastTime = timestamp - Math.max(0, elapsed);
		this.#lastAdvanceTimestamp = timestamp;
	}

	/**
	 * Calculate the interval (ms) for a given frame
	 * Uses BPM sync if beatsPerFrame is defined, otherwise uses frameRatesForFrames
	 * @param {number} frameIndex - The frame index
	 * @returns {number} - Interval in milliseconds
	 */
	#getFrameInterval(frameIndex) {
		if (this.#useBPMSync && this.#beatsPerFrame) {
			// BPM sync mode: interval = (beatsPerFrame * 60000) / bpm
			// beatsPerFrame[i] = number of beats this frame should last
			// e.g., beatsPerFrame=0.25 at 120 BPM = 125ms (16th note)
			const beats = this.#beatsPerFrame[frameIndex] ?? this.#beatsPerFrame[0] ?? 0.25;
			// Ensure BPM is at least 1 to prevent division by zero
			const bpm = Math.max(1, appState.bpm);
			return (beats * 60000) / bpm;
		}

		// Legacy FPS mode
		const framesPerSecond = this.#frameRatesForFrames[frameIndex] ?? this.#defaultFrameRate;
		return 1000 / framesPerSecond;
	}

	/**
	 * Draw the current frame to a canvas context
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 */
	#drawToContext(ctx) {
		if (!this.#image || !ctx || this.#isFinished) {
			return;
		}

		// Draw the current frame (use clamped frame index for drawing)
		const drawFrame = Math.min(this.#frame, this.#numberOfFrames - 1);
		const posY = Math.floor(drawFrame / this.#framesPerRow);
		const posX = drawFrame - posY * this.#framesPerRow;
		ctx.drawImage(this.#image, this.#frameWidth * posX, this.#frameHeight * posY, this.#frameWidth, this.#frameHeight, 0, 0, this.#canvasWidth, this.#canvasHeight);
	}

	/**
	 * Whether this animation is completed and won't draw anymore.
	 * Useful for external managers or renderers to clear finished layers.
	 * @returns {boolean}
	 */
	get isFinished() {
		return this.#isFinished;
	}

	/**
	 * Stop the animation and optionally reset to the first frame.
	 * Called when a MIDI note off event is received for this layer.
	 */
	stop() {
		if (this.#retrigger) {
			this.#resetState();
		}
	}

	/**
	 * Reset animation to first frame if retrigger is enabled.
	 * Called when a MIDI note on event activates this layer.
	 */
	reset() {
		if (this.#retrigger) {
			this.#resetState();
		}
	}

	#resetState() {
		this.#frame = 0;
		this.#lastTime = null;
		this.#isFinished = false;
	}

	/**
	 * Dispose of image resources to help garbage collection
	 */
	dispose() {
		// Only clear image reference so GC can reclaim memory but leave the
		// canvas2dContext intact. Clearing the context is a breaking change;
		// if a layer is disposed while still referenced by the renderer, we
		// should still allow play() to return early safely.
		this.#image = null;
	}
}

export default AnimationLayer;
