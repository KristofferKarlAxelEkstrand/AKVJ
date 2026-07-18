import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { expandGifBuffer } from '../server/gifExpand.js';

/** 2×2 two-frame animated GIF; delays 100ms and 250ms. */
const ANIMATED_GIF_2FRAME = Buffer.from(
	'R0lGODlhAgACAPAAAP8AAAAAACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAAgACAAACAoRRACH5BAAZAAAALAAAAAACAAIAgAD/AAAAAAIChFEAOw==',
	'base64'
);

describe('expandGifBuffer', () => {
	it('treats a static GIF as one still', async () => {
		const gif = await sharp({
			create: { width: 2, height: 2, channels: 3, background: { r: 0, g: 0, b: 255 } }
		})
			.gif()
			.toBuffer();
		const result = await expandGifBuffer(gif);
		expect(result.animated).toBe(false);
		expect(result.pages).toBe(1);
		expect(result.frames).toHaveLength(1);
		expect(result.durationsMs).toHaveLength(1);
	});

	it('expands an animated GIF into frames with delays', async () => {
		const result = await expandGifBuffer(ANIMATED_GIF_2FRAME);
		expect(result.animated).toBe(true);
		expect(result.pages).toBe(2);
		expect(result.frames).toHaveLength(2);
		expect(result.durationsMs).toEqual([100, 250]);
	});
});
