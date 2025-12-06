/**
 * Renderer - Contains the requestAnimationFrame loop and canvas drawing logic
 * Extracted from adventure-kid-video-jockey.js for better separation of concerns
 */
import settings from './settings.js';

class Renderer {
	#canvas2dContext;
	#layerManager;
	#isRunning = false;
	#animationFrameId = null;

	constructor(canvas2dContext, layerManager) {
		this.#canvas2dContext = canvas2dContext;
		this.#layerManager = layerManager;
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
	 * Main rendering loop - clears canvas and renders all active layers
	 */
	#loop = () => {
		if (!this.#isRunning) {
			return;
		}

		// Clear canvas with background color
		this.#canvas2dContext.fillRect(0, 0, settings.canvas.width, settings.canvas.height);

		// Render all active layers (channel 0 = background, 15 = foreground)
		const activeLayers = this.#layerManager.getActiveLayers();
		for (const layer of activeLayers) {
			if (layer) {
				for (const note of layer) {
					if (note) {
						try {
							note.play();
						} catch (error) {
							// Prevent a single layer error from stopping the render loop
							console.error('Error rendering note:', error);
						}
					}
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
