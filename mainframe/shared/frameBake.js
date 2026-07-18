/**
 * Per-frame bake-time composition (import editor → spritesheet).
 * Editing-session only — not persisted in meta.json.
 */
import { resolvePlacement, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT } from './clipSchema.js';

/** Bake-time scale modes (runtime `pattern` is not a bake mode). */
export const FRAME_BAKE_SCALE_MODES = Object.freeze(['fit', 'cover', 'stretch', 'none', 'custom']);

/**
 * @typedef {{ scaleMode: string, placement: { x: number, y: number }, width: number, height: number }} FrameBakeConfig
 */

/**
 * @param {unknown} raw
 * @param {number} [cellWidth]
 * @param {number} [cellHeight]
 * @returns {FrameBakeConfig}
 */
export function resolveFrameBakeConfig(raw, cellWidth = DEFAULT_FRAME_WIDTH, cellHeight = DEFAULT_FRAME_HEIGHT) {
	const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
	const scaleMode =
		typeof source.scaleMode === 'string' && FRAME_BAKE_SCALE_MODES.includes(source.scaleMode) ? source.scaleMode : 'fit';
	const placement = resolvePlacement(source.placement);
	const width = Number(source.width);
	const height = Number(source.height);
	return {
		scaleMode,
		placement,
		width: Number.isFinite(width) && width > 0 ? Math.floor(width) : cellWidth,
		height: Number.isFinite(height) && height > 0 ? Math.floor(height) : cellHeight
	};
}

/**
 * @param {FrameBakeConfig} a
 * @param {FrameBakeConfig} b
 * @returns {boolean}
 */
export function frameBakeConfigsEqual(a, b) {
	return (
		a.scaleMode === b.scaleMode &&
		a.placement.x === b.placement.x &&
		a.placement.y === b.placement.y &&
		(a.scaleMode !== 'custom' || (a.width === b.width && a.height === b.height))
	);
}

/**
 * @param {FrameBakeConfig[]} configs
 * @returns {boolean}
 */
export function areFrameBakeConfigsUniform(configs) {
	if (!configs || configs.length === 0) {
		return true;
	}
	const first = configs[0];
	return configs.every(config => frameBakeConfigsEqual(config, first));
}
