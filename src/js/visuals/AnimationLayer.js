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
		this.#frameRatesForFrames = frameRatesForFrames;
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
		const maybeDefault = frameRatesForFrames[0] ?? frameRatesForFrames[Object.keys(frameRatesForFrames)[0]] ?? 1;
		// Ensure the default frame rate is a positive number > 0
		this.#defaultFrameRate = typeof maybeDefault === 'number' && maybeDefault > 0 ? maybeDefault : 1;
	}

	/**
	 * Render the current animation frame and advance to the next frame if enough time has passed.
	 * Called every frame by the Renderer. Handles frame timing, looping, and canvas drawing.
	 */
	play() {
		if (!this.#image || !this.#canvas2dContext) {
			return;
		}

		// Non-looping animation completed - stop rendering
		if (!this.#loop && this.#frame >= this.#numberOfFrames) {
			return;
		}

		const currentTime = performance.now();

		// Initialize lastTime on first play to prevent skipping frame 0
		if (this.#lastTime === null) {
			this.#lastTime = currentTime;
		}

		// Get frame rate for current frame and ensure a valid positive FPS
		let framesPerSecond = this.#frameRatesForFrames[this.#frame] ?? this.#defaultFrameRate;
		// Defensive check: ensure the value is numeric and positive. While the constructor
		// guarantees `#defaultFrameRate` is valid, frame rates stored in
		// `#frameRatesForFrames` could be mutated at runtime (e.g., by tests or other
		// consumers). This guard prevents a runtime division by zero or negative interval.
		if (typeof framesPerSecond !== 'number' || framesPerSecond <= 0) {
			framesPerSecond = this.#defaultFrameRate;
		}
		const interval = 1000 / framesPerSecond;

		// Advance frame if enough time has passed
		if (currentTime > this.#lastTime + interval) {
			this.#frame++;
			// Wrap frame for looping animations
			if (this.#frame >= this.#numberOfFrames) {
				this.#frame = this.#loop ? 0 : this.#numberOfFrames;
			}
			this.#lastTime = currentTime;
		}

		// Draw the current frame (use clamped frame index for drawing)
		const drawFrame = Math.min(this.#frame, this.#numberOfFrames - 1);
		const posY = Math.floor(drawFrame / this.#framesPerRow);
		const posX = drawFrame - posY * this.#framesPerRow;
		this.#canvas2dContext.drawImage(this.#image, this.#frameWidth * posX, this.#frameHeight * posY, this.#frameWidth, this.#frameHeight, 0, 0, this.#canvasWidth, this.#canvasHeight);
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
	}

	/**
	 * Dispose of image resources to help garbage collection
	 */
	dispose() {
		this.#image = null;
	}
}

export default AnimationLayer;
