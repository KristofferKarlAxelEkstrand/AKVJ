/**
 * LayerManager - Manages state and updates for all visual layer groups
 * Coordinates LayerGroups (A, B, C), MaskManager, and EffectsManager
 *
 * Architecture:
 * - Layer Group A (channels 0-3): Primary clip deck
 * - Mixer (channel 4): B&W bitmask for Layer Group A and Layer Group B crossfading
 * - Layer Group B (channels 5-8): Secondary clip deck
 * - Mixed output effects (channel 9): Effects applied to mixed Layer Group A and Layer Group B output
 * - Layer Group C (channels 10-11): Overlay layer (logos, persistent graphics)
 * - Global effects (channel 12): Effects applied to entire output
 * - Reserved (channels 13-15): Ignored
 */
import settings from '../core/settings.js';
import LayerGroup from './LayerGroup.js';
import MaskManager from './MaskManager.js';
import EffectsManager from './EffectsManager.js';

/**
 * @typedef {import('./AnimationClip.js').default} AnimationClip
 */
class LayerManager {
	/** @type {LayerGroup} */
	#layerGroupA;

	/** @type {LayerGroup} */
	#layerGroupB;

	/** @type {LayerGroup} */
	#layerGroupC;

	/** @type {MaskManager} */
	#maskManager;

	/** @type {EffectsManager} */
	#effectsManager;

	/** @type {Set<number>} */
	#reservedChannels;

	/** @type {Array<{name: string, noteOn: Function, noteOff: Function}>} */
	#handlers;

	constructor() {
		const { channelMapping } = settings;

		// Initialize layer groups
		this.#layerGroupA = new LayerGroup(channelMapping.layerGroupA);
		this.#layerGroupB = new LayerGroup(channelMapping.layerGroupB);
		this.#layerGroupC = new LayerGroup(channelMapping.layerGroupC);

		// Initialize managers
		this.#maskManager = new MaskManager();
		this.#effectsManager = new EffectsManager();

		// Track reserved channels
		this.#reservedChannels = new Set(channelMapping.reserved);

		// Handlers are checked in order for every MIDI note on/off event.
		// This makes the routing logic explicit, easy to reorder, and simple to extend.
		this.#handlers = this.#buildHandlers();
	}

	#buildHandlers() {
		return [
			{
				name: 'layerGroupA',
				noteOn: (channel, note, velocity) => this.#layerGroupA.noteOn(channel, note, velocity),
				noteOff: (channel, note) => this.#layerGroupA.noteOff(channel, note)
			},
			{
				name: 'maskManager',
				noteOn: (channel, note, velocity) => this.#maskManager.noteOn(channel, note, velocity),
				// Masks latch: they stay active until replaced, so note-off is ignored
				noteOff: () => false
			},
			{
				name: 'layerGroupB',
				noteOn: (channel, note, velocity) => this.#layerGroupB.noteOn(channel, note, velocity),
				noteOff: (channel, note) => this.#layerGroupB.noteOff(channel, note)
			},
			{
				name: 'effectsManager',
				noteOn: (channel, note, velocity) => this.#effectsManager.noteOn(channel, note, velocity),
				noteOff: (channel, note) => this.#effectsManager.noteOff(channel, note)
			},
			{
				name: 'layerGroupC',
				noteOn: (channel, note, velocity) => this.#layerGroupC.noteOn(channel, note, velocity),
				noteOff: (channel, note) => this.#layerGroupC.noteOff(channel, note)
			}
		];
	}

	/**
	 * Set the loaded animations reference and distribute to groups
	 * @param {Object<string, Object<string, Object<string, AnimationClip>>>} animations
	 *   Nested object: animations[channel][note][velocityThreshold] = AnimationClip
	 */
	setAnimations(animations) {
		// Distribute animations to layer groups
		this.#layerGroupA.setAnimations(animations);
		this.#layerGroupB.setAnimations(animations);
		this.#layerGroupC.setAnimations(animations);

		// Set mask clips
		this.#maskManager.setAnimations(animations);
	}

	/**
	 * Handle MIDI note on event - activate clip
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
		for (const handler of this.#handlers) {
			if (handler.noteOn(channel, note, velocity)) {
				return;
			}
		}
	}

	/**
	 * Handle MIDI note off event - deactivate clip
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 */
	noteOff(channel, note) {
		// Ignore reserved channels
		if (this.#reservedChannels.has(channel)) {
			return;
		}

		// Try each handler in order
		for (const handler of this.#handlers) {
			if (handler.noteOff(channel, note)) {
				return;
			}
		}
	}

	/**
	 * Get Layer Group A
	 * @returns {LayerGroup}
	 */
	getLayerGroupA() {
		return this.#layerGroupA;
	}

	/**
	 * Get Layer Group B
	 * @returns {LayerGroup}
	 */
	getLayerGroupB() {
		return this.#layerGroupB;
	}

	/**
	 * Get Layer Group C
	 * @returns {LayerGroup}
	 */
	getLayerGroupC() {
		return this.#layerGroupC;
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
	 * Clear all active clips and stop their playback
	 */
	clearClips() {
		this.#layerGroupA.clearClips();
		this.#layerGroupB.clearClips();
		this.#layerGroupC.clearClips();
		this.#maskManager.clearMask();
		this.#effectsManager.clearEffects();
	}

	/**
	 * Destroy LayerManager and release references
	 */
	destroy() {
		try {
			this.clearClips();
		} catch (error) {
			console.error('Error clearing clips in LayerManager:', error);
		}
		try {
			this.#layerGroupA.destroy();
		} catch (error) {
			console.error('Error destroying layerGroupA:', error);
		}
		try {
			this.#layerGroupB.destroy();
		} catch (error) {
			console.error('Error destroying layerGroupB:', error);
		}
		try {
			this.#layerGroupC.destroy();
		} catch (error) {
			console.error('Error destroying layerGroupC:', error);
		}
		try {
			this.#maskManager.destroy();
		} catch (error) {
			console.error('Error destroying maskManager:', error);
		}
		try {
			this.#effectsManager.destroy();
		} catch (error) {
			console.error('Error destroying effectsManager:', error);
		}
	}
}

export default LayerManager;
