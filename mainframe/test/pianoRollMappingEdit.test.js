// @vitest-environment jsdom

import { describe, test, expect } from 'vitest';
import { MIN_REGION_VELOCITY, redistributeVelocities } from '../src/js/PianoKey.js';
import { flattenKeyMap, nestMappingEntries } from '../shared/mappingService.js';
import {
	assignCells,
	cellKey,
	changedNotes,
	cloneMappings,
	deleteCells,
	movePlacement,
	noteEntries,
	replaceNoteMappings
} from '../src/js/pianoRollMappingEdit.js';

describe('pianoRollMappingEdit', () => {
	test('cellKey joins note velocity clipId', () => {
		expect(cellKey(60, 0, 'kick')).toBe('60:0:kick');
	});

	test('cloneMappings returns isolated shallow copies', () => {
		const mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'kick', overrides: { triggerType: 'latch' } }];
		const cloned = cloneMappings(mappings);
		cloned[0].clipId = 'mutated';
		cloned[0].velocity = 99;
		cloned[0].overrides.triggerType = 'one-shot';
		expect(mappings[0]).toEqual({ channel: 1, note: 60, velocity: 0, clipId: 'kick', overrides: { triggerType: 'latch' } });
	});

	test('deleteCells redistributes remaining clips on a note', () => {
		const mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' },
			{ channel: 1, note: 61, velocity: 0, clipId: 'other' }
		];
		const next = deleteCells(mappings, 1, [{ note: 60, velocity: 0, clipId: 'soft' }]);
		expect(noteEntries(next, 1, 60)).toEqual([{ clipId: 'hard', velocity: 0 }]);
		expect(noteEntries(next, 1, 61)).toEqual([{ clipId: 'other', velocity: 0 }]);
	});

	test('deleteCells multi-note batch leaves other notes and channels untouched', () => {
		const mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'a' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'b' },
			{ channel: 1, note: 61, velocity: 0, clipId: 'c' },
			{ channel: 1, note: 61, velocity: 64, clipId: 'd' },
			{ channel: 1, note: 62, velocity: 0, clipId: 'keep' },
			{ channel: 2, note: 60, velocity: 0, clipId: 'ch2' }
		];
		const next = deleteCells(mappings, 1, [
			{ note: 60, velocity: 0, clipId: 'a' },
			{ note: 61, velocity: 64, clipId: 'd' }
		]);
		expect(noteEntries(next, 1, 60)).toEqual([{ clipId: 'b', velocity: 0 }]);
		expect(noteEntries(next, 1, 61)).toEqual([{ clipId: 'c', velocity: 0 }]);
		expect(noteEntries(next, 1, 62)).toEqual([{ clipId: 'keep', velocity: 0 }]);
		expect(noteEntries(next, 2, 60)).toEqual([{ clipId: 'ch2', velocity: 0 }]);
	});

	test('assignCells replaces clip ids on selected cells', () => {
		const mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];
		const next = assignCells(mappings, 1, [{ note: 60, velocity: 64, clipId: 'hard' }], 'slam');
		expect(noteEntries(next, 1, 60).map(entry => entry.clipId)).toEqual(['soft', 'slam']);
	});

	test('assignCells multi-note batch leaves other notes and channels untouched', () => {
		const mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'a' },
			{ channel: 1, note: 61, velocity: 0, clipId: 'b' },
			{ channel: 1, note: 62, velocity: 0, clipId: 'keep' },
			{ channel: 2, note: 60, velocity: 0, clipId: 'ch2' }
		];
		const next = assignCells(
			mappings,
			1,
			[
				{ note: 60, velocity: 0, clipId: 'a' },
				{ note: 61, velocity: 0, clipId: 'b' }
			],
			'slam'
		);
		expect(noteEntries(next, 1, 60)).toEqual([{ clipId: 'slam', velocity: 0 }]);
		expect(noteEntries(next, 1, 61)).toEqual([{ clipId: 'slam', velocity: 0 }]);
		expect(noteEntries(next, 1, 62)).toEqual([{ clipId: 'keep', velocity: 0 }]);
		expect(noteEntries(next, 2, 60)).toEqual([{ clipId: 'ch2', velocity: 0 }]);
	});

	test('movePlacement moves a clip across notes', () => {
		const mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'kick' },
			{ channel: 1, note: 64, velocity: 0, clipId: 'hat' }
		];
		const next = movePlacement(mappings, 1, {
			sourceNote: 60,
			sourceVelocity: 0,
			sourceClipId: 'kick',
			targetNote: 64,
			targetVelocity: 100
		});
		expect(noteEntries(next, 1, 60)).toEqual([]);
		expect(noteEntries(next, 1, 64).map(entry => entry.clipId)).toEqual(['hat', 'kick']);
	});

	test('movePlacement same-note reorder updates order and velocities', () => {
		const mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];
		const next = movePlacement(mappings, 1, {
			sourceNote: 60,
			sourceVelocity: 0,
			sourceClipId: 'soft',
			targetNote: 60,
			targetVelocity: 100
		});
		expect(noteEntries(next, 1, 60)).toEqual([
			{ clipId: 'hard', velocity: 0 },
			{ clipId: 'soft', velocity: 64 }
		]);
	});

	test('movePlacement returns null when source is missing', () => {
		const mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'kick' }];
		expect(
			movePlacement(mappings, 1, {
				sourceNote: 60,
				sourceVelocity: 0,
				sourceClipId: 'missing',
				targetNote: 64,
				targetVelocity: 0
			})
		).toBeNull();
	});

	test('movePlacement returns null when insert would violate MIN_REGION_VELOCITY', () => {
		expect(MIN_REGION_VELOCITY).toBe(2);
		const targetMappings = Array.from({ length: 64 }, (_, i) => ({
			channel: 1,
			note: 64,
			velocity: i * 2,
			clipId: `clip-${i}`
		}));
		const mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'extra' }, ...targetMappings];
		expect(
			movePlacement(mappings, 1, {
				sourceNote: 60,
				sourceVelocity: 0,
				sourceClipId: 'extra',
				targetNote: 64,
				targetVelocity: 50
			})
		).toBeNull();
	});

	test('changedNotes lists notes whose entries differ', () => {
		const before = [{ channel: 1, note: 60, velocity: 0, clipId: 'a' }];
		const after = replaceNoteMappings(before, 1, 60, [{ clipId: 'b', velocity: 0 }]);
		expect(changedNotes(before, after, 1)).toEqual([60]);
	});

	test('changedNotes returns empty for identical mappings and filters by channel', () => {
		const before = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'a' },
			{ channel: 2, note: 60, velocity: 0, clipId: 'ch2-a' }
		];
		expect(changedNotes(before, before, 1)).toEqual([]);

		const after = replaceNoteMappings(before, 2, 60, [{ clipId: 'ch2-b', velocity: 0 }]);
		expect(changedNotes(before, after, 1)).toEqual([]);
		expect(changedNotes(before, after, 2)).toEqual([60]);
	});

	test('redistributeVelocities preserves overrides on object placements', () => {
		expect(
			redistributeVelocities([
				{ clipId: 'soft', overrides: { triggerType: 'latch' } },
				{ clipId: 'hard', overrides: { sync: 'beat', syncLength: '1 bar' } }
			])
		).toEqual([
			{ clipId: 'soft', velocity: 0, overrides: { triggerType: 'latch' } },
			{ clipId: 'hard', velocity: 64, overrides: { sync: 'beat', syncLength: '1 bar' } }
		]);
	});

	test('edit redistribute then nest keeps latch/sync overrides', () => {
		const nested = {
			1: {
				60: {
					0: { clipId: 'soft', triggerType: 'latch', triggerGroup: 'bg' },
					64: { clipId: 'hard', sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 },
					100: 'extra'
				}
			}
		};
		const flat = flattenKeyMap(nested);
		const afterDelete = deleteCells(flat, 1, [{ note: 60, velocity: 100, clipId: 'extra' }]);
		expect(nestMappingEntries(afterDelete)).toEqual({
			1: {
				60: {
					0: { clipId: 'soft', triggerType: 'latch', triggerGroup: 'bg' },
					64: { clipId: 'hard', sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 }
				}
			}
		});

		const afterMove = movePlacement(afterDelete, 1, {
			sourceNote: 60,
			sourceVelocity: 0,
			sourceClipId: 'soft',
			targetNote: 60,
			targetVelocity: 100
		});
		expect(nestMappingEntries(afterMove)).toEqual({
			1: {
				60: {
					0: { clipId: 'hard', sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 },
					64: { clipId: 'soft', triggerType: 'latch', triggerGroup: 'bg' }
				}
			}
		});

		const afterAssign = assignCells(afterDelete, 1, [{ note: 60, velocity: 64, clipId: 'hard' }], 'slam');
		expect(noteEntries(afterAssign, 1, 60)).toEqual([
			{ clipId: 'soft', velocity: 0, overrides: { triggerType: 'latch', triggerGroup: 'bg' } },
			{ clipId: 'slam', velocity: 64 }
		]);
		expect(nestMappingEntries(afterAssign)[1][60][0]).toEqual({
			clipId: 'soft',
			triggerType: 'latch',
			triggerGroup: 'bg'
		});
		expect(nestMappingEntries(afterAssign)[1][60][64]).toBe('slam');
	});
});
