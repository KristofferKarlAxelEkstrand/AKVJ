/** Max CSS display width for staging preview (2× frame, then capped). */
export const STAGING_PREVIEW_MAX_DISPLAY_WIDTH = 960;

/**
 * Compute on-screen CSS size for the staging preview canvas.
 * Buffer stays at true frame size; display is 2×, capped at maxWidth.
 *
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {number} [maxWidth=960]
 * @returns {{ displayWidth: number, displayHeight: number }}
 */
export function computeStagingDisplaySize(frameWidth, frameHeight, maxWidth = STAGING_PREVIEW_MAX_DISPLAY_WIDTH) {
	const width = Math.max(1, Number(frameWidth) || 1);
	const height = Math.max(1, Number(frameHeight) || 1);
	const cap = Math.max(1, Number(maxWidth) || STAGING_PREVIEW_MAX_DISPLAY_WIDTH);
	let displayWidth = width * 2;
	let displayHeight = height * 2;
	if (displayWidth > cap) {
		const scale = cap / displayWidth;
		displayWidth = cap;
		displayHeight = Math.max(1, Math.round(displayHeight * scale));
	}
	return { displayWidth, displayHeight };
}
