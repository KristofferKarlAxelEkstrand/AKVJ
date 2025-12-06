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
	#currentFramePositionX = 0;
	#currentFramePositionY = 0;
	#frame = 0;
	#lastFrame = 0;
	#lastTime = 0;
	#defaultFrameRate; // Cached fallback rate when frame-specific rate is undefined

	constructor({ canvas2dContext, image, numberOfFrames, framesPerRow, loop = true, frameRatesForFrames = { 0: 1 }, retrigger = true }) {
		this.#canvas2dContext = canvas2dContext;
		this.#image = image;
		this.#numberOfFrames = numberOfFrames;
		this.#framesPerRow = framesPerRow;
		this.#frameRatesForFrames = frameRatesForFrames;
		this.#frameWidth = image.width / framesPerRow;
		this.#frameHeight = image.height / Math.ceil(numberOfFrames / framesPerRow);
		this.#loop = loop;
		this.#retrigger = retrigger;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
		this.#defaultFrameRate = this.#frameRatesForFrames[0] ?? Object.values(this.#frameRatesForFrames)[0] ?? 1;
	}

	/**
	 * Render the current animation frame and advance to the next frame if enough time has passed.
	 * Called every frame by the Renderer. Handles frame timing, looping, and canvas drawing.
	 */
	play() {
		if (!this.#image) {
			return;
		}

		const currentTime = performance.now();

		// Check if animation completed (non-looping)
		if (this.#lastFrame >= this.#numberOfFrames) {
			this.#lastFrame = 0;
			this.#frame = 0;
			if (!this.#loop) {
				return;
			}
		}

		// Get frame rate for current frame
		const framesPerSecond = this.#frameRatesForFrames[this.#lastFrame] ?? this.#defaultFrameRate;
		const interval = 1000 / framesPerSecond;

		// Advance frame if enough time has passed
		if (currentTime > this.#lastTime + interval) {
			this.#frame++;
			if (this.#frame >= this.#numberOfFrames) {
				this.#frame = 0;
			}

			this.#updateFramePosition();
			this.#lastTime = currentTime;
		}

		this.#lastFrame = this.#frame;

		// Draw the current frame
		this.#canvas2dContext.drawImage(this.#image, this.#frameWidth * this.#currentFramePositionX, this.#frameHeight * this.#currentFramePositionY, this.#frameWidth, this.#frameHeight, 0, 0, this.#canvasWidth, this.#canvasHeight);
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

	#resetState() {
		this.#currentFramePositionX = 0;
		this.#currentFramePositionY = 0;
		this.#frame = 0;
		this.#lastFrame = 0;
		this.#lastTime = 0;
	}

	#updateFramePosition() {
		this.#currentFramePositionY = Math.floor(this.#frame / this.#framesPerRow);
		this.#currentFramePositionX = this.#frame - this.#currentFramePositionY * this.#framesPerRow;
	}

	/**
	 * Dispose of image resources to help garbage collection
	 */
	dispose() {
		if (this.#image) {
			this.#image = null;
		}
	}
}

export default AnimationLayer;
