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
import appState, { EVENT_MIDI_CONTROL_CHANGE } from '../core/AppState.js';

/**
 * @typedef {import('./Clip.js').default} Clip
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

	/** @type {Function|null} */
	#unsubscribeCC = null;

	#boundHandleControlChange = this.#handleControlChange.bind(this);

	constructor() {
		const { channelMapping } = settings;

		this.#layerGroupA = new LayerGroup(channelMapping.layerGroupA);
		this.#layerGroupB = new LayerGroup(channelMapping.layerGroupB);
		this.#layerGroupC = new LayerGroup(channelMapping.layerGroupC);

		this.#maskManager = new MaskManager();
		this.#effectsManager = new EffectsManager();

		this.#reservedChannels = new Set(channelMapping.reserved);

		// Handlers are checked in order for every MIDI note on/off event.
		// This makes the routing logic explicit, easy to reorder, and simple to extend.
		this.#handlers = this.#buildHandlers();

		this.#unsubscribeCC = appState.subscribe(EVENT_MIDI_CONTROL_CHANGE, this.#boundHandleControlChange);
	}

	#handleControlChange({ detail }) {
		const { controller, value } = detail;
		const { scrub } = settings;

		if (!scrub) {
			return;
		}

		const normalizedValue = value / 127;

		if (controller === scrub.layerGroupA_CC) {
			this.#layerGroupA.setScrubPosition(normalizedValue);
		} else if (controller === scrub.layerGroupB_CC) {
			this.#layerGroupB.setScrubPosition(normalizedValue);
		} else if (controller === scrub.layerGroupC_CC) {
			this.#layerGroupC.setScrubPosition(normalizedValue);
		} else if (controller === scrub.mixer_CC) {
			this.#maskManager.setScrubPosition(normalizedValue);
		}
	}

	#buildHandlers() {
		return [
			{
				name: 'layerGroupA',
				noteOn: (channel, note, velocity) => this.#layerGroupA.noteOn(channel, note, velocity),
				noteOff: (channel, note) => this.#layerGroupA.noteOff(channel, note)
			},
			{
				name: 'mask',
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
				name: 'effects',
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
	 * Set the loaded clips reference and distribute to groups
	 * @param {Object<string, Object<string, Object<string, Clip>>>} clips
	 *   Nested object: clips[channel][note][velocityThreshold] = Clip
	 */
	setClips(clips) {
		this.#layerGroupA.setClips(clips);
		this.#layerGroupB.setClips(clips);
		this.#layerGroupC.setClips(clips);

		this.#maskManager.setClips(clips);
	}

	/**
	 * Handle MIDI note on event - activate clip
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 */
	noteOn(channel, note, velocity) {
		if (this.#reservedChannels.has(channel)) {
			return;
		}

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
		if (this.#reservedChannels.has(channel)) {
			return;
		}

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
		this.#maskManager.clear();
		this.#effectsManager.clear();
	}

	/**
	 * Destroy LayerManager and release references
	 */
	destroy() {
		if (this.#unsubscribeCC) {
			try {
				this.#unsubscribeCC();
			} catch (error) {
				console.error('Error unsubscribing CC in LayerManager:', error);
			}
			this.#unsubscribeCC = null;
		}

		try {
			this.clearClips();
		} catch (error) {
			console.error('Error clearing clips in LayerManager:', error);
		}
		this.#destroyLayerGroups();
		this.#destroyManagers();
	}

	#destroyLayerGroups() {
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
	}

	#destroyManagers() {
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
