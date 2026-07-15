/**
 * MaskManager - Manages the bitmask clip for Layer Group A and Layer Group B mixing
 *
 * Key behaviors:
 * - Only one mask can be active at a time
 * - Masks latch to the last triggered note/velocity
 * - Note-off is ignored (mask stays latched)
 * - Before first trigger, returns null (show Layer Group A only)
 * - Each note = different transition type
 * - Velocity = variant/intensity of the transition
 */
import settings from '../core/settings.js';
import { buildVelocityCache, resolveAnimationClip } from '../utils/velocitySelection.js';

/**
 * @typedef {import('./AnimationClip.js').default} AnimationClip
 */
class MaskManager {
	/** @type {AnimationClip|null} */
	#currentMask = null;

	/** @type {number|null} */
	#currentBitDepth = null;

	/** @type {Object} */
	#maskClips = {};

	/** @type {Map<number, number[]>} */
	#velocityCache = new Map();

	/** @type {number} */
	#mixerChannel = settings.channelMapping.mixer;

	/**
	 * Set the loaded mask clips
	 * @param {Object} animations - All clip data keyed by channel/note/velocity
	 */
	setAnimations(animations) {
		const maskClips = animations[this.#mixerChannel];
		this.#maskClips = maskClips || {};
		this.#velocityCache = buildVelocityCache(this.#maskClips);
	}

	/**
	 * Check if this manager handles a specific channel
	 * @param {number} channel - MIDI channel
	 * @returns {boolean}
	 */
	handlesChannel(channel) {
		return channel === this.#mixerChannel;
	}

	/**
	 * Handle MIDI note on - replace current mask with new one
	 * @param {number} channel - MIDI channel
	 * @param {number} note - MIDI note (transition type)
	 * @param {number} velocity - MIDI velocity (variant/intensity)
	 * @returns {boolean} True if a mask was activated
	 */
	noteOn(channel, note, velocity) {
		if (channel !== this.#mixerChannel) {
			return false;
		}

		const clip = resolveAnimationClip(this.#maskClips, note, velocity, this.#velocityCache);
		if (!clip || typeof clip.reset !== 'function') {
			return false;
		}

		// Stop and cleanup previous mask if different
		if (this.#currentMask && this.#currentMask !== clip) {
			this.#currentMask.stop();
		}

		// Set new mask
		this.#currentMask = clip;
		// Get bitDepth from clip (defaults to 1-bit for crisp B&W masks)
		this.#currentBitDepth = clip.bitDepth ?? 1;

		// Reset the mask clip
		this.#currentMask.reset();

		return true;
	}

	/**
	 * Handle MIDI note off - intentionally ignored for masks (latching behavior)
	 * @param {number} _channel - MIDI channel (ignored, masks don't respond to note-off)
	 * @param {number} _note - MIDI note (ignored, masks stay latched until new note-on)
	 * @returns {boolean} Always returns false (note-off is ignored)
	 */
	noteOff(_channel, _note) {
		// Intentionally ignored - mask stays latched
		// Only way to change mask is to trigger a new note
		return false;
	}

	/**
	 * Get the current active mask clip
	 * @returns {AnimationClip|null} Current mask or null if no mask triggered yet
	 */
	getCurrentMask() {
		return this.#currentMask;
	}

	/**
	 * Get the current mask's bit depth
	 * @returns {number|null} Bit depth (1, 2, 4, 8) or null if no mask
	 */
	getBitDepth() {
		return this.#currentBitDepth;
	}

	/**
	 * Check if a mask is currently active
	 * @returns {boolean}
	 */
	hasMask() {
		return this.#currentMask !== null;
	}

	/**
	 * Clear the current mask
	 * Note: This is mainly for testing/reset purposes
	 * During normal operation, masks should stay latched
	 */
	clearMask() {
		if (this.#currentMask) {
			this.#currentMask.stop();
		}
		this.#currentMask = null;
		this.#currentBitDepth = null;
	}

	/**
	 * Destroy and release resources
	 */
	destroy() {
		try {
			this.clearMask();
		} catch (error) {
			console.error('Error clearing mask in MaskManager:', error);
		}
		this.#maskClips = {};
		try {
			this.#velocityCache.clear();
		} catch (error) {
			console.error('Error clearing velocityCache in MaskManager:', error);
		}
	}
}

export default MaskManager;
