/**
 * Velocity Selection Utilities
 * Shared functions for velocity-based clip selection.
 * Used by LayerGroup and MaskManager to select the appropriate
 * clip variant based on MIDI velocity.
 * @module velocitySelection
 */

/**
 * Build a cache of sorted velocity keys for clip data.
 * Pre-sorts velocity thresholds for efficient lookup during MIDI processing.
 *
 * @public
 * @param {Object<string, Object>} clipsByNote - Clips keyed by note, then velocity
 * @returns {Map<number, number[]>} Map of note number -> sorted velocity threshold array
 * @example
 * const clips = { 60: { 0: clip1, 64: clip2, 100: clip3 } };
 * const cache = buildVelocityCache(clips);
 * // cache.get(60) returns [0, 64, 100]
 */
export function buildVelocityCache(clipsByNote) {
	const cache = new Map();

	for (const [note, velocities] of Object.entries(clipsByNote)) {
		const sorted = Object.keys(velocities)
			.map(Number)
			.sort((a, b) => a - b);
		cache.set(Number(note), sorted);
	}

	return cache;
}

/**
 * Find the appropriate velocity threshold for a given input velocity.
 * Uses a "floor" strategy: returns the highest velocity threshold
 * that doesn't exceed the input velocity.
 *
 * @public
 * @param {number[]} velocities - Sorted array of velocity thresholds (from buildVelocityCache)
 * @param {number} velocity - Input MIDI velocity (0-127)
 * @returns {number|null} The matching velocity threshold, or null if velocity is below all thresholds
 * @example
 * const velocities = [0, 64, 100];
 * findVelocityThreshold(velocities, 50);  // returns 0
 * findVelocityThreshold(velocities, 64);  // returns 64
 * findVelocityThreshold(velocities, 127); // returns 100
 */
export function findVelocityThreshold(velocities, velocity) {
	if (!velocities || velocities.length === 0) {
		return null;
	}

	for (let i = velocities.length - 1; i >= 0; i--) {
		if (velocities[i] <= velocity) {
			return velocities[i];
		}
	}
	return null;
}

/**
 * Resolve the clip for a given note and velocity.
 * Combines velocity cache lookup, velocity clip selection, and clip lookup.
 *
 * @public
 * @param {Object<string, Object<string, Clip>} clipsByNote - Clips keyed by note, then velocity threshold
 * @param {number} note - MIDI note (0-127)
 * @param {number} velocity - MIDI velocity (0-127)
 * @param {Map<number, number[]>} velocityCache - Map of note number -> sorted velocity threshold array
 * @returns {Clip|null} The matching clip, or null if none
 * @example
 * const clip = resolveClip(clips[channel], 60, 100, velocityCache.get(channel));
 */
export function resolveClip(clipsByNote, note, velocity, velocityCache) {
	const velocities = velocityCache?.get(note);
	const velocityThreshold = findVelocityThreshold(velocities, velocity);
	if (velocityThreshold === null) {
		return null;
	}
	return clipsByNote?.[note]?.[velocityThreshold] ?? null;
}
