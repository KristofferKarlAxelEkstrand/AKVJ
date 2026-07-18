/**
 * Shared clip frame scale modes (create / staging preview / recompile).
 */
import { DEFAULT_SCALE_MODE } from './clipSchema.js';

/** @type {readonly string[]} */
export const SCALE_MODES = Object.freeze(['fit', 'cover', 'stretch', 'none', 'pattern']);

export { DEFAULT_SCALE_MODE };

/**
 * @param {unknown} mode
 * @returns {'fit'|'cover'|'stretch'|'none'}
 */
export function resolveScaleMode(mode) {
	return SCALE_MODES.includes(mode) ? mode : DEFAULT_SCALE_MODE;
}

/**
 * Compute canvas `drawImage` source/dest rects for placing a source into a target frame.
 *
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string} [scaleMode]
 * @returns {{ sx: number, sy: number, sWidth: number, sHeight: number, dx: number, dy: number, dWidth: number, dHeight: number }}
 */
export function computeFrameDrawRect(sourceWidth, sourceHeight, targetWidth, targetHeight, scaleMode) {
	const mode = resolveScaleMode(scaleMode);
	const sw = Math.max(1, sourceWidth);
	const sh = Math.max(1, sourceHeight);
	const tw = Math.max(1, targetWidth);
	const th = Math.max(1, targetHeight);

	if (mode === 'stretch') {
		return { sx: 0, sy: 0, sWidth: sw, sHeight: sh, dx: 0, dy: 0, dWidth: tw, dHeight: th };
	}

	if (mode === 'fit') {
		const scale = Math.min(tw / sw, th / sh);
		const dWidth = sw * scale;
		const dHeight = sh * scale;
		return {
			sx: 0,
			sy: 0,
			sWidth: sw,
			sHeight: sh,
			dx: (tw - dWidth) / 2,
			dy: (th - dHeight) / 2,
			dWidth,
			dHeight
		};
	}

	if (mode === 'cover') {
		const scale = Math.max(tw / sw, th / sh);
		const sWidth = tw / scale;
		const sHeight = th / scale;
		return {
			sx: (sw - sWidth) / 2,
			sy: (sh - sHeight) / 2,
			sWidth,
			sHeight,
			dx: 0,
			dy: 0,
			dWidth: tw,
			dHeight: th
		};
	}

	// none — no scale; center with pad and/or centered crop
	const sWidth = Math.min(sw, tw);
	const sHeight = Math.min(sh, th);
	return {
		sx: Math.max(0, (sw - tw) / 2),
		sy: Math.max(0, (sh - th) / 2),
		sWidth,
		sHeight,
		dx: Math.max(0, (tw - sw) / 2),
		dy: Math.max(0, (th - sh) / 2),
		dWidth: sWidth,
		dHeight: sHeight
	};
}
