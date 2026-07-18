/**
 * Path-safe clip id and PNG filename patterns — single source for server + UI + pipeline.
 */

/** Alphanumeric id with hyphens/underscores; must not be a bare number. */
export const CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/** Basename-only PNG under a clip folder (no path segments). */
export const SAFE_PNG_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.png$/i;

/**
 * @param {unknown} clipId
 * @returns {boolean}
 */
export function isValidClipId(clipId) {
	return typeof clipId === 'string' && CLIP_ID_PATTERN.test(clipId) && !/^\d+$/.test(clipId);
}
