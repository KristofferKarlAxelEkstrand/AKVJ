/**
 * MaskManager - Manages the bitmask animation for A/B layer mixing
 *
 * Key behaviors:
 * - Only one mask can be active at a time
 * - Masks latch to the last triggered note/velocity
 * - Note-off is ignored (mask stays latched)
 * - Before first trigger, returns null (show Layer A only)
 * - Each note = different transition type
 * - Velocity = variant/intensity of the transition
 */
import settings from '../core/settings.js';

/**
 * @typedef {import('./AnimationLayer.js').default} AnimationLayer
 */
class MaskManager {
	/** @type {AnimationLayer|null} */
	#currentMask = null;

	/** @type {number|null} */
	#currentNote = null;

	/** @type {number|null} */
	#currentVelocity = null;

	/** @type {number|null} */
	#currentBitDepth = null;

	/** @type {Object} */
	#maskAnimations = {};

	/** @type {Map<number, number[]>} */
	#velocityCache = new Map();

	/** @type {number} */
	#mixerChannel = settings.channelMapping.mixer;

	/**
	 * Set the loaded mask animations
	 * @param {Object} animations - All animation data keyed by channel/note/velocity
	 */
	setAnimations(animations) {
		const mixerData = animations[this.#mixerChannel];
		this.#maskAnimations = mixerData || {};
		this.#buildVelocityCache();
	}

	/**
	 * Build cache of sorted velocity keys for each note
	 */
	#buildVelocityCache() {
		this.#velocityCache.clear();

		for (const [note, velocities] of Object.entries(this.#maskAnimations)) {
			const sorted = Object.keys(velocities)
				.map(Number)
				.sort((a, b) => a - b);
			this.#velocityCache.set(Number(note), sorted);
		}
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

		const velocityLayer = this.#findVelocityLayer(velocity, note);
		if (velocityLayer === null) {
			return false;
		}

		const maskData = this.#maskAnimations[note]?.[velocityLayer];
		if (!maskData) {
			return false;
		}

		// Get the AnimationLayer from the mask data
		// The mask data structure matches animations - it has the layer directly
		const layer = maskData;
		if (!layer || typeof layer.reset !== 'function') {
			return false;
		}

		// Stop and cleanup previous mask if different
		if (this.#currentMask && this.#currentMask !== layer) {
			this.#currentMask.stop();
		}

		// Set new mask
		this.#currentNote = note;
		this.#currentVelocity = velocityLayer;
		this.#currentMask = layer;
		// Get bitDepth from animation layer (defaults to 1-bit for crisp B&W masks)
		this.#currentBitDepth = layer.bitDepth ?? 1;

		// Reset the mask animation
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
	 * Find the appropriate velocity layer based on input velocity
	 * @param {number} velocity - Input velocity (0-127)
	 * @param {number} note - MIDI note
	 * @returns {number|null} The velocity layer key, or null if none available
	 */
	#findVelocityLayer(velocity, note) {
		const velocities = this.#velocityCache.get(note);

		if (!velocities || velocities.length === 0) {
			return null;
		}

		// Find the highest velocity layer that doesn't exceed the input velocity
		for (let i = velocities.length - 1; i >= 0; i--) {
			const v = velocities[i];
			if (v <= velocity) {
				return v;
			}
		}
		return null;
	}

	/**
	 * Get the current active mask layer
	 * @returns {AnimationLayer|null} Current mask or null if no mask triggered yet
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
	 * Get the current mask note (transition type)
	 * @returns {number|null}
	 */
	getCurrentNote() {
		return this.#currentNote;
	}

	/**
	 * Get the current mask velocity (variant)
	 * @returns {number|null}
	 */
	getCurrentVelocity() {
		return this.#currentVelocity;
	}

	/**
	 * Clear the current mask
	 * Note: This is mainly for testing/reset purposes
	 * During normal operation, masks should stay latched
	 */
	clear() {
		if (this.#currentMask) {
			this.#currentMask.stop();
		}
		this.#currentMask = null;
		this.#currentNote = null;
		this.#currentVelocity = null;
		this.#currentBitDepth = null;
	}

	/**
	 * Destroy and release resources
	 */
	destroy() {
		this.clear();
		this.#maskAnimations = {};
		this.#velocityCache.clear();
	}
}

export default MaskManager;
