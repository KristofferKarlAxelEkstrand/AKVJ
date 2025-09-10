/**
 * LayerManager - Manages state and updates for all visual layers
 * Extracted from adventure-kid-video-jockey.js for better separation of concerns
 */

class LayerManager {
	constructor() {
		this.canvasLayers = [];
		this.animations = {};
	}

	/**
	 * Set the loaded animations reference
	 */
	setAnimations(animations) {
		this.animations = animations;
	}

	/**
	 * Handle MIDI note on event - activate animation layer
	 */
	noteOn(channel, note, velocity) {
		if (!this.animations[channel] || !this.animations[channel][note]) {
			return;
		}

		const velocityLayer = this.findVelocityLayer(velocity, this.animations[channel][note]);

		if (!this.canvasLayers[channel]) {
			this.canvasLayers[channel] = [];
		}

		this.canvasLayers[channel][note] = this.animations[channel][note][velocityLayer];
	}

	/**
	 * Handle MIDI note off event - deactivate animation layer
	 */
	noteOff(channel, note) {
		if (this.canvasLayers[channel] && this.canvasLayers[channel][note]) {
			this.canvasLayers[channel][note].stop();
			this.canvasLayers[channel][note] = null;
		}
	}

	/**
	 * Find the appropriate velocity layer based on input velocity
	 */
	findVelocityLayer(velocity, channelNoteAnimations) {
		const velocities = Object.keys(channelNoteAnimations)
			.map(Number)
			.sort((a, b) => a - b);

		// Find the highest velocity layer that doesn't exceed the input velocity
		const foundVelocity = velocities.findLast(v => v <= velocity);
		return foundVelocity ? foundVelocity : velocities[velocities.length - 1];
	}

	/**
	 * Get all active canvas layers for rendering
	 */
	getActiveLayers() {
		return this.canvasLayers;
	}

	/**
	 * Clear all active layers
	 */
	clearLayers() {
		this.canvasLayers.forEach(layer => {
			if (layer) {
				layer.forEach(note => {
					if (note) {
						note.stop();
					}
				});
			}
		});
		this.canvasLayers = [];
	}

	/**
	 * Get statistics about active layers
	 */
	getLayerStats() {
		let activeCount = 0;
		this.canvasLayers.forEach(layer => {
			if (layer) {
				layer.forEach(note => {
					if (note) {
						activeCount++;
					}
				});
			}
		});
		return { activeCount };
	}
}

export default LayerManager;
