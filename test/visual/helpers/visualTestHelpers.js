import { vi } from 'vitest';
import settings from '../../../src/js/core/settings.js';

const { width, height } = settings.canvas;

/**
 * Create a mock clip with a custom draw function.
 * The clip's renderToContext method calls drawFn(ctx, timestamp).
 *
 * @param {Function} drawFn - Function called with (ctx, timestamp) to draw the clip
 * @returns {Object} Mock Clip
 */
export function createMockClip(drawFn) {
	return {
		renderToContext: drawFn,
		play: vi.fn(),
		stop: vi.fn(),
		reset: vi.fn(),
		dispose: vi.fn(),
		isFinished: false
	};
}

/**
 * Create a clip that fills the canvas with a solid RGB color.
 *
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @returns {Object} Mock Clip
 */
export function createSolidFillClip(r, g, b) {
	return createMockClip(ctx => {
		ctx.fillStyle = `rgb(${r},${g},${b})`;
		ctx.fillRect(0, 0, width, height);
	});
}

/**
 * Create a clip that draws a horizontal or vertical gradient.
 *
 * @param {'horizontal'|'vertical'} direction - Gradient direction
 * @param {[number,number,number]} fromColor - Starting RGB color
 * @param {[number,number,number]} toColor - Ending RGB color
 * @returns {Object} Mock Clip
 */
export function createGradientClip(direction, fromColor, toColor) {
	return createMockClip(ctx => {
		let gradient;
		if (direction === 'horizontal') {
			gradient = ctx.createLinearGradient(0, 0, width, 0);
		} else {
			gradient = ctx.createLinearGradient(0, 0, 0, height);
		}
		gradient.addColorStop(0, `rgb(${fromColor[0]},${fromColor[1]},${fromColor[2]})`);
		gradient.addColorStop(1, `rgb(${toColor[0]},${toColor[1]},${toColor[2]})`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
	});
}

/**
 * Create a clip that draws horizontal stripes of alternating colors.
 *
 * @param {[number,number,number]} colorA - First stripe color
 * @param {[number,number,number]} colorB - Second stripe color
 * @param {number} stripeWidth - Width of each stripe in pixels
 * @returns {Object} Mock Clip
 */
export function createStripedClip(colorA, colorB, stripeWidth = 10) {
	return createMockClip(ctx => {
		for (let y = 0; y < height; y += stripeWidth * 2) {
			ctx.fillStyle = `rgb(${colorA[0]},${colorA[1]},${colorA[2]})`;
			ctx.fillRect(0, y, width, stripeWidth);
			ctx.fillStyle = `rgb(${colorB[0]},${colorB[1]},${colorB[2]})`;
			ctx.fillRect(0, y + stripeWidth, width, stripeWidth);
		}
	});
}

/**
 * Create a clip that draws an asymmetric pattern (useful for mirror/split tests).
 * Left half is red, right half is blue with a green square in the top-left.
 *
 * @returns {Object} Mock Clip
 */
export function createAsymmetricPatternClip() {
	return createMockClip(ctx => {
		ctx.fillStyle = 'rgb(255,0,0)';
		ctx.fillRect(0, 0, Math.floor(width / 2), height);
		ctx.fillStyle = 'rgb(0,0,255)';
		ctx.fillRect(Math.floor(width / 2), 0, width - Math.floor(width / 2), height);
		ctx.fillStyle = 'rgb(0,255,0)';
		ctx.fillRect(5, 5, 20, 20);
	});
}

/**
 * Create a mask clip that draws specific mask patterns.
 * Mask clips use grayscale values (R=G=B) where 0=show A, 255=show B.
 *
 * @param {string} type - Mask type: '1bit-split', '2bit-gradient', '4bit-gradient', '8bit-gradient', '8bit-50gray'
 * @returns {Object} Mock Clip
 */
export function createMaskClip(type) {
	const drawFns = {
		'1bit-split': ctx => {
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, Math.floor(width / 2), height);
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(Math.floor(width / 2), 0, width - Math.floor(width / 2), height);
		},
		'2bit-gradient': ctx => {
			const levels = [0, 64, 128, 192];
			const segmentWidth = Math.floor(width / levels.length);
			levels.forEach((grayLevel, i) => {
				ctx.fillStyle = `rgb(${grayLevel},${grayLevel},${grayLevel})`;
				ctx.fillRect(i * segmentWidth, 0, segmentWidth, height);
			});
		},
		'4bit-gradient': ctx => {
			const levels = 16;
			const segmentWidth = Math.floor(width / levels);
			for (let i = 0; i < levels; i++) {
				const grayLevel = Math.floor((i * 255) / (levels - 1));
				ctx.fillStyle = `rgb(${grayLevel},${grayLevel},${grayLevel})`;
				ctx.fillRect(i * segmentWidth, 0, segmentWidth, height);
			}
		},
		'8bit-gradient': ctx => {
			const gradient = ctx.createLinearGradient(0, 0, width, 0);
			gradient.addColorStop(0, '#000000');
			gradient.addColorStop(1, '#ffffff');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, height);
		},
		'8bit-50gray': ctx => {
			ctx.fillStyle = '#808080';
			ctx.fillRect(0, 0, width, height);
		}
	};

	return createMockClip(drawFns[type]);
}

/**
 * Create a mock LayerManager with configurable active clips, mask, and effects.
 *
 * @param {Object} options
 * @param {Object} [options.clipA] - Mock Clip for Layer Group A (or null for empty)
 * @param {Object} [options.clipB] - Mock Clip for Layer Group B (or null for empty)
 * @param {Object} [options.clipC] - Mock Clip for Layer Group C (or null for empty)
 * @param {Object} [options.maskClip] - Mock mask clip (or null for no mask)
 * @param {number} [options.maskBitDepth] - Bit depth for the mask clip
 * @param {Array} [options.mixedOutputEffects] - Array of effect objects for mixed Layer Group A and Layer Group B output effects
 * @param {Array} [options.globalEffects] - Array of effect objects for global effects
 * @returns {Object} Mock LayerManager
 */
export function createMockLayerManager({ clipA = null, clipB = null, clipC = null, maskClip = null, maskBitDepth = 1, mixedOutputEffects = [], globalEffects = [] }) {
	const emptyGroup = {
		hasActiveClips: () => false,
		getActiveClips: () => []
	};

	const makeGroup = clip =>
		clip
			? {
					hasActiveClips: () => true,
					getActiveClips: () => [clip]
				}
			: emptyGroup;

	return {
		getLayerGroupA: () => makeGroup(clipA),
		getLayerGroupB: () => makeGroup(clipB),
		getLayerGroupC: () => makeGroup(clipC),
		getMaskManager: () => ({
			getCurrentMask: () => maskClip,
			getBitDepth: () => (maskClip ? maskBitDepth : null)
		}),
		getEffectsManager: () => ({
			hasMixedOutputEffects: () => mixedOutputEffects.length > 0,
			hasGlobalEffects: () => globalEffects.length > 0,
			getActiveMixedOutputEffects: () => mixedOutputEffects,
			getActiveGlobalEffects: () => globalEffects
		})
	};
}

/**
 * Create an effect object matching the EffectsManager format.
 *
 * @param {string} type - Effect type: 'split', 'mirror', 'offset', 'color', 'glitch', 'strobe'
 * @param {number} note - MIDI note number
 * @param {number} velocity - MIDI velocity (0-127)
 * @returns {{type: string, note: number, velocity: number}}
 */
export function createEffect(type, note, velocity) {
	return { type, note, velocity };
}

/**
 * Canvas dimensions for use in tests.
 */
export const canvasWidth = width;
export const canvasHeight = height;
