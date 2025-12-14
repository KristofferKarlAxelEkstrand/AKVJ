/**
 * LayerGroup - Manages a group of animation slots for a layer (A, B, or C)
 * Each group can have multiple channels, each with multiple active animations
 *
 * Compositing order within a group:
 * - Lower channel renders first (bottom)
 * - Within a channel, lower note number renders first (bottom)
 */
import { buildVelocityCache, findVelocityLayer } from '../utils/velocityLayer.js';

/**
 * @typedef {import('./AnimationLayer.js').default} AnimationLayer
 */
class LayerGroup {
	/** @type {number[]} */
	#channels;

	/** @type {Map<number, Map<number, AnimationLayer>>} */
	#activeLayers = new Map();

	/** @type {Object} */
	#animations = {};

	/** @type {Map<number, Map<number, number[]>>} */
	#velocityCache = new Map();

	/** @type {AnimationLayer[]|null} Cached sorted active layers array */
	#cachedActiveLayers = null;

	/** @type {boolean} Flag indicating cache needs rebuild */
	#layersDirty = true;

	/**
	 * Create a new LayerGroup
	 * @param {number[]} channels - Array of MIDI channels this group handles
	 */
	constructor(channels) {
		this.#channels = channels;

		// Initialize active layers map for each channel
		for (const channel of channels) {
			this.#activeLayers.set(channel, new Map());
		}
	}

	/**
	 * Set the loaded animations reference and build velocity cache
	 * @param {Object} animations - Animation data keyed by channel/note/velocity
	 */
	setAnimations(animations) {
		this.#animations = animations;

		// Build velocity cache for each channel
		this.#velocityCache.clear();
		for (const channel of this.#channels) {
			const channelData = animations[channel];
			if (channelData) {
				this.#velocityCache.set(channel, buildVelocityCache(channelData));
			}
		}
	}

	/**
	 * Handle MIDI note on event - activate animation layer
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 * @returns {boolean} True if an animation was activated
	 */
	noteOn(channel, note, velocity) {
		const channelLayers = this.#activeLayers.get(channel);
		if (!channelLayers) {
			return false;
		}

		if (!this.#animations[channel]?.[note]) {
			return false;
		}

		const velocities = this.#velocityCache.get(channel)?.get(note);
		const velocityLayer = findVelocityLayer(velocities, velocity);
		if (velocityLayer === null) {
			return false;
		}

		const layer = this.#animations[channel][note][velocityLayer];
		if (!layer) {
			return false;
		}

		// Stop any existing layer on this note before replacing (cleanup on rapid retriggers)
		const existing = channelLayers.get(note);
		if (existing && existing !== layer) {
			existing.stop();
		}

		layer.reset();
		channelLayers.set(note, layer);
		this.#layersDirty = true;

		return true;
	}

	/**
	 * Handle MIDI note off event - deactivate animation layer
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @returns {boolean} True if an animation was deactivated
	 */
	noteOff(channel, note) {
		const channelLayers = this.#activeLayers.get(channel);
		if (!channelLayers) {
			return false;
		}

		const layer = channelLayers.get(note);
		if (layer) {
			layer.stop();
			channelLayers.delete(note);
			this.#layersDirty = true;
			return true;
		}

		return false;
	}

	/**
	 * Get all active layers for rendering, sorted by channel then note.
	 * Results are cached and only rebuilt when layers change.
	 * Also cleans up finished layers from the Map to prevent memory leaks.
	 * @returns {AnimationLayer[]} Array of active animation layers
	 */
	getActiveLayers() {
		// Return cached array if still valid
		if (!this.#layersDirty && this.#cachedActiveLayers !== null) {
			// Filter out finished layers (may have finished since last cache)
			const stillActive = this.#cachedActiveLayers.filter(layer => !layer.isFinished);
			if (stillActive.length !== this.#cachedActiveLayers.length) {
				this.#cachedActiveLayers = stillActive;
				// Also clean up finished layers from the Map to prevent memory leaks
				this.#cleanupFinishedLayers();
			}
			return this.#cachedActiveLayers;
		}

		// Rebuild cache
		const layers = [];

		// Sort channels in ascending order (lower channel = bottom)
		const sortedChannels = [...this.#channels].sort((a, b) => a - b);

		for (const channel of sortedChannels) {
			const channelLayers = this.#activeLayers.get(channel);
			if (!channelLayers || channelLayers.size === 0) {
				continue;
			}

			// Sort notes in ascending order (lower note = bottom)
			const sortedNotes = [...channelLayers.keys()].sort((a, b) => a - b);

			for (const note of sortedNotes) {
				const layer = channelLayers.get(note);
				if (layer && !layer.isFinished) {
					layers.push(layer);
				}
			}
		}

		this.#cachedActiveLayers = layers;
		this.#layersDirty = false;
		return layers;
	}

	/**
	 * Clean up finished layers from the activeLayers Map.
	 * This prevents memory leaks by removing references to non-looping
	 * animations that have completed playback.
	 */
	#cleanupFinishedLayers() {
		for (const channel of this.#channels) {
			const channelLayers = this.#activeLayers.get(channel);
			if (channelLayers) {
				for (const [note, layer] of channelLayers.entries()) {
					if (layer && layer.isFinished) {
						channelLayers.delete(note);
					}
				}
			}
		}
	}

	/**
	 * Check if the group has any active layers
	 * @returns {boolean}
	 */
	hasActiveLayers() {
		for (const channelLayers of this.#activeLayers.values()) {
			if (channelLayers.size > 0) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Clear all active layers and stop their animations
	 */
	clearLayers() {
		for (const channelLayers of this.#activeLayers.values()) {
			for (const layer of channelLayers.values()) {
				if (layer) {
					layer.stop();
					if (typeof layer.dispose === 'function') {
						layer.dispose();
					}
				}
			}
			channelLayers.clear();
		}
		this.#cachedActiveLayers = null;
		this.#layersDirty = true;
	}

	/**
	 * Destroy the layer group and release resources
	 */
	destroy() {
		this.clearLayers();
		this.#animations = {};
		this.#velocityCache.clear();
		this.#cachedActiveLayers = null;
		this.#layersDirty = true;
	}
}

export default LayerGroup;
