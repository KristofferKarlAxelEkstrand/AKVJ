/**
 * Shell-level user feedback helpers (main.js boot / hydrate / delete).
 * Outcomes go through `messages.*` → `<user-messages>`; not `alert()` or panel status.
 */
import { messages } from './mainframeState.js';

/**
 * @param {unknown} error
 */
export function reportFailedClipOpen(error) {
	const text = error && typeof error === 'object' && 'message' in error && error.message ? String(error.message) : 'Failed to open clip';
	messages.error(text);
}

/**
 * @param {string} clipId
 * @param {unknown} error
 */
export function reportFailedClipDelete(clipId, error) {
	const detail = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error ?? 'Unknown error');
	messages.error(`Failed to delete clip "${clipId}": ${detail}`);
}

/**
 * @param {unknown} error
 */
export function reportBootApiError(error) {
	const detail = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error ?? 'Unknown error');
	messages.error(`API error: ${detail}`);
}
