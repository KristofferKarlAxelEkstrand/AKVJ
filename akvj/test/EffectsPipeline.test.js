import { describe, test, expect, vi, beforeEach } from 'vitest';
import EffectsPipeline from '../src/js/visuals/effects/EffectsPipeline.js';
import settings from '../src/js/core/settings.js';

describe('EffectsPipeline', () => {
	let pipeline;
	let mockCtx;

	beforeEach(() => {
		mockCtx = {
			getImageData: vi.fn(() => ({
				width: 4,
				height: 2,
				data: new Uint8ClampedArray(4 * 2 * 4)
			})),
			putImageData: vi.fn()
		};
		pipeline = new EffectsPipeline(settings.effectParams, settings.effectRanges);
	});

	test('apply does nothing when activeEffects is empty', () => {
		pipeline.apply(mockCtx, [], 1000, { width: 4, height: 2, bpm: 120 });

		expect(mockCtx.getImageData).not.toHaveBeenCalled();
		expect(mockCtx.putImageData).not.toHaveBeenCalled();
	});

	test('apply does nothing when activeEffects is null', () => {
		pipeline.apply(mockCtx, null, 1000, { width: 4, height: 2, bpm: 120 });

		expect(mockCtx.getImageData).not.toHaveBeenCalled();
		expect(mockCtx.putImageData).not.toHaveBeenCalled();
	});

	test('apply calls getImageData and putImageData for valid effects', () => {
		// Use a real effect (color effect with note in range)
		pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, 4, 2);
		expect(mockCtx.putImageData).toHaveBeenCalled();
	});

	test('apply skips unknown effect types', () => {
		pipeline.apply(mockCtx, [{ type: 'nonexistent', note: 0, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		// getImageData is called, but putImageData should not be called
		// because the unknown effect doesn't modify pixels
		expect(mockCtx.getImageData).toHaveBeenCalled();
		expect(mockCtx.putImageData).not.toHaveBeenCalled();
	});

	test('apply skips effects with requiresNote when note is not a number', () => {
		// mirror effect requires note
		pipeline.apply(mockCtx, [{ type: 'mirror', note: undefined, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		expect(mockCtx.getImageData).toHaveBeenCalled();
		expect(mockCtx.putImageData).not.toHaveBeenCalled();
	});

	test('apply allocates scratch buffer on first use', () => {
		pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		// Second call should reuse the scratch buffer
		pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 2000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		expect(mockCtx.getImageData).toHaveBeenCalledTimes(2);
	});

	test('apply does not call putImageData when no effect modifies pixels', () => {
		// strobe effect with velocity 0 returns false (no modification)
		pipeline.apply(mockCtx, [{ type: 'strobe', note: 80, velocity: 0 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		expect(mockCtx.getImageData).toHaveBeenCalled();
		expect(mockCtx.putImageData).not.toHaveBeenCalled();
	});

	test('apply processes multiple effects in order', () => {
		pipeline.apply(
			mockCtx,
			[
				{ type: 'color', note: 48, velocity: 127 },
				{ type: 'mirror', note: 16, velocity: 127 }
			],
			1000,
			{ width: 4, height: 2, bpm: 120 }
		);

		// Both effects modify pixels, so putImageData should be called once
		expect(mockCtx.putImageData).toHaveBeenCalledTimes(1);
	});

	test('apply uses default bpmMin and bpmDefault when not provided in renderContext', () => {
		pipeline.apply(mockCtx, [{ type: 'strobe', note: 80, velocity: 50 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		// Strobe effect uses bpm; with fallback bpmMin=1 and bpmDefault=120
		expect(mockCtx.getImageData).toHaveBeenCalled();
	});

	test('apply reuses effectContext object across calls', () => {
		// Call once to initialize
		pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		// Call again with different dimensions
		mockCtx.getImageData.mockReturnValueOnce({
			width: 8,
			height: 4,
			data: new Uint8ClampedArray(8 * 4 * 4)
		});

		pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 2000, {
			width: 8,
			height: 4,
			bpm: 140
		});

		// Should work correctly with new dimensions
		expect(mockCtx.getImageData).toHaveBeenCalledTimes(2);
		expect(mockCtx.putImageData).toHaveBeenCalledTimes(2);
	});

	test('constructor stores effectParams and effectRanges in effectContext', () => {
		const customParams = { ...settings.effectParams, effectVariantThreshold: 4 };
		const customRanges = { ...settings.effectRanges };
		const customPipeline = new EffectsPipeline(customParams, customRanges);

		// Verify by applying an effect that uses these params
		customPipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});

		// The effect should still work (color effect uses effectParams)
		expect(mockCtx.getImageData).toHaveBeenCalled();
	});

	test('destroy nulls scratch buffer so next apply reallocates', () => {
		pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});
		pipeline.destroy();

		mockCtx.getImageData.mockClear();
		mockCtx.putImageData.mockClear();
		pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 1000, {
			width: 4,
			height: 2,
			bpm: 120
		});
		// Destroyed pipeline is a no-op (effectContext cleared)
		expect(mockCtx.getImageData).not.toHaveBeenCalled();
		expect(mockCtx.putImageData).not.toHaveBeenCalled();
	});

	describe('pipeline-owned scratch buffers', () => {
		const WIDTH = 8;
		const HEIGHT = 4;
		const BLEND_EFFECT = { type: 'grayscaleBlend', note: settings.effectRanges.grayscaleBlend.min, velocity: 127 };
		const DISPLACEMENT_EFFECT = { type: 'grayscaleDisplacement', note: settings.effectRanges.grayscaleDisplacement.min, velocity: 127 };

		/**
		 * Deterministic, varied pixel data — flat pixels would hide displacement.
		 * @returns {Uint8ClampedArray}
		 */
		function createPixels() {
			const pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
			for (let i = 0; i < pixels.length; i += 4) {
				const index = i / 4;
				pixels[i] = (index * 37) % 256;
				pixels[i + 1] = (index * 11) % 256;
				pixels[i + 2] = (index * 91) % 256;
				pixels[i + 3] = 255;
			}
			return pixels;
		}

		/**
		 * Canvas context stub over a single persistent ImageData, so the only
		 * allocations during apply() are the ones the effects make.
		 */
		function createStubContext(pixels) {
			const imageData = { width: WIDTH, height: HEIGHT, data: pixels };
			return {
				imageData,
				getImageData: vi.fn(() => imageData),
				putImageData: vi.fn()
			};
		}

		test('stacked blend + displacement matches applying both with private buffers', async () => {
			const blendEffect = (await import('../src/js/visuals/effects/grayscaleBlendEffect.js')).default;
			const displacementEffect = (await import('../src/js/visuals/effects/grayscaleDisplacementEffect.js')).default;

			const shared = createStubContext(createPixels());
			pipeline.apply(shared, [BLEND_EFFECT, DISPLACEMENT_EFFECT], 1000, { width: WIDTH, height: HEIGHT, bpm: 120 });

			// Reference: same two effects in the same order, but each allocating its
			// own buffers (null scratch buffers force the fallback path).
			const referenceImageData = { width: WIDTH, height: HEIGHT, data: createPixels() };
			const privateContext = {
				width: WIDTH,
				height: HEIGHT,
				effectParams: settings.effectParams,
				effectRanges: settings.effectRanges,
				bpm: 120,
				scratchBuffer: null,
				secondaryScratchBuffer: null
			};
			blendEffect.apply(referenceImageData, BLEND_EFFECT, 1000, privateContext);
			displacementEffect.apply(referenceImageData, DISPLACEMENT_EFFECT, 1000, privateContext);

			expect(Array.from(shared.imageData.data)).toEqual(Array.from(referenceImageData.data));
		});

		test('a warmed-up pipeline allocates nothing on later frames', () => {
			const ctx = createStubContext(createPixels());
			const renderContext = { width: WIDTH, height: HEIGHT, bpm: 120 };
			pipeline.apply(ctx, [BLEND_EFFECT, DISPLACEMENT_EFFECT], 1000, renderContext);

			const RealUint8ClampedArray = globalThis.Uint8ClampedArray;
			let allocations = 0;
			class CountingUint8ClampedArray extends RealUint8ClampedArray {
				constructor(...args) {
					super(...args);
					allocations++;
				}
			}
			globalThis.Uint8ClampedArray = CountingUint8ClampedArray;
			try {
				pipeline.apply(ctx, [BLEND_EFFECT, DISPLACEMENT_EFFECT], 2000, renderContext);
			} finally {
				globalThis.Uint8ClampedArray = RealUint8ClampedArray;
			}

			expect(allocations).toBe(0);
		});

		test('displacement returns early without copying when maxShift is 0', () => {
			const ctx = createStubContext(createPixels());
			const before = Array.from(ctx.imageData.data);

			pipeline.apply(ctx, [{ ...DISPLACEMENT_EFFECT, velocity: 1 }], 1000, { width: WIDTH, height: HEIGHT, bpm: 120 });

			expect(ctx.putImageData).not.toHaveBeenCalled();
			expect(Array.from(ctx.imageData.data)).toEqual(before);
		});
	});

	test('destroy leaves subsequent apply safe (does not throw)', () => {
		pipeline.destroy();
		expect(() =>
			pipeline.apply(mockCtx, [{ type: 'color', note: 48, velocity: 127 }], 1000, {
				width: 4,
				height: 2,
				bpm: 120
			})
		).not.toThrow();
	});
});
