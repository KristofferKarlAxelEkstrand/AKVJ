/**
 * EffectsManager - Manages visual effects for AKVJ
 *
 * Two effect channels:
 * - Channel 9 (effectsAB): Effects applied to mixed A/B output
 * - Channel 12 (effectsGlobal): Effects applied to entire output (after Layer C)
 *
 * Key behaviors:
 * - Effects are NOT latched - Note Off immediately disables the effect
 * - Multiple effects from different note ranges can stack
 * - Within the same range, only the last note wins
 * - Velocity (0-127) controls effect intensity
 */
import settings from '../core/settings.js';

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
	#effectsABChannel = settings.channelMapping.effectsAB;

	/** @type {number} */
	#effectsGlobalChannel = settings.channelMapping.effectsGlobal;

	/** @type {Object} */
	#effectRanges = settings.effectRanges;

	/**
	 * Active effects for A/B layer (channel 9)
	 * Key: effect type, Value: {note, velocity}
	 * @type {Map<EffectType, ActiveEffect>}
	 */
	#activeEffectsAB = new Map();

	/**
	 * Active effects for global layer (channel 12)
	 * Key: effect type, Value: {note, velocity}
	 * @type {Map<EffectType, ActiveEffect>}
	 */
	#activeEffectsGlobal = new Map();

	/**
	 * Check if this manager handles a specific channel
	 * @param {number} channel - MIDI channel
	 * @returns {boolean}
	 */
	handlesChannel(channel) {
		return channel === this.#effectsABChannel || channel === this.#effectsGlobalChannel;
	}

	/**
	 * Determine the effect type based on note number
	 * @param {number} note - MIDI note (0-127)
	 * @returns {EffectType|null} Effect type or null if reserved
	 */
	#getEffectType(note) {
		for (const [type, range] of Object.entries(this.#effectRanges)) {
			if (note >= range.min && note <= range.max) {
				return /** @type {EffectType} */ (type);
			}
		}
		return null;
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

		// Velocity 0 acts as note off (disable effect)
		if (velocity === 0) {
			return this.noteOff(channel, note);
		}

		const effectType = this.#getEffectType(note);
		if (!effectType || effectType === 'reserved') {
			return false;
		}

		const activeEffects = channel === this.#effectsABChannel ? this.#activeEffectsAB : this.#activeEffectsGlobal;

		// Activate the effect (replaces any existing effect of the same type)
		activeEffects.set(effectType, {
			note,
			velocity,
			type: effectType
		});

		return true;
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

		const activeEffects = channel === this.#effectsABChannel ? this.#activeEffectsAB : this.#activeEffectsGlobal;

		// Only deactivate if the current effect matches the note being released
		const currentEffect = activeEffects.get(effectType);
		if (currentEffect && currentEffect.note === note) {
			activeEffects.delete(effectType);
			return true;
		}

		return false;
	}

	/**
	 * Get all active A/B effects
	 * @returns {ActiveEffect[]} Array of active effects, sorted by note (ascending)
	 */
	getActiveEffectsAB() {
		return [...this.#activeEffectsAB.values()].sort((a, b) => a.note - b.note);
	}

	/**
	 * Get all active global effects
	 * @returns {ActiveEffect[]} Array of active effects, sorted by note (ascending)
	 */
	getActiveEffectsGlobal() {
		return [...this.#activeEffectsGlobal.values()].sort((a, b) => a.note - b.note);
	}

	/**
	 * Check if any A/B effects are active
	 * @returns {boolean}
	 */
	hasEffectsAB() {
		return this.#activeEffectsAB.size > 0;
	}

	/**
	 * Check if any global effects are active
	 * @returns {boolean}
	 */
	hasEffectsGlobal() {
		return this.#activeEffectsGlobal.size > 0;
	}

	/**
	 * Get a specific A/B effect by type
	 * @param {EffectType} type - Effect type
	 * @returns {ActiveEffect|undefined}
	 */
	getEffectAB(type) {
		return this.#activeEffectsAB.get(type);
	}

	/**
	 * Get a specific global effect by type
	 * @param {EffectType} type - Effect type
	 * @returns {ActiveEffect|undefined}
	 */
	getEffectGlobal(type) {
		return this.#activeEffectsGlobal.get(type);
	}

	/**
	 * Clear all active effects
	 */
	clear() {
		this.#activeEffectsAB.clear();
		this.#activeEffectsGlobal.clear();
	}

	/**
	 * Clear only A/B effects
	 */
	clearEffectsAB() {
		this.#activeEffectsAB.clear();
	}

	/**
	 * Clear only global effects
	 */
	clearEffectsGlobal() {
		this.#activeEffectsGlobal.clear();
	}

	/**
	 * Destroy and release resources
	 */
	destroy() {
		this.clear();
	}
}

export default EffectsManager;
