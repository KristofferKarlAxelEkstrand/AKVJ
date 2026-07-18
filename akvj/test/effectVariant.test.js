import { describe, test, expect } from 'vitest';
import { getEffectVariant } from '../src/js/visuals/effects/effectVariant.js';

describe('getEffectVariant', () => {
	const range = { min: 48, max: 63 };
	const threshold = 8;

	test('isVariantA true when noteInRange is below threshold', () => {
		expect(getEffectVariant(48, range, threshold)).toEqual({ noteInRange: 0, isVariantA: true });
		expect(getEffectVariant(55, range, threshold)).toEqual({ noteInRange: 7, isVariantA: true });
	});

	test('isVariantA false when noteInRange is at or above threshold', () => {
		expect(getEffectVariant(56, range, threshold)).toEqual({ noteInRange: 8, isVariantA: false });
		expect(getEffectVariant(60, range, threshold)).toEqual({ noteInRange: 12, isVariantA: false });
	});
});
