import { isValidClipId } from '../../shared/clipId.js';

export { isValidClipId };

/**
 * Build the edit URL for a clip.
 * @param {string} clipId
 * @returns {string}
 */
export function editClipPath(clipId) {
	return `/clip/edit/${encodeURIComponent(clipId)}`;
}

/**
 * Decide how the clip editor should respond to a URL clip id.
 * @param {unknown} clipId
 * @returns {{ action: 'new' } | { action: 'edit', clipId: string } | { action: 'invalid', message: string }}
 */
export function resolveClipEditRoute(clipId) {
	if (clipId === null || clipId === undefined || clipId === '') {
		return { action: 'new' };
	}
	if (!isValidClipId(clipId)) {
		return { action: 'invalid', message: 'Invalid clip ID' };
	}
	return { action: 'edit', clipId };
}
