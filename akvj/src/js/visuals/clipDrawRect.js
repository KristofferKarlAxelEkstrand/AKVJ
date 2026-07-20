/**
 * Pure draw-rect math and canvas draw helpers for clip scaleMode + placement.
 * Parallel concept to mainframe/shared/frameFit.js (no shared imports across realms).
 */
import { snapToPixel } from '../utils/snapToPixel.js';

/**
 * Max `drawImage` calls per pattern clip per frame.
 * Allows intended small tiles (~4×4 / 8×8 on 240×135) while clamping 1×1 / 2×2 metadata that would
 * otherwise issue tens of thousands of draws and stall the 60fps loop.
 */
export const MAX_PATTERN_TILES_PER_FRAME = 2048;

/**
 * Compute the draw rectangle for fit / cover / none scale modes (no placement applied).
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string} scaleMode
 * @returns {{ dx: number, dy: number, dWidth: number, dHeight: number, sx: number, sy: number, sWidth: number, sHeight: number }}
 */
export function computeDrawRect(sourceWidth, sourceHeight, targetWidth, targetHeight, scaleMode) {
	if (scaleMode === 'fit') {
		const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
		const dWidth = snapToPixel(sourceWidth * scale);
		const dHeight = snapToPixel(sourceHeight * scale);
		return {
			sx: 0,
			sy: 0,
			sWidth: sourceWidth,
			sHeight: sourceHeight,
			dx: snapToPixel((targetWidth - dWidth) / 2),
			dy: snapToPixel((targetHeight - dHeight) / 2),
			dWidth,
			dHeight
		};
	}

	if (scaleMode === 'cover') {
		const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
		const sWidth = sourceWidth / scale;
		const sHeight = sourceHeight / scale;
		return {
			sx: snapToPixel((sourceWidth - sWidth) / 2),
			sy: snapToPixel((sourceHeight - sHeight) / 2),
			sWidth: snapToPixel(sWidth),
			sHeight: snapToPixel(sHeight),
			dx: 0,
			dy: 0,
			dWidth: targetWidth,
			dHeight: targetHeight
		};
	}

	// none — no scale; center with pad and/or centered crop
	const sWidth = Math.min(sourceWidth, targetWidth);
	const sHeight = Math.min(sourceHeight, targetHeight);
	return {
		sx: Math.max(0, snapToPixel((sourceWidth - targetWidth) / 2)),
		sy: Math.max(0, snapToPixel((sourceHeight - targetHeight) / 2)),
		sWidth,
		sHeight,
		dx: Math.max(0, snapToPixel((targetWidth - sourceWidth) / 2)),
		dy: Math.max(0, snapToPixel((targetHeight - sourceHeight) / 2)),
		dWidth: sWidth,
		dHeight: sHeight
	};
}

/**
 * Draw a clip frame stretched to the full target canvas (legacy stretch mode).
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} image
 * @param {number} sourceX
 * @param {number} sourceY
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {number} targetWidth
 * @param {number} targetHeight
 */
export function drawStretch(ctx, image, sourceX, sourceY, sourceWidth, sourceHeight, targetWidth, targetHeight) {
	ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
}

/**
 * Draw a clip frame with fit/cover/none scaleMode and placement offset.
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} image
 * @param {number} sourceX
 * @param {number} sourceY
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string} scaleMode
 * @param {{ x: number, y: number }} placement
 */
export function drawWithScaleMode(ctx, image, sourceX, sourceY, sourceWidth, sourceHeight, targetWidth, targetHeight, scaleMode, placement) {
	const { dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight } = computeDrawRect(sourceWidth, sourceHeight, targetWidth, targetHeight, scaleMode);
	const placedX = snapToPixel(dx + placement.x);
	const placedY = snapToPixel(dy + placement.y);
	ctx.drawImage(image, sourceX + sx, sourceY + sy, sWidth, sHeight, placedX, placedY, dWidth, dHeight);
}

/**
 * Draw a clip frame as a tiled pattern filling the target canvas.
 * Caps draw calls at {@link MAX_PATTERN_TILES_PER_FRAME}.
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} image
 * @param {number} sourceX
 * @param {number} sourceY
 * @param {number} tileWidth
 * @param {number} tileHeight
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {{ x: number, y: number }} placement
 */
export function drawPattern(ctx, image, sourceX, sourceY, tileWidth, tileHeight, targetWidth, targetHeight, placement) {
	if (tileWidth <= 0 || tileHeight <= 0) {
		return;
	}

	const offsetX = snapToPixel(placement.x % tileWidth);
	const offsetY = snapToPixel(placement.y % tileHeight);
	let drawCount = 0;

	for (let y = offsetY - tileHeight; y < targetHeight; y += tileHeight) {
		for (let x = offsetX - tileWidth; x < targetWidth; x += tileWidth) {
			ctx.drawImage(image, sourceX, sourceY, tileWidth, tileHeight, x, y, tileWidth, tileHeight);
			drawCount += 1;
			if (drawCount >= MAX_PATTERN_TILES_PER_FRAME) {
				return;
			}
		}
	}
}
