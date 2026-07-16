/**
 * EffectsManager - Manages visual effects for AKVJ
 *
 * Two effect channels:
 * - Channel 9 (mixedOutputEffects): Effects applied to mixed Layer Group A and Layer Group B output
 * - Channel 12 (globalEffects): Effects applied to entire output (after Layer Group C)
 *
 * Key behaviors:
 * - Effects are NOT latched - Note Off immediately disables the effect
 * - Multiple effects from different note ranges can stack
 * - Within the same range, only the last note wins
 * - Velocity (0-127) controls effect intensity
 */
import settings from '../core/settings.js';
import { MAX_MIDI_NOTE } from './effects/effectConstants.js';

/**
 * Effect type based on note range
 * @typedef {'split'|'mirror'|'offset'|'color'|'glitch'|'strobe'|'reserved'} EffectType
 */

/**
 * Active effect entry
 * @typedef {Object} ActiveEffect
 * @property {number} note - MIDI note that triggered this effect
 * @property {number} velocity - Effect intensity (1-127)
 * @property {EffectType} type - Effect type based on note range
 */

class EffectsManager {
	/** @type {number} */
	#mixedOutputEffectsChannel = settings.channelMapping.mixedOutputEffects;

	/** @type {number} */
	#globalEffectsChannel = settings.channelMapping.globalEffects;

	/** @type {Object} */
	#effectRanges = settings.effectRanges;

	/**
	 * Active effects for mixed Layer Group A and Layer Group B output (channel 9)
	 * Key: effect type, Value: {note, velocity}
	 * @type {Map<EffectType, ActiveEffect>}
	 */
	#activeMixedOutputEffects = new Map();

	/** @type {ActiveEffect[]|null} Cached sorted array, invalidated on change */
	#cachedMixedOutputEffects = null;

	/**
	 * Active global effects (channel 12)
	 * Key: effect type, Value: {note, velocity}
	 * @type {Map<EffectType, ActiveEffect>}
	 */
	#activeGlobalEffects = new Map();

	/** @type {ActiveEffect[]|null} Cached sorted array, invalidated on change */
	#cachedGlobalEffects = null;

	/**
	 * Precomputed map of MIDI note (0-127) to effect type.
	 * Excludes reserved notes so callers can treat a missing type as "no effect".
	 * @type {Map<number, EffectType>}
	 */
	#effectTypeByNote;

	constructor() {
		this.#effectTypeByNote = new Map();
		for (const [type, range] of Object.entries(this.#effectRanges)) {
			if (type === 'reserved') {
				continue;
			}
			for (let note = range.min; note <= range.max; note++) {
				this.#effectTypeByNote.set(note, /** @type {EffectType} */ (type));
			}
		}
	}

	/**
	 * Check if this manager handles a specific channel
	 * @param {number} channel - MIDI channel
	 * @returns {boolean}
	 */
	handlesChannel(channel) {
		return channel === this.#mixedOutputEffectsChannel || channel === this.#globalEffectsChannel;
	}

	/**
	 * Determine the effect type based on note number.
	 * Reserved notes and out-of-range values return null.
	 * @param {number} note - MIDI note (0-127)
	 * @returns {EffectType|null} Effect type or null if no effect applies
	 */
	#getEffectType(note) {
		if (typeof note !== 'number' || note < 0 || note > MAX_MIDI_NOTE) {
			return null;
		}
		return this.#effectTypeByNote.get(note) ?? null;
	}

	#getActiveEffectsForChannel(channel) {
		return channel === this.#mixedOutputEffectsChannel ? this.#activeMixedOutputEffects : this.#activeGlobalEffects;
	}

	/**
	 * Handle MIDI note on - activate effect
	 * @param {number} channel - MIDI channel
	 * @param {number} note - MIDI note (effect selector)
	 * @param {number} velocity - Effect intensity (1-127, 0 = disable)
	 * @returns {boolean} True if an effect was activated
	 */
	noteOn(channel, note, velocity) {
		if (!this.handlesChannel(channel)) {
			return false;
		}

		if (velocity === 0) {
			return this.noteOff(channel, note);
		}

		const effectType = this.#getEffectType(note);
		if (!effectType) {
			return false;
		}

		this.#activateEffect(channel, effectType, note, velocity);
		this.#invalidateCache(channel);
		return true;
	}

	#activateEffect(channel, effectType, note, velocity) {
		const activeEffects = this.#getActiveEffectsForChannel(channel);
		activeEffects.set(effectType, { note, velocity, type: effectType });
	}

	/**
	 * Handle MIDI note off - deactivate effect
	 * @param {number} channel - MIDI channel
	 * @param {number} note - MIDI note
	 * @returns {boolean} True if an effect was deactivated
	 */
	noteOff(channel, note) {
		if (!this.handlesChannel(channel)) {
			return false;
		}

		const effectType = this.#getEffectType(note);
		if (!effectType) {
			return false;
		}

		const activeEffects = this.#getActiveEffectsForChannel(channel);

		const currentEffect = activeEffects.get(effectType);
		if (currentEffect && currentEffect.note === note) {
			activeEffects.delete(effectType);
			this.#invalidateCache(channel);
			return true;
		}

		return false;
	}

	/**
	 * Get all active mixed output effects
	 * @returns {ActiveEffect[]} Array of active effects, sorted by note (ascending)
	 */
	getActiveMixedOutputEffects() {
		if (this.#cachedMixedOutputEffects === null) {
			this.#cachedMixedOutputEffects = [...this.#activeMixedOutputEffects.values()].sort((a, b) => a.note - b.note);
		}
		return this.#cachedMixedOutputEffects;
	}

	/**
	 * Get all active global effects
	 * @returns {ActiveEffect[]} Array of active effects, sorted by note (ascending)
	 */
	getActiveGlobalEffects() {
		if (this.#cachedGlobalEffects === null) {
			this.#cachedGlobalEffects = [...this.#activeGlobalEffects.values()].sort((a, b) => a.note - b.note);
		}
		return this.#cachedGlobalEffects;
	}

	/**
	 * Check if any mixed output effects are active
	 * @returns {boolean}
	 */
	hasMixedOutputEffects() {
		return this.#activeMixedOutputEffects.size > 0;
	}

	/**
	 * Check if any global effects are active
	 * @returns {boolean}
	 */
	hasGlobalEffects() {
		return this.#activeGlobalEffects.size > 0;
	}

	/**
	 * Clear all active effects
	 */
	clear() {
		this.#activeMixedOutputEffects.clear();
		this.#activeGlobalEffects.clear();
		this.#cachedMixedOutputEffects = null;
		this.#cachedGlobalEffects = null;
	}

	/**
	 * Destroy and release resources
	 */
	destroy() {
		try {
			this.clear();
		} catch (error) {
			console.error('Error clearing effects in EffectsManager:', error);
		}
	}

	#invalidateCache(channel) {
		if (channel === this.#mixedOutputEffectsChannel) {
			this.#cachedMixedOutputEffects = null;
		} else {
			this.#cachedGlobalEffects = null;
		}
	}
}

export default EffectsManager;
