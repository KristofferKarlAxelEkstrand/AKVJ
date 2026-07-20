import { describe, expect, it, vi, afterEach } from 'vitest';
import { fpsToMs } from '../shared/frameTiming.js';

/** Optional metadata override for delay-normalization edge tests. */
let metadataOverride = null;

vi.mock('sharp', async importOriginal => {
	const actual = await importOriginal();
	const realSharp = actual.default;

	function sharp(...args) {
		const instance = realSharp(...args);
		if (!metadataOverride) {
			return instance;
		}
		const override = metadataOverride;
		return new Proxy(instance, {
			get(target, prop, receiver) {
				if (prop === 'metadata') {
					return async () => {
						const meta = await target.metadata();
						return { ...meta, ...override };
					};
				}
				const value = Reflect.get(target, prop, receiver);
				return typeof value === 'function' ? value.bind(target) : value;
			}
		});
	}

	Object.assign(sharp, realSharp);
	return { ...actual, default: sharp };
});

const { default: sharp } = await import('sharp');
const { expandGifBuffer } = await import('../server/gifExpand.js');

/** 2×2 two-frame animated GIF; delays 100ms and 250ms. */
const ANIMATED_GIF_2FRAME = Buffer.from('R0lGODlhAgACAPAAAP8AAAAAACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAAgACAAACAoRRACH5BAAZAAAALAAAAAACAAIAgAD/AAAAAAIChFEAOw==', 'base64');

describe('expandGifBuffer', () => {
	afterEach(() => {
		metadataOverride = null;
	});

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
		expect(result.durationsMs).toEqual([fpsToMs(12)]);
	});

	it('expands an animated GIF into frames with delays', async () => {
		const result = await expandGifBuffer(ANIMATED_GIF_2FRAME);
		expect(result.animated).toBe(true);
		expect(result.pages).toBe(2);
		expect(result.frames).toHaveLength(2);
		expect(result.durationsMs).toEqual([100, 250]);
	});

	it('rejects a corrupt buffer', async () => {
		await expect(expandGifBuffer(Buffer.from('not-a-gif'))).rejects.toThrow();
	});

	it('falls back to fpsToMs(12) when a page delay is 0', async () => {
		const gif = await sharp(ANIMATED_GIF_2FRAME, { animated: true }).gif({ delay: [0, 200] }).toBuffer();
		const result = await expandGifBuffer(gif);
		expect(result.durationsMs).toEqual([fpsToMs(12), 200]);
	});

	it('applies a scalar meta.delay to every page', async () => {
		metadataOverride = { pages: 2, delay: 40 };
		const result = await expandGifBuffer(ANIMATED_GIF_2FRAME);
		expect(result.animated).toBe(true);
		expect(result.pages).toBe(2);
		expect(result.durationsMs).toEqual([40, 40]);
	});

	it('pads a short delay array with the last value', async () => {
		// Sharp normally pads on write; override metadata so normalizeGifDelays pads [100] → [100,100].
		metadataOverride = { pages: 2, delay: [100] };
		const result = await expandGifBuffer(ANIMATED_GIF_2FRAME);
		expect(result.pages).toBe(2);
		expect(result.durationsMs).toEqual([100, 100]);
	});
});
