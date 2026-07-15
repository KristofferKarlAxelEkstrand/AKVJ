/**
 * LayerGroup - Manages a group of clip slots for a layer group (A, B, or C)
 * Each group can have multiple channels, each with multiple active clips
 *
 * Compositing order within a group:
 * - Lower channel renders first (bottom)
 * - Within a channel, lower note number renders first (bottom)
 */
import { buildVelocityCache, resolveAnimationClip } from '../utils/velocitySelection.js';

/**
 * @typedef {import('./AnimationClip.js').default} AnimationClip
 */
class LayerGroup {
	/** @type {number[]} */
	#channels;

	/** @type {Map<number, Map<number, AnimationClip>>} */
	#activeClips = new Map();

	/** @type {Object} */
	#animations = {};

	/** @type {Map<number, Map<number, number[]>>} */
	#velocityCache = new Map();

	/** @type {AnimationClip[]|null} Cached sorted active clips array */
	#cachedActiveClips = null;

	/** @type {boolean} Flag indicating cache needs rebuild */
	#clipsDirty = true;

	/**
	 * Create a new LayerGroup
	 * @param {number[]} channels - Array of MIDI channels this group handles
	 */
	constructor(channels) {
		this.#channels = channels;

		// Initialize active clips map for each channel
		for (const channel of channels) {
			this.#activeClips.set(channel, new Map());
		}
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
		// Mark cache dirty so the next read rebuilds from the new clip data
		this.#clipsDirty = true;
	}

	/**
	 * Handle MIDI note on event - activate clip
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 * @returns {boolean} True if a clip was activated
	 */
	noteOn(channel, note, velocity) {
		const activeClipsByNote = this.#activeClips.get(channel);
		if (!activeClipsByNote) {
			return false;
		}

		const clip = resolveAnimationClip(this.#animations[channel], note, velocity, this.#velocityCache.get(channel));
		if (!clip) {
			return false;
		}

		// Stop any existing clip on this note before replacing (cleanup on rapid retriggers)
		const existingClip = activeClipsByNote.get(note);
		if (existingClip && existingClip !== clip) {
			existingClip.stop();
		}

		clip.reset();
		activeClipsByNote.set(note, clip);
		this.#clipsDirty = true;

		return true;
	}

	/**
	 * Handle MIDI note off event - deactivate clip
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @returns {boolean} True if a clip was deactivated
	 */
	noteOff(channel, note) {
		const activeClipsByNote = this.#activeClips.get(channel);
		if (!activeClipsByNote) {
			return false;
		}

		const clip = activeClipsByNote.get(note);
		if (clip) {
			clip.stop();
			activeClipsByNote.delete(note);
			this.#clipsDirty = true;
			return true;
		}

		return false;
	}

	/**
	 * Get all active clips for rendering, sorted by channel then note.
	 * Results are cached and only rebuilt when clips change.
	 * Also cleans up finished clips from the Map to prevent memory leaks.
	 * @returns {AnimationClip[]} Array of active clips
	 */
	getActiveClips() {
		// Return cached array if still valid
		if (!this.#clipsDirty && this.#cachedActiveClips !== null) {
			// Filter out finished clips (may have finished since last cache)
			const stillActive = this.#cachedActiveClips.filter(clip => !clip.isFinished);
			if (stillActive.length !== this.#cachedActiveClips.length) {
				this.#cachedActiveClips = stillActive;
				// Also clean up finished clips from the Map to prevent memory leaks
				this.#cleanupFinishedClips();
			}
			return this.#cachedActiveClips;
		}

		// Rebuild cache
		const clips = [];

		// Sort channels in ascending order (lower channel = bottom)
		const sortedChannels = [...this.#channels].sort((a, b) => a - b);

		for (const channel of sortedChannels) {
			const noteClips = this.#activeClips.get(channel);
			if (!noteClips || noteClips.size === 0) {
				continue;
			}

			// Sort notes in ascending order (lower note = bottom)
			const sortedNotes = [...noteClips.keys()].sort((a, b) => a - b);

			for (const note of sortedNotes) {
				const clip = noteClips.get(note);
				if (clip && !clip.isFinished) {
					clips.push(clip);
				}
			}
		}

		this.#cachedActiveClips = clips;
		this.#clipsDirty = false;
		return clips;
	}

	/**
	 * Clean up finished clips from the activeClips Map.
	 * This prevents memory leaks by removing references to non-looping
	 * clips that have completed playback.
	 */
	#cleanupFinishedClips() {
		for (const channel of this.#channels) {
			const noteClips = this.#activeClips.get(channel);
			if (noteClips) {
				for (const [note, clip] of noteClips.entries()) {
					if (clip && clip.isFinished) {
						noteClips.delete(note);
					}
				}
			}
		}
	}

	/**
	 * Check if the group has any active clips
	 * @returns {boolean}
	 */
	hasActiveClips() {
		for (const channelClips of this.#activeClips.values()) {
			for (const clip of channelClips.values()) {
				if (clip && !clip.isFinished) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Clear all active clips and stop their playback
	 */
	clearClips() {
		for (const channelClips of this.#activeClips.values()) {
			for (const clip of channelClips.values()) {
				if (clip) {
					clip.stop();
					if (typeof clip.dispose === 'function') {
						clip.dispose();
					}
				}
			}
			channelClips.clear();
		}
		this.#cachedActiveClips = null;
		this.#clipsDirty = true;
	}

	/**
	 * Destroy the layer group and release resources
	 */
	destroy() {
		this.clearClips();
		this.#animations = {};
		this.#velocityCache.clear();
		this.#cachedActiveClips = null;
		this.#clipsDirty = true;
	}
}

export default LayerGroup;
