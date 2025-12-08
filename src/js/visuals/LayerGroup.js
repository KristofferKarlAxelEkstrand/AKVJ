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
	/** @type {string} */
	#name;

	/** @type {number[]} */
	#channels;

	/** @type {Map<number, Map<number, AnimationLayer>>} */
	#activeLayers = new Map();

	/** @type {Object} */
	#animations = {};

	/** @type {Map<number, Map<number, number[]>>} */
	#velocityCache = new Map();

	/**
	 * Create a new LayerGroup
	 * @param {string} name - Name of the group ('A', 'B', or 'C')
	 * @param {number[]} channels - Array of MIDI channels this group handles
	 */
	constructor(name, channels) {
		this.#name = name;
		this.#channels = channels;

		// Initialize active layers map for each channel
		for (const channel of channels) {
			this.#activeLayers.set(channel, new Map());
		}
	}

	/**
	 * Get the name of this layer group
	 * @returns {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * Get the channels this group handles
	 * @returns {number[]}
	 */
	get channels() {
		return this.#channels;
	}

	/**
	 * Check if this group handles a specific channel
	 * @param {number} channel - MIDI channel
	 * @returns {boolean}
	 */
	handlesChannel(channel) {
		return this.#channels.includes(channel);
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
		if (!this.handlesChannel(channel)) {
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

		layer.reset();

		const channelLayers = this.#activeLayers.get(channel);
		if (channelLayers) {
			channelLayers.set(note, layer);
		}

		return true;
	}

	/**
	 * Handle MIDI note off event - deactivate animation layer
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @returns {boolean} True if an animation was deactivated
	 */
	noteOff(channel, note) {
		if (!this.handlesChannel(channel)) {
			return false;
		}

		const channelLayers = this.#activeLayers.get(channel);
		if (!channelLayers) {
			return false;
		}

		const layer = channelLayers.get(note);
		if (layer) {
			layer.stop();
			channelLayers.delete(note);
			return true;
		}

		return false;
	}

	/**
	 * Get all active layers for rendering, sorted by channel then note
	 * @returns {AnimationLayer[]} Array of active animation layers
	 */
	getActiveLayers() {
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

		return layers;
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
	 * Get count of active layers
	 * @returns {number}
	 */
	getActiveLayerCount() {
		let count = 0;
		for (const channelLayers of this.#activeLayers.values()) {
			count += channelLayers.size;
		}
		return count;
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
	}

	/**
	 * Clean up finished layers (non-looping animations that completed)
	 */
	cleanupFinishedLayers() {
		for (const channelLayers of this.#activeLayers.values()) {
			for (const [note, layer] of channelLayers.entries()) {
				if (layer && layer.isFinished) {
					channelLayers.delete(note);
				}
			}
		}
	}

	/**
	 * Destroy the layer group and release resources
	 */
	destroy() {
		this.clearLayers();
		this.#animations = {};
		this.#velocityCache.clear();
	}
}

export default LayerGroup;
