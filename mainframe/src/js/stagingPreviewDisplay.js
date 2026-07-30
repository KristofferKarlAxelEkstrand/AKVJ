/** Display scale for staging preview (frame CSS size relative to buffer). */
export const STAGING_PREVIEW_DISPLAY_SCALE = 2;

/** Max CSS display width for staging preview (scaled frame, then capped). */
export const STAGING_PREVIEW_MAX_DISPLAY_WIDTH = 960;

/**
 * Compute on-screen CSS size for the staging preview canvas.
 * Buffer stays at true frame size; display is scaled, capped at maxWidth.
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
	let displayWidth = width * STAGING_PREVIEW_DISPLAY_SCALE;
	let displayHeight = height * STAGING_PREVIEW_DISPLAY_SCALE;
	if (displayWidth > cap) {
		const scale = cap / displayWidth;
		displayWidth = cap;
		displayHeight = Math.max(1, Math.round(displayHeight * scale));
	}
	return { displayWidth, displayHeight };
}
