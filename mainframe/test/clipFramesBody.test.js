// @vitest-environment node

import { describe, test, expect } from 'vitest';
import { decodeFrameDataUrls, parseClipFramesBody } from '../server/clipFramesBody.js';

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64');
const JPEG_B64 = Buffer.from([0xff, 0xd8, 0xff]).toString('base64');
const GIF_B64 = Buffer.from('GIF89a').toString('base64');

describe('decodeFrameDataUrls', () => {
	test('decodes raw base64 without a data-URL prefix', () => {
		const [buf] = decodeFrameDataUrls([PNG_B64]);
		expect(Buffer.isBuffer(buf)).toBe(true);
		expect(buf.equals(Buffer.from(PNG_B64, 'base64'))).toBe(true);
	});

	test('decodes mixed data-URL formats (png, jpeg, gif)', () => {
		const frames = [`data:image/png;base64,${PNG_B64}`, `data:image/jpeg;base64,${JPEG_B64}`, `data:image/gif;base64,${GIF_B64}`];
		const buffers = decodeFrameDataUrls(frames);
		expect(buffers).toHaveLength(3);
		expect(buffers[0].equals(Buffer.from(PNG_B64, 'base64'))).toBe(true);
		expect(buffers[1].equals(Buffer.from(JPEG_B64, 'base64'))).toBe(true);
		expect(buffers[2].equals(Buffer.from(GIF_B64, 'base64'))).toBe(true);
	});
});

describe('parseClipFramesBody', () => {
	test('handles null body', () => {
		const parsed = parseClipFramesBody(null);
		expect(parsed.frameBuffers).toBeNull();
		expect(parsed.frames).toBeUndefined();
		expect(parsed.frameRatesForFrames).toBeUndefined();
		expect(parsed.frameBakeConfigs).toBeUndefined();
	});

	test('handles undefined body', () => {
		const parsed = parseClipFramesBody(undefined);
		expect(parsed.frameBuffers).toBeNull();
		expect(parsed.name).toBeUndefined();
	});

	test('empty frames array yields null frameBuffers', () => {
		const parsed = parseClipFramesBody({ frames: [] });
		expect(parsed.frames).toEqual([]);
		expect(parsed.frameBuffers).toBeNull();
	});

	test('converts frameDurationsMs to frameRatesForFrames', () => {
		const parsed = parseClipFramesBody({ frameDurationsMs: [500, 250] });
		expect(parsed.frameRatesForFrames).toEqual({ 0: 2, 1: 4 });
	});

	test('non-array frameBakeConfigs becomes undefined', () => {
		expect(parseClipFramesBody({ frameBakeConfigs: { x: 1 } }).frameBakeConfigs).toBeUndefined();
		expect(parseClipFramesBody({ frameBakeConfigs: 'nope' }).frameBakeConfigs).toBeUndefined();
	});

	test('preserves array frameBakeConfigs', () => {
		const configs = [{ scaleMode: 'fit' }];
		expect(parseClipFramesBody({ frameBakeConfigs: configs }).frameBakeConfigs).toEqual(configs);
	});

	test('passes through all sync fields', () => {
		const parsed = parseClipFramesBody({
			sync: 'beat',
			syncLength: 'custom',
			syncBeats: 8,
			beatsPerBar: 3
		});
		expect(parsed).toMatchObject({
			sync: 'beat',
			syncLength: 'custom',
			syncBeats: 8,
			beatsPerBar: 3
		});
	});

	test('passes through scaling', () => {
		expect(parseClipFramesBody({ scaling: 'smooth' }).scaling).toBe('smooth');
		expect(parseClipFramesBody({ scaling: 'nearest' }).scaling).toBe('nearest');
		expect(parseClipFramesBody({}).scaling).toBeUndefined();
	});

	test('decodes non-empty frames into frameBuffers', () => {
		const parsed = parseClipFramesBody({ frames: [`data:image/png;base64,${PNG_B64}`] });
		expect(parsed.frameBuffers).toHaveLength(1);
		expect(parsed.frameBuffers[0].equals(Buffer.from(PNG_B64, 'base64'))).toBe(true);
	});
});
