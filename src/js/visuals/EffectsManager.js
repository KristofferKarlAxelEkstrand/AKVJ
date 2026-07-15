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

	/**
	 * Active global effects (channel 12)
	 * Key: effect type, Value: {note, velocity}
	 * @type {Map<EffectType, ActiveEffect>}
	 */
	#activeGlobalEffects = new Map();

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
		if (typeof note !== 'number' || note < 0 || note > 127) {
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

		// Velocity 0 acts as note off (disable effect)
		if (velocity === 0) {
			return this.noteOff(channel, note);
		}

		const effectType = this.#getEffectType(note);
		if (!effectType) {
			return false;
		}

		const activeEffects = this.#getActiveEffectsForChannel(channel);

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

		const activeEffects = this.#getActiveEffectsForChannel(channel);

		// Only deactivate if the current effect matches the note being released
		const currentEffect = activeEffects.get(effectType);
		if (currentEffect && currentEffect.note === note) {
			activeEffects.delete(effectType);
			return true;
		}

		return false;
	}

	/**
	 * Get all active mixed output effects
	 * @returns {ActiveEffect[]} Array of active effects, sorted by note (ascending)
	 */
	getActiveMixedOutputEffects() {
		return [...this.#activeMixedOutputEffects.values()].sort((a, b) => a.note - b.note);
	}

	/**
	 * Get all active global effects
	 * @returns {ActiveEffect[]} Array of active effects, sorted by note (ascending)
	 */
	getActiveGlobalEffects() {
		return [...this.#activeGlobalEffects.values()].sort((a, b) => a.note - b.note);
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
	clearEffects() {
		this.#activeMixedOutputEffects.clear();
		this.#activeGlobalEffects.clear();
	}

	/**
	 * Destroy and release resources
	 */
	destroy() {
		this.clearEffects();
	}
}

export default EffectsManager;
