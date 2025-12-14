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

	constructor() {
		const { channelMapping } = settings;

		// Initialize layer groups
		this.#layerA = new LayerGroup(channelMapping.layerA);
		this.#layerB = new LayerGroup(channelMapping.layerB);
		this.#layerC = new LayerGroup(channelMapping.layerC);

		// Initialize managers
		this.#maskManager = new MaskManager();
		this.#effectsManager = new EffectsManager();

		// Track reserved channels
		this.#reservedChannels = new Set(channelMapping.reserved);
	}

	/**
	 * Set the loaded animations reference and distribute to groups
	 * @param {Object<string, Object<string, Object<string, AnimationLayer>>>} animations
	 *   Nested object: animations[channel][note][velocityLayer] = AnimationLayer
	 */
	setAnimations(animations) {
		// Distribute animations to layer groups
		this.#layerA.setAnimations(animations);
		this.#layerB.setAnimations(animations);
		this.#layerC.setAnimations(animations);

		// Set mask animations
		this.#maskManager.setAnimations(animations);
	}

	/**
	 * Handle MIDI note on event - activate animation layer
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 */
	noteOn(channel, note, velocity) {
		// Ignore reserved channels
		if (this.#reservedChannels.has(channel)) {
			return;
		}

		// Try each handler in order - first match wins
		if (this.#layerA.noteOn(channel, note, velocity)) {
			return;
		}

		if (this.#maskManager.noteOn(channel, note, velocity)) {
			return;
		}

		if (this.#layerB.noteOn(channel, note, velocity)) {
			return;
		}

		if (this.#effectsManager.noteOn(channel, note, velocity)) {
			return;
		}

		if (this.#layerC.noteOn(channel, note, velocity)) {
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
			return;
		}

		// Mask manager ignores note-off (latching behavior)
		this.#maskManager.noteOff(channel, note);

		if (this.#layerB.noteOff(channel, note)) {
			return;
		}

		if (this.#effectsManager.noteOff(channel, note)) {
			return;
		}

		if (this.#layerC.noteOff(channel, note)) {
			return;
		}
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
		this.#layerA.clearLayers();
		this.#layerB.clearLayers();
		this.#layerC.clearLayers();
		this.#maskManager.clear();
		this.#effectsManager.clear();
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
	}
}

export default LayerManager;
