/**
 * AnimationLayer - Handles individual sprite animation playback and rendering
 * Manages frame-based animations with customizable frame rates and loop behavior
 */
import settings from '../core/settings.js';

class AnimationLayer {
	// Configuration (immutable after construction)
	#canvas2dContext;
	#image;
	#numberOfFrames;
	#framesPerRow;
	#frameRatesForFrames;
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
	#isFinished = false;
	#defaultFrameRate; // Cached fallback rate when frame-specific rate is undefined

	constructor({ canvas2dContext, image, numberOfFrames, framesPerRow, loop = true, frameRatesForFrames = { 0: 1 }, retrigger = true }) {
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
	 * Called every frame by the Renderer. Handles frame timing, looping, and canvas drawing.
	 */
	/**
	 * Render the current animation frame and advance to the next frame if enough time has passed.
	 * Accepts an optional timestamp (from requestAnimationFrame) to use as timing source, which
	 * improves determinism during rendering and tests.
	 * @param {number} [timestamp] - Optional performance.now() timestamp, typically provided by RAF
	 */
	play(timestamp = performance.now()) {
		if (!this.#image || !this.#canvas2dContext) {
			return;
		}

		// Non-looping animation completed - stop rendering
		if (this.#isFinished) {
			return;
		}

		// Non-looping animation completed - stop rendering

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
			const framesPerSecond = this.#frameRatesForFrames[this.#frame] ?? this.#defaultFrameRate;
			const interval = 1000 / framesPerSecond;

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

		// Draw the current frame (use clamped frame index for drawing)
		const drawFrame = Math.min(this.#frame, this.#numberOfFrames - 1);
		const posY = Math.floor(drawFrame / this.#framesPerRow);
		const posX = drawFrame - posY * this.#framesPerRow;
		this.#canvas2dContext.drawImage(this.#image, this.#frameWidth * posX, this.#frameHeight * posY, this.#frameWidth, this.#frameHeight, 0, 0, this.#canvasWidth, this.#canvasHeight);
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
