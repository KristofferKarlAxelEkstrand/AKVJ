import { describe, expect, it } from 'vitest';
import { computeStagingDisplaySize, STAGING_PREVIEW_MAX_DISPLAY_WIDTH } from '../src/js/stagingPreviewDisplay.js';

describe('computeStagingDisplaySize', () => {
	it('doubles default AKVJ frame size', () => {
		expect(computeStagingDisplaySize(240, 135)).toEqual({
			displayWidth: 480,
			displayHeight: 270
		});
	});

	it('caps display width at 960px and scales height', () => {
		expect(STAGING_PREVIEW_MAX_DISPLAY_WIDTH).toBe(960);
		const result = computeStagingDisplaySize(600, 300);
		expect(result.displayWidth).toBe(960);
		expect(result.displayHeight).toBe(480);
	});
});
