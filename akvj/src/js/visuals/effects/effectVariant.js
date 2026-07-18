/**
 * Shared effect-variant selection for note-ranged FX (color, mirror, split, offset).
 */

/**
 * @param {number} note - MIDI note
 * @param {{ min: number, max?: number }} range - Effect note range from settings
 * @param {number} threshold - Notes below this offset use variant A; at/above use B
 * @returns {{ noteInRange: number, isVariantA: boolean }}
 */
export function getEffectVariant(note, range, threshold) {
	const noteInRange = note - range.min;
	return {
		noteInRange,
		isVariantA: noteInRange < threshold
	};
}
