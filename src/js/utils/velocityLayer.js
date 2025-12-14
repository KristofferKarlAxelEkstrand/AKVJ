/**
 * Velocity Layer Utilities
 * Shared functions for velocity-based animation selection.
 * Used by LayerGroup and MaskManager to select the appropriate
 * animation variant based on MIDI velocity.
 * @module velocityLayer
 */

/**
 * Build a cache of sorted velocity keys for animation data.
 * Pre-sorts velocity thresholds for efficient lookup during MIDI processing.
 *
 * @public
 * @param {Object<string, Object>} animationData - Animation data keyed by note, then velocity
 * @returns {Map<number, number[]>} Map of note number -> sorted velocity threshold array
 * @example
 * const animations = { 60: { 0: layer1, 64: layer2, 100: layer3 } };
 * const cache = buildVelocityCache(animations);
 * // cache.get(60) returns [0, 64, 100]
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
 * Find the appropriate velocity layer for a given input velocity.
 * Uses a "floor" strategy: returns the highest velocity threshold
 * that doesn't exceed the input velocity.
 *
 * @public
 * @param {number[]} velocities - Sorted array of velocity thresholds (from buildVelocityCache)
 * @param {number} velocity - Input MIDI velocity (0-127)
 * @returns {number|null} The matching velocity threshold, or null if velocity is below all thresholds
 * @example
 * const velocities = [0, 64, 100];
 * findVelocityLayer(velocities, 50);  // returns 0
 * findVelocityLayer(velocities, 64);  // returns 64
 * findVelocityLayer(velocities, 127); // returns 100
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
