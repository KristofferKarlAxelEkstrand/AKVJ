/**
 * LayerManager - Manages state and updates for all visual layers
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */

/**
 * @typedef {import('./AnimationLayer.js').default} AnimationLayer
 */
class LayerManager {
	/** @type {Array<Array<AnimationLayer|null>>} */
	#canvasLayers = [];
	#animations = {};
	#velocityCache = new Map(); // Map<channel, Map<note, number[]>>

	/**
	 * Set the loaded animations reference and build velocity cache
	 * @param {Object} animations - Animation data keyed by channel/note/velocity
	 */
	setAnimations(animations) {
		this.#animations = animations;
		this.#buildVelocityCache(animations);
	}

	/**
	 * Build cache of sorted velocity keys for each channel/note combination
	 * Uses nested Maps to avoid string key allocation in hot path
	 */
	#buildVelocityCache(animations) {
		this.#velocityCache.clear();
		for (const [channel, notes] of Object.entries(animations)) {
			const channelNum = Number(channel);
			const noteMap = new Map();
			for (const [note, velocities] of Object.entries(notes)) {
				const sorted = Object.keys(velocities)
					.map(Number)
					.sort((a, b) => a - b);
				noteMap.set(Number(note), sorted);
			}
			this.#velocityCache.set(channelNum, noteMap);
		}
	}

	/**
	 * Handle MIDI note on event - activate animation layer
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 */
	noteOn(channel, note, velocity) {
		if (!this.#animations[channel]?.[note]) {
			return;
		}

		const velocityLayer = this.#findVelocityLayer(velocity, channel, note);

		if (velocityLayer === null) {
			return;
		}

		const layer = this.#animations[channel][note][velocityLayer];
		if (!layer) {
			return;
		}
		layer.reset();

		this.#canvasLayers[channel] ??= [];
		this.#canvasLayers[channel][note] = layer;
	}

	/**
	 * Handle MIDI note off event - deactivate animation layer
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 */
	noteOff(channel, note) {
		if (this.#canvasLayers[channel]?.[note]) {
			this.#canvasLayers[channel][note].stop();
			this.#canvasLayers[channel][note] = null;
		}
	}

	/**
	 * Find the appropriate velocity layer based on input velocity
	 * @param {number} velocity - Input velocity (0-127)
	 * @param {number} channel - MIDI channel
	 * @param {number} note - MIDI note
	 * @returns {number|null} The velocity layer key, or null if none available
	 */
	#findVelocityLayer(velocity, channel, note) {
		const velocities = this.#velocityCache.get(channel)?.get(note);

		if (!velocities || velocities.length === 0) {
			return null;
		}

		// Find the highest velocity layer that doesn't exceed the input velocity
		// If none match (input velocity lower than lowest defined), return null
		return velocities.findLast(v => v <= velocity) ?? null;
	}

	/**
	 * Get all active canvas layers for rendering.
	 * Returns internal array reference for performance. Do not mutate externally.
	 * @returns {Array} Active canvas layers indexed by [channel][note]
	 */
	getActiveLayers() {
		return this.#canvasLayers;
	}

	/**
	 * Clear all active layers and stop their animations
	 */
	clearLayers() {
		// Each entry in #canvasLayers is an array of layers for a MIDI channel
		// channelLayers: Array<AnimationLayer|null>
		for (const channelLayers of this.#canvasLayers) {
			if (!channelLayers) {
				continue;
			}
			for (const layer of channelLayers) {
				if (layer) {
					layer.stop();
					// Dispose of any image resources the layer may hold (no-op if not present)
					if (typeof layer.dispose === 'function') {
						layer.dispose();
					}
				}
			}
		}
		this.#canvasLayers = [];
	}

	/**
	 * Destroy active layer manager and release references
	 */
	destroy() {
		this.clearLayers();
		this.#animations = {};
		this.#velocityCache.clear();
	}

	/**
	 * Get statistics about active layers
	 */
	getLayerStats() {
		let activeCount = 0;
		for (const channelLayers of this.#canvasLayers) {
			if (channelLayers) {
				for (const layer of channelLayers) {
					if (layer) {
						activeCount++;
					}
				}
			}
		}
		return { activeCount };
	}
}

export default LayerManager;
