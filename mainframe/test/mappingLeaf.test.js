import { describe, test, expect } from 'vitest';
import { parseMappingLeaf, serializeMappingLeaf, parseFlatMappingEntry, collectMappingOverrideErrors } from '../shared/mappingLeaf.js';

describe('parseMappingLeaf', () => {
	test('accepts bare clipId string', () => {
		expect(parseMappingLeaf('clip-a')).toEqual({ ok: true, clipId: 'clip-a', overrides: null });
	});

	test('accepts object leaf with string clipId and no overrides', () => {
		expect(parseMappingLeaf({ clipId: 'clip-a' })).toEqual({ ok: true, clipId: 'clip-a', overrides: null });
	});

	test('accepts object leaf with overrides', () => {
		expect(parseMappingLeaf({ clipId: 'clip-a', triggerType: 'latch' })).toEqual({
			ok: true,
			clipId: 'clip-a',
			overrides: { triggerType: 'latch' }
		});
	});

	test.each([null, 42, true, ['clip-a']])('rejects non-string/non-object leaf (%j)', leaf => {
		const result = parseMappingLeaf(leaf);
		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/clipId string or object/);
	});

	test('rejects object without string clipId', () => {
		expect(parseMappingLeaf({ triggerType: 'latch' }).ok).toBe(false);
		expect(parseMappingLeaf({ clipId: 7 }).ok).toBe(false);
		expect(parseMappingLeaf({ clipId: null }).error).toMatch(/string clipId/);
	});
});

describe('serializeMappingLeaf', () => {
	test('empty or null overrides return bare clipId string', () => {
		expect(serializeMappingLeaf('clip-a', null)).toBe('clip-a');
		expect(serializeMappingLeaf('clip-a', undefined)).toBe('clip-a');
		expect(serializeMappingLeaf('clip-a', {})).toBe('clip-a');
	});

	test('non-empty overrides return object leaf', () => {
		expect(serializeMappingLeaf('clip-a', { triggerType: 'latch', triggerGroup: 'bg' })).toEqual({
			clipId: 'clip-a',
			triggerType: 'latch',
			triggerGroup: 'bg'
		});
	});
});

describe('parseFlatMappingEntry', () => {
	test('rejects non-object entry', () => {
		expect(parseFlatMappingEntry(null).ok).toBe(false);
		expect(parseFlatMappingEntry('clip-a').ok).toBe(false);
		expect(parseFlatMappingEntry(undefined).error).toMatch(/must be an object/);
	});

	test('string clipId with overrides object', () => {
		expect(
			parseFlatMappingEntry({
				channel: 1,
				note: 0,
				velocity: 0,
				clipId: 'clip-a',
				overrides: { sync: 'beat', syncLength: '1 bar' }
			})
		).toEqual({
			ok: true,
			clipId: 'clip-a',
			overrides: { sync: 'beat', syncLength: '1 bar' }
		});
	});

	test('string clipId with empty overrides becomes null', () => {
		expect(parseFlatMappingEntry({ clipId: 'clip-a', overrides: {} })).toEqual({
			ok: true,
			clipId: 'clip-a',
			overrides: null
		});
	});

	test('legacy bad nested clipId object is parsed via parseMappingLeaf', () => {
		const result = parseFlatMappingEntry({
			channel: 1,
			note: 0,
			velocity: 0,
			clipId: { clipId: 'nested-clip', triggerType: 'one-shot' }
		});
		expect(result).toEqual({
			ok: true,
			clipId: 'nested-clip',
			overrides: { triggerType: 'one-shot' }
		});
	});

	test('legacy nested clipId without string clipId fails', () => {
		const result = parseFlatMappingEntry({ clipId: { triggerType: 'latch' } });
		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/string clipId/);
	});
});

describe('collectMappingOverrideErrors', () => {
	test('null/undefined overrides are valid', () => {
		expect(collectMappingOverrideErrors(null)).toEqual([]);
		expect(collectMappingOverrideErrors(undefined)).toEqual([]);
	});

	test('rejects non-object overrides', () => {
		expect(collectMappingOverrideErrors(['latch'])).toEqual(['overrides must be a plain object']);
		expect(collectMappingOverrideErrors('latch')).toEqual(['overrides must be a plain object']);
	});

	test('rejects unknown override keys', () => {
		expect(collectMappingOverrideErrors({ frameRate: 12 })[0]).toMatch(/unknown mapping override "frameRate"/);
	});

	test('rejects invalid triggerType', () => {
		expect(collectMappingOverrideErrors({ triggerType: 'toggle' })[0]).toMatch(/triggerType must be one of/);
		expect(collectMappingOverrideErrors({ triggerType: 1 })[0]).toMatch(/triggerType must be one of/);
	});

	test('rejects boolean/object triggerGroup', () => {
		expect(collectMappingOverrideErrors({ triggerGroup: true })[0]).toMatch(/triggerGroup must be a string, number, or null/);
		expect(collectMappingOverrideErrors({ triggerGroup: { id: 'x' } })[0]).toMatch(/triggerGroup must be a string, number, or null/);
	});

	test('accepts string/number/null triggerGroup', () => {
		expect(collectMappingOverrideErrors({ triggerGroup: 'bg' })).toEqual([]);
		expect(collectMappingOverrideErrors({ triggerGroup: 3 })).toEqual([]);
		expect(collectMappingOverrideErrors({ triggerGroup: null })).toEqual([]);
	});

	test('rejects non-positive or non-number syncBeats', () => {
		expect(collectMappingOverrideErrors({ syncBeats: 0 })[0]).toMatch(/syncBeats must be a positive number/);
		expect(collectMappingOverrideErrors({ syncBeats: -1 })[0]).toMatch(/syncBeats must be a positive number/);
		expect(collectMappingOverrideErrors({ syncBeats: '2' })[0]).toMatch(/syncBeats must be a positive number/);
	});

	test('rejects non-integer beatsPerBar', () => {
		expect(collectMappingOverrideErrors({ beatsPerBar: 1.5 })[0]).toMatch(/beatsPerBar must be a positive integer/);
		expect(collectMappingOverrideErrors({ beatsPerBar: 0 })[0]).toMatch(/beatsPerBar must be a positive integer/);
		expect(collectMappingOverrideErrors({ beatsPerBar: '4' })[0]).toMatch(/beatsPerBar must be a positive integer/);
	});

	test('accepts valid overrides', () => {
		expect(
			collectMappingOverrideErrors({
				triggerType: 'latch',
				triggerGroup: 'bg',
				sync: 'beat',
				syncLength: 'custom',
				syncBeats: 2,
				beatsPerBar: 4
			})
		).toEqual([]);
	});
});
