import { describe, test, expect } from 'vitest';
import { flattenKeyMap, nestMappingEntries, assertValidFlatMapping, collectNestedKeyMapErrors } from '../server/mappingService.js';

describe('mappingService', () => {
	test('flatten and nest round-trip', () => {
		const nested = { 1: { 0: { 0: 'clip-a' } }, 5: { 10: { 20: 'clip-b' } } };
		const flat = flattenKeyMap(nested);
		expect(flat).toHaveLength(2);
		expect(nestMappingEntries(flat)).toEqual({
			1: { 0: { 0: 'clip-a' } },
			5: { 10: { 20: 'clip-b' } }
		});
	});

	test('flatten and nest preserve object-leaf overrides', () => {
		const nested = {
			1: {
				60: {
					0: { clipId: 'clip-a', sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 },
					64: { clipId: 'clip-a', triggerType: 'latch', triggerGroup: 'bg' }
				}
			}
		};
		const flat = flattenKeyMap(nested);
		expect(flat).toEqual([
			{
				channel: 1,
				note: 60,
				velocity: 0,
				clipId: 'clip-a',
				overrides: { sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 }
			},
			{
				channel: 1,
				note: 60,
				velocity: 64,
				clipId: 'clip-a',
				overrides: { triggerType: 'latch', triggerGroup: 'bg' }
			}
		]);
		expect(nestMappingEntries(flat)).toEqual(nested);
	});

	test('assertValidFlatMapping accepts ready clips', () => {
		const ready = new Set(['clip-a']);
		expect(() => assertValidFlatMapping([{ channel: 1, note: 0, velocity: 0, clipId: 'clip-a' }], ready)).not.toThrow();
	});

	test('assertValidFlatMapping accepts sync overrides on flat entries', () => {
		const ready = new Set(['clip-a']);
		expect(() =>
			assertValidFlatMapping(
				[
					{
						channel: 1,
						note: 0,
						velocity: 0,
						clipId: 'clip-a',
						overrides: { sync: 'beat', syncLength: '2 bars', beatsPerBar: 4 }
					}
				],
				ready
			)
		).not.toThrow();
	});

	test('assertValidFlatMapping rejects beat sync without syncLength', () => {
		expect(() =>
			assertValidFlatMapping(
				[{ channel: 1, note: 0, velocity: 0, clipId: 'clip-a', overrides: { sync: 'beat' } }],
				new Set(['clip-a'])
			)
		).toThrow(/syncLength is required/);
	});

	test('assertValidFlatMapping rejects unknown clip', () => {
		expect(() => assertValidFlatMapping([{ channel: 1, note: 0, velocity: 0, clipId: 'missing' }], new Set())).toThrow(/missing/);
	});

	test('collectNestedKeyMapErrors finds bad clip ids', () => {
		const errors = collectNestedKeyMapErrors({ 1: { 0: { 0: 'ghost' } } }, new Set(['real']));
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].errors.join(' ')).toMatch(/ghost/);
	});

	test('collectNestedKeyMapErrors accepts string and object leaves', () => {
		const errors = collectNestedKeyMapErrors(
			{
				1: {
					0: { 0: 'clip-a' },
					1: { 0: { clipId: 'clip-a', sync: 'beat', syncLength: '1 bar' } },
					2: { 0: { clipId: 'clip-a', triggerType: 'one-shot', triggerGroup: 'fx' } }
				}
			},
			new Set(['clip-a'])
		);
		expect(errors).toEqual([]);
	});

	test('collectNestedKeyMapErrors rejects invalid sync override shape', () => {
		const errors = collectNestedKeyMapErrors(
			{
				1: {
					0: { 0: { clipId: 'clip-a', sync: 'beat' } },
					1: { 0: { clipId: 'clip-a', syncLength: 'bogus' } },
					2: { 0: { clipId: 'clip-a', sync: 'beat', syncLength: 'custom' } },
					3: { 0: { clipId: 'clip-a', unknownField: true } }
				}
			},
			new Set(['clip-a'])
		);
		const joined = errors.flatMap(entry => entry.errors).join('\n');
		expect(joined).toMatch(/syncLength is required when sync is "beat"/);
		expect(joined).toMatch(/syncLength must be one of/);
		expect(joined).toMatch(/syncBeats is required when syncLength is "custom"/);
		expect(joined).toMatch(/unknown mapping override "unknownField"/);
	});
});
