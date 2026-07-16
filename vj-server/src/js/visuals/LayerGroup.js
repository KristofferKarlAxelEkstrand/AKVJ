/**
 * LayerGroup - Manages a group of clip slots for a layer group (A, B, or C)
 * Each group can have multiple channels, each with multiple active clips
 *
 * Compositing order within a group:
 * - Lower channel renders first (bottom)
 * - Within a channel, lower note number renders first (bottom)
 */
import { buildVelocityCache, resolveClip } from '../utils/velocitySelection.js';

/**
 * @typedef {import('./Clip.js').default} Clip
 */
class LayerGroup {
	/** @type {number[]} */
	#channels;

	/** @type {Map<number, Map<number, Clip>>} */
	#activeClips = new Map();

	/** @type {Object} */
	#clips = {};

	/** @type {Map<number, Map<number, number[]>>} */
	#velocityCache = new Map();

	/** @type {Clip[]|null} Cached sorted active clips array */
	#cachedActiveClips = null;

	/** @type {boolean} Flag indicating cache needs rebuild */
	#isClipsDirty = true;

	/**
	 * Create a new LayerGroup
	 * @param {number[]} channels - Array of MIDI channels this group handles
	 */
	constructor(channels) {
		this.#channels = channels;

		for (const channel of channels) {
			this.#activeClips.set(channel, new Map());
		}
	}

	/**
	 * Set the loaded clips reference and build velocity cache
	 * @param {Object} clips - Clip data keyed by channel/note/velocity
	 */
	setClips(clips) {
		this.#clips = clips;

		this.#velocityCache.clear();
		for (const channel of this.#channels) {
			const channelClips = clips[channel];
			if (channelClips) {
				this.#velocityCache.set(channel, buildVelocityCache(channelClips));
			}
		}
		this.#isClipsDirty = true;
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

		const clip = resolveClip(this.#clips[channel], note, velocity, this.#velocityCache.get(channel));
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
		this.#isClipsDirty = true;

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
			this.#isClipsDirty = true;
			return true;
		}

		return false;
	}

	/**
	 * Get all active clips for rendering, sorted by channel then note.
	 * Results are cached and only rebuilt when clips change.
	 * Also cleans up finished clips from the Map to prevent memory leaks.
	 * @returns {Clip[]} Array of active clips
	 */
	getActiveClips() {
		if (!this.#isClipsDirty && this.#cachedActiveClips !== null && !this.#hasFinishedClip()) {
			return this.#cachedActiveClips;
		}

		this.#cleanupFinishedClips();
		this.#cachedActiveClips = this.#buildActiveClipsCache();
		this.#isClipsDirty = false;
		return this.#cachedActiveClips;
	}

	#hasFinishedClip() {
		for (const clip of this.#cachedActiveClips) {
			if (clip.isFinished) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Rebuild the sorted active clips array from the activeClips Map.
	 * @returns {Clip[]} Sorted array of active, non-finished clips
	 */
	#buildActiveClipsCache() {
		const clips = [];
		const sortedChannels = [...this.#channels].sort((a, b) => a - b);
		for (const channel of sortedChannels) {
			this.#collectClipsFromChannel(channel, clips);
		}
		return clips;
	}

	#collectClipsFromChannel(channel, clips) {
		const noteClips = this.#activeClips.get(channel);
		if (!noteClips || noteClips.size === 0) {
			return;
		}
		const sortedNotes = [...noteClips.keys()].sort((a, b) => a - b);
		for (const note of sortedNotes) {
			const clip = noteClips.get(note);
			if (clip && !clip.isFinished) {
				clips.push(clip);
			}
		}
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
				}
			}
			channelClips.clear();
		}
		this.#cachedActiveClips = null;
		this.#isClipsDirty = true;
	}

	/**
	 * Destroy the layer group and release resources
	 */
	destroy() {
		try {
			this.clearClips();
		} catch (error) {
			console.error('Error clearing clips in LayerGroup:', error);
		}
		this.#clips = {};
		try {
			this.#velocityCache.clear();
		} catch (error) {
			console.error('Error clearing velocityCache in LayerGroup:', error);
		}
		this.#cachedActiveClips = null;
		this.#isClipsDirty = true;
	}
}

export default LayerGroup;
