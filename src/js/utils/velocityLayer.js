/**
 * Velocity Layer Utilities
 * Shared functions for velocity-based animation selection
 */

/**
 * Build a cache of sorted velocity keys for animation data
 * @param {Object} animationData - Animation data keyed by note/velocity
 * @returns {Map<number, number[]>} Map of note -> sorted velocity keys
 */
export function buildVelocityCache(animationData) {
	const cache = new Map();

	for (const [note, velocities] of Object.entries(animationData)) {
		const sorted = Object.keys(velocities)
			.map(Number)
			.sort((a, b) => a - b);
		cache.set(Number(note), sorted);
	}

	return cache;
}

/**
 * Find the appropriate velocity layer for a given input velocity
 * Returns the highest velocity key that doesn't exceed the input
 * @param {number[]} velocities - Sorted array of velocity keys
 * @param {number} velocity - Input velocity (0-127)
 * @returns {number|null} The velocity layer key, or null if none available
 */
export function findVelocityLayer(velocities, velocity) {
	if (!velocities || velocities.length === 0) {
		return null;
	}

	// Find the highest velocity layer that doesn't exceed the input velocity
	for (let i = velocities.length - 1; i >= 0; i--) {
		if (velocities[i] <= velocity) {
			return velocities[i];
		}
	}
	return null;
}
