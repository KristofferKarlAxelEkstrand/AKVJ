/**
 * LayerManager - Manages state and updates for all visual layers
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */

class LayerManager {
	#canvasLayers = [];
	#animations = {};

	/**
	 * Set the loaded animations reference
	 */
	setAnimations(animations) {
		this.#animations = animations;
	}

	/**
	 * Handle MIDI note on event - activate animation layer
	 */
	noteOn(channel, note, velocity) {
		if (!this.#animations[channel]?.[note]) {
			return;
		}

		const velocityLayer = this.#findVelocityLayer(velocity, this.#animations[channel][note]);

		if (velocityLayer === null) {
			return;
		}

		this.#canvasLayers[channel] ??= [];
		this.#canvasLayers[channel][note] = this.#animations[channel][note][velocityLayer];
	}

	/**
	 * Handle MIDI note off event - deactivate animation layer
	 */
	noteOff(channel, note) {
		if (this.#canvasLayers[channel]?.[note]) {
			this.#canvasLayers[channel][note].stop();
			this.#canvasLayers[channel][note] = null;
		}
	}

	/**
	 * Find the appropriate velocity layer based on input velocity
	 * @returns {number|null} The velocity layer key, or null if none available
	 */
	#findVelocityLayer(velocity, channelNoteAnimations) {
		const velocities = Object.keys(channelNoteAnimations)
			.map(Number)
			.sort((a, b) => a - b);

		if (velocities.length === 0) {
			return null;
		}

		// Find the highest velocity layer that doesn't exceed the input velocity
		// If none match (input velocity lower than lowest defined), return null
		return velocities.findLast(v => v <= velocity) ?? null;
	}

	/**
	 * Get all active canvas layers for rendering
	 */
	getActiveLayers() {
		return this.#canvasLayers;
	}

	/**
	 * Clear all active layers
	 */
	clearLayers() {
		for (const layer of this.#canvasLayers) {
			if (layer) {
				for (const note of layer) {
					note?.stop();
				}
			}
		}
		this.#canvasLayers = [];
	}

	/**
	 * Get statistics about active layers
	 */
	getLayerStats() {
		let activeCount = 0;
		for (const layer of this.#canvasLayers) {
			if (layer) {
				for (const note of layer) {
					if (note) {
						activeCount++;
					}
				}
			}
		}
		return { activeCount };
	}
}

export default LayerManager;
