/**
 * Renderer - Contains the requestAnimationFrame loop and canvas drawing logic
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */
import settings from '../core/settings.js';

class Renderer {
	#canvas2dContext;
	#layerManager;
	#isRunning = false;
	#animationFrameId = null;
	#canvasWidth;
	#canvasHeight;

	constructor(canvas2dContext, layerManager) {
		this.#canvas2dContext = canvas2dContext;
		this.#layerManager = layerManager;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
	}

	/**
	 * Start the rendering loop
	 */
	start() {
		if (!this.#isRunning) {
			this.#isRunning = true;
			this.#loop();
		}
	}

	/**
	 * Stop the rendering loop
	 */
	stop() {
		this.#isRunning = false;
		if (this.#animationFrameId) {
			cancelAnimationFrame(this.#animationFrameId);
			this.#animationFrameId = null;
		}
	}

	/**
	 * Destroy renderer and release references for GC
	 */
	destroy() {
		this.stop();
		this.#canvas2dContext = null;
		this.#layerManager = null;
	}

	/**
	 * Main rendering loop - clears canvas and renders all active layers
	 */
	#loop = () => {
		if (!this.#isRunning) {
			return;
		}

		// Clear the canvas for the next frame with the configured background color.
		// Use fillRect to keep the black background semantics rather than making the
		// canvas transparent. Keep the check simple - if a valid context exists,
		// it will provide the drawing API (CanvasRenderingContext2D).
		if (this.#canvas2dContext) {
			// Use fillRect for consistent background color. The canvas fillStyle is initialized
			// in `AdventureKidVideoJockey.connectedCallback()` to avoid redundant per-frame writes.
			this.#canvas2dContext.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		}

		// Render all active layers (channel 0 = background, 15 = foreground)
		// Guard in case the layer manager was destroyed while a requestAnimationFrame
		// callback was pending to avoid null reference errors.
		const activeLayers = this.#layerManager?.getActiveLayers();
		// Quick path: if there are no active layers, skip rendering loop to save CPU
		if (!activeLayers || activeLayers.length === 0) {
			this.#animationFrameId = requestAnimationFrame(this.#loop);
			return;
		}
		for (const channel of activeLayers) {
			if (channel) {
				for (const animation of channel) {
					animation?.play();
				}
			}
		}

		this.#animationFrameId = requestAnimationFrame(this.#loop);
	};

	/**
	 * Get rendering statistics for debugging
	 * @returns {{isRunning: boolean, frameId: number|null}} Current renderer state
	 */
	getStats() {
		return {
			isRunning: this.#isRunning,
			frameId: this.#animationFrameId
		};
	}
}

export default Renderer;
