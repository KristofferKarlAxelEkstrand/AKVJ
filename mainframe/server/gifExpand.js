import sharp from 'sharp';
import { fpsToMs } from '../shared/frameTiming.js';

/**
 * Expand a GIF buffer into PNG frames + millisecond delays.
 * Animated when `pages > 1`; otherwise returns a single still (page 0).
 *
 * @param {Buffer} buffer
 * @returns {Promise<{ animated: boolean, pages: number, frames: Buffer[], durationsMs: number[] }>}
 */
export async function expandGifBuffer(buffer) {
	const meta = await sharp(buffer, { animated: true }).metadata();
	const pages = meta.pages ?? 1;

	if (pages <= 1) {
		const frame = await sharp(buffer, { page: 0 }).ensureAlpha().png().toBuffer();
		return {
			animated: false,
			pages: 1,
			frames: [frame],
			durationsMs: [fpsToMs(12)]
		};
	}

	const delayList = normalizeGifDelays(meta.delay, pages);
	const frames = [];
	const durationsMs = [];

	for (let page = 0; page < pages; page++) {
		frames.push(await sharp(buffer, { page, pages: 1 }).ensureAlpha().png().toBuffer());
		durationsMs.push(delayList[page] > 0 ? delayList[page] : fpsToMs(12));
	}

	return { animated: true, pages, frames, durationsMs };
}

/**
 * @param {number|number[]|undefined} delay
 * @param {number} pages
 * @returns {number[]}
 */
function normalizeGifDelays(delay, pages) {
	if (Array.isArray(delay)) {
		const list = delay.slice(0, pages);
		while (list.length < pages) {
			list.push(list.at(-1) ?? 0);
		}
		return list;
	}
	const value = Number(delay) || 0;
	return Array.from({ length: pages }, () => value);
}
