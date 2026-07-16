import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** mainframe/server → mainframe → repo root */
export const REPO_ROOT = path.resolve(__dirname, '../..');
export const CLIPS_DIR = process.env.AKVJ_CLIPS_DIR || path.join(REPO_ROOT, 'clips');
export const MIDI_LAYOUT_PATH = path.join(CLIPS_DIR, 'midi-layout.json');

const CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const SAFE_PNG_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.png$/i;

/**
 * @param {string} clipId
 * @returns {boolean}
 */
export function isValidClipId(clipId) {
	return typeof clipId === 'string' && CLIP_ID_PATTERN.test(clipId) && !/^\d+$/.test(clipId);
}

/**
 * @param {string} clipId
 * @returns {string}
 */
export function clipDir(clipId) {
	if (!isValidClipId(clipId)) {
		throw new Error(`Invalid clipId: ${clipId}`);
	}
	return path.join(CLIPS_DIR, clipId);
}

/**
 * Resolve a sprite path under the clip dir; reject path traversal via meta.png.
 * @param {string} clipId
 * @param {string} pngName
 * @returns {string}
 */
export function resolveSafeSpritePath(clipId, pngName) {
	const baseName = path.basename(String(pngName));
	if (!SAFE_PNG_NAME.test(baseName)) {
		throw new Error('Invalid sprite filename');
	}
	const clipRoot = path.resolve(clipDir(clipId));
	const spritePath = path.resolve(clipRoot, baseName);
	if (!spritePath.startsWith(clipRoot + path.sep) && spritePath !== clipRoot) {
		throw new Error('Sprite path escapes clip directory');
	}
	return spritePath;
}
