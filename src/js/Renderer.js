/**
 * Renderer - Contains the requestAnimationFrame loop and canvas drawing logic
 * Extracted from adventure-kid-video-jockey.js for better separation of concerns
 */
import settings from './settings.js';

class Renderer {
	constructor(canvas2dContext, layerManager) {
		this.canvas2dContext = canvas2dContext;
		this.layerManager = layerManager;
		this.isRunning = false;
		this.animationFrameId = null;
	}

	/**
	 * Start the rendering loop
	 */
	start() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.loop();
		}
	}

	/**
	 * Stop the rendering loop
	 */
	stop() {
		this.isRunning = false;
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Main rendering loop - clears canvas and renders all active layers
	 */
	loop = () => {
		if (!this.isRunning) {
			return;
		}

		// Clear canvas with background color
		this.canvas2dContext.fillRect(0, 0, settings.canvas.width, settings.canvas.height);

		// Render all active layers (channel 0 = background, 15 = foreground)
		const activeLayers = this.layerManager.getActiveLayers();
		activeLayers.forEach(layer => {
			if (layer) {
				layer.forEach(note => {
					if (note) {
						note.play();
					}
				});
			}
		});

		this.animationFrameId = requestAnimationFrame(this.loop);
	};

	/**
	 * Get rendering statistics
	 */
	getStats() {
		return {
			isRunning: this.isRunning,
			frameId: this.animationFrameId
		};
	}
}

export default Renderer;
