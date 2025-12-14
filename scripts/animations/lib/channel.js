/**
 * Channel number conversion utilities.
 *
 * Source animations use 1-16 (user-friendly, matches DAWs).
 * Code and output use 0-15 (zero-indexed for arrays/APIs).
 *
 * This module provides conversion functions for the animation build pipeline.
 */

/**
 * Convert source channel number (1-16) to code channel (0-15).
 * @param {string|number} sourceChannel - Channel from source folder (1-16)
 * @returns {number} Code channel (0-15)
 */
export function toCodeChannel(sourceChannel) {
	const num = typeof sourceChannel === 'string' ? parseInt(sourceChannel, 10) : sourceChannel;
	return num - 1;
}

/**
 * Convert code channel (0-15) to source channel (1-16).
 * @param {number} codeChannel - Code channel (0-15)
 * @returns {number} Source channel (1-16)
 */
export function toSourceChannel(codeChannel) {
	return codeChannel + 1;
}

/**
 * Convert an animation path from source format to code format.
 * Example: "1/0/0" → "0/0/0"
 * @param {string} sourcePath - Path like "channel/note/velocity" (1-16 based channel)
 * @returns {string} Path with 0-15 based channel
 */
export function toCodePath(sourcePath) {
	const parts = sourcePath.split('/');
	if (parts.length > 0) {
		parts[0] = String(toCodeChannel(parts[0]));
	}
	return parts.join('/');
}

/**
 * Channel number for bitmask/mixer animations (in source folder, 1-16).
 * Maps to code channel 4 (0-15).
 */
export const BITMASK_CHANNEL_SOURCE = 5;

/**
 * Channel number for bitmask/mixer animations (in code/output, 0-15).
 */
export const BITMASK_CHANNEL_CODE = 4;
