/**
 * LayerManager - Manages state and updates for all visual layers
 * Coordinates LayerGroups (A, B, C), MaskManager, and EffectsManager
 *
 * Architecture:
 * - Layer A (channels 0-3): Primary animation deck
 * - Mixer (channel 4): B&W bitmask for A/B crossfading
 * - Layer B (channels 5-8): Secondary animation deck
 * - Effects A/B (channel 9): Effects applied to mixed A/B output
 * - Layer C (channels 10-11): Overlay layer (logos, persistent graphics)
 * - Global Effects (channel 12): Effects applied to entire output
 * - Reserved (channels 13-15): Ignored
 */
import settings from '../core/settings.js';
import LayerGroup from './LayerGroup.js';
import MaskManager from './MaskManager.js';
import EffectsManager from './EffectsManager.js';

/**
 * @typedef {import('./AnimationLayer.js').default} AnimationLayer
 */
class LayerManager {
	/** @type {LayerGroup} */
	#layerA;

	/** @type {LayerGroup} */
	#layerB;

	/** @type {LayerGroup} */
	#layerC;

	/** @type {MaskManager} */
	#maskManager;

	/** @type {EffectsManager} */
	#effectsManager;

	/** @type {Set<number>} */
	#reservedChannels;

	// Legacy compatibility - keep for backwards compatibility
	/** @type {Array<Array<AnimationLayer|null>>} */
	#canvasLayers = [];
	#animations = {};
	#velocityCache = new Map(); // Map<channel, Map<note, number[]>>

	constructor() {
		const { channelMapping } = settings;

		// Initialize layer groups
		this.#layerA = new LayerGroup('A', channelMapping.layerA);
		this.#layerB = new LayerGroup('B', channelMapping.layerB);
		this.#layerC = new LayerGroup('C', channelMapping.layerC);

		// Initialize managers
		this.#maskManager = new MaskManager();
		this.#effectsManager = new EffectsManager();

		// Track reserved channels
		this.#reservedChannels = new Set(channelMapping.reserved);
	}

	/**
	 * Set the loaded animations reference and distribute to groups
	 * @param {Object} animations - Animation data keyed by channel/note/velocity
	 */
	setAnimations(animations) {
		this.#animations = animations;

		// Distribute animations to layer groups
		this.#layerA.setAnimations(animations);
		this.#layerB.setAnimations(animations);
		this.#layerC.setAnimations(animations);

		// Set mask animations
		this.#maskManager.setAnimations(animations);

		// Build legacy velocity cache for backwards compatibility
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
	 *
	 * Note: Both the new LayerGroup system and legacy #canvasLayers are updated
	 * intentionally during the transition period. The LayerGroups own the actual
	 * AnimationLayer instances and handle rendering via playToContext(). The legacy
	 * #canvasLayers array is kept in sync so that getActiveLayers() continues to work
	 * for any code still using the old rendering path. This dual update does NOT cause
	 * duplicate rendering because both systems reference the same AnimationLayer objects.
	 * The legacy path will be removed once all consumers migrate to the new layer API.
	 *
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 */
	noteOn(channel, note, velocity) {
		// Ignore reserved channels
		if (this.#reservedChannels.has(channel)) {
			return;
		}

		// Try each handler in order
		if (this.#layerA.noteOn(channel, note, velocity)) {
			// Keep legacy #canvasLayers in sync for backwards compatibility
			this.#legacyNoteOn(channel, note, velocity);
			return;
		}

		if (this.#maskManager.noteOn(channel, note, velocity)) {
			return;
		}

		if (this.#layerB.noteOn(channel, note, velocity)) {
			this.#legacyNoteOn(channel, note, velocity);
			return;
		}

		if (this.#effectsManager.noteOn(channel, note, velocity)) {
			return;
		}

		if (this.#layerC.noteOn(channel, note, velocity)) {
			this.#legacyNoteOn(channel, note, velocity);
			return;
		}
	}

	/**
	 * Handle MIDI note off event - deactivate animation layer
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 */
	noteOff(channel, note) {
		// Ignore reserved channels
		if (this.#reservedChannels.has(channel)) {
			return;
		}

		// Try each handler in order
		if (this.#layerA.noteOff(channel, note)) {
			this.#legacyNoteOff(channel, note);
			return;
		}

		// Mask manager ignores note-off (latching behavior)
		this.#maskManager.noteOff(channel, note);

		if (this.#layerB.noteOff(channel, note)) {
			this.#legacyNoteOff(channel, note);
			return;
		}

		if (this.#effectsManager.noteOff(channel, note)) {
			return;
		}

		if (this.#layerC.noteOff(channel, note)) {
			this.#legacyNoteOff(channel, note);
			return;
		}
	}

	/**
	 * Legacy note on for backwards compatibility
	 * @private
	 */
	#legacyNoteOn(channel, note, velocity) {
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
	 * Legacy note off for backwards compatibility
	 * @private
	 */
	#legacyNoteOff(channel, note) {
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
		// `findLast` is a relatively new method. Use explicit reverse loop for
		// compatibility and to avoid depending on polyfills.
		for (let i = velocities.length - 1; i >= 0; i--) {
			const v = velocities[i];
			if (v <= velocity) {
				return v;
			}
		}
		return null;
	}

	/**
	 * Get all active canvas layers for rendering.
	 * Returns internal array reference for performance. Do not mutate externally.
	 * @returns {Array} Active canvas layers indexed by [channel][note]
	 * @deprecated Use getLayerGroups() for new code
	 */
	getActiveLayers() {
		return this.#canvasLayers;
	}

	/**
	 * Get Layer Group A
	 * @returns {LayerGroup}
	 */
	getLayerA() {
		return this.#layerA;
	}

	/**
	 * Get Layer Group B
	 * @returns {LayerGroup}
	 */
	getLayerB() {
		return this.#layerB;
	}

	/**
	 * Get Layer Group C
	 * @returns {LayerGroup}
	 */
	getLayerC() {
		return this.#layerC;
	}

	/**
	 * Get the Mask Manager
	 * @returns {MaskManager}
	 */
	getMaskManager() {
		return this.#maskManager;
	}

	/**
	 * Get the Effects Manager
	 * @returns {EffectsManager}
	 */
	getEffectsManager() {
		return this.#effectsManager;
	}

	/**
	 * Clear all active layers and stop their animations
	 */
	clearLayers() {
		// Clear layer groups
		this.#layerA.clearLayers();
		this.#layerB.clearLayers();
		this.#layerC.clearLayers();

		// Clear mask
		this.#maskManager.clear();

		// Clear effects
		this.#effectsManager.clear();

		// Clear legacy layers
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

		this.#layerA.destroy();
		this.#layerB.destroy();
		this.#layerC.destroy();
		this.#maskManager.destroy();
		this.#effectsManager.destroy();

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

		return {
			activeCount,
			layerA: this.#layerA.getActiveLayerCount(),
			layerB: this.#layerB.getActiveLayerCount(),
			layerC: this.#layerC.getActiveLayerCount(),
			hasMask: this.#maskManager.hasMask(),
			effectsAB: this.#effectsManager.getActiveEffectsAB().length,
			effectsGlobal: this.#effectsManager.getActiveEffectsGlobal().length
		};
	}
}

export default LayerManager;
