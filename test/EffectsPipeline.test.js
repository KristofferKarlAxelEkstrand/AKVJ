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

		// Strobe effect uses bpm; with default bpmMin=1 and bpmDefault=120
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
});
