/**
 * Pure helpers for piano-roll edit mode (undo snapshots, batch cells, moves).
 */

import { redistributeVelocities, insertionIndexForDropVelocity, MIN_REGION_VELOCITY } from './PianoKey.js';

const VELOCITY_RANGE = 128;

/**
 * @param {{clipId: string, overrides?: Record<string, unknown>}} entry
 * @returns {{clipId: string, overrides?: Record<string, unknown>}}
 */
function clipPlacement(entry) {
	const placement = { clipId: entry.clipId };
	if (entry.overrides) {
		placement.overrides = { ...entry.overrides };
	}
	return placement;
}

/**
 * @param {number} note
 * @param {number} velocity
 * @param {string} clipId
 * @returns {string}
 */
export function cellKey(note, velocity, clipId) {
	return `${note}:${velocity}:${clipId}`;
}

/**
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} mappings
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>}
 */
export function cloneMappings(mappings) {
	return mappings.map(entry => {
		const cloned = { ...entry };
		if (entry.overrides) {
			cloned.overrides = { ...entry.overrides };
		}
		return cloned;
	});
}

/**
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} mappings
 * @param {number} channel
 * @param {number} note
 * @returns {Array<{clipId: string, velocity: number, overrides?: Record<string, unknown>}>}
 */
export function noteEntries(mappings, channel, note) {
	return mappings
		.filter(entry => entry.channel === channel && entry.note === note)
		.sort((a, b) => a.velocity - b.velocity)
		.map(entry => {
			const mapped = { clipId: entry.clipId, velocity: entry.velocity };
			if (entry.overrides) {
				mapped.overrides = { ...entry.overrides };
			}
			return mapped;
		});
}

/**
 * @param {Array<{clipId: string, velocity: number}>} entries
 * @returns {Array<{clipId: string, velocity: number, start: number, end: number}>}
 */
function entriesToBands(entries) {
	return entries.map((entry, index, arr) => ({
		clipId: entry.clipId,
		velocity: entry.velocity,
		start: entry.velocity,
		end: index + 1 < arr.length ? arr[index + 1].velocity : VELOCITY_RANGE
	}));
}

/**
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} mappings
 * @param {number} channel
 * @param {number} note
 * @param {Array<{clipId: string, velocity: number, overrides?: Record<string, unknown>}>} nextEntries
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>}
 */
export function replaceNoteMappings(mappings, channel, note, nextEntries) {
	const others = mappings.filter(entry => !(entry.channel === channel && entry.note === note));
	return others.concat(
		nextEntries.map(entry => {
			const mapped = {
				channel,
				note,
				clipId: entry.clipId,
				velocity: entry.velocity
			};
			if (entry.overrides) {
				mapped.overrides = { ...entry.overrides };
			}
			return mapped;
		})
	);
}

/**
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} before
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} after
 * @param {number} channel
 * @returns {number[]}
 */
export function changedNotes(before, after, channel) {
	const notes = new Set();
	for (const entry of before) {
		if (entry.channel === channel) {
			notes.add(entry.note);
		}
	}
	for (const entry of after) {
		if (entry.channel === channel) {
			notes.add(entry.note);
		}
	}
	const changed = [];
	for (const note of notes) {
		const left = JSON.stringify(noteEntries(before, channel, note));
		const right = JSON.stringify(noteEntries(after, channel, note));
		if (left !== right) {
			changed.push(note);
		}
	}
	return changed.sort((a, b) => a - b);
}

/**
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} mappings
 * @param {number} channel
 * @param {Array<{note: number, velocity: number, clipId: string}>} cells
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>}
 */
export function deleteCells(mappings, channel, cells) {
	let next = cloneMappings(mappings);
	const byNote = new Map();
	for (const cell of cells) {
		if (!byNote.has(cell.note)) {
			byNote.set(cell.note, []);
		}
		byNote.get(cell.note).push(cell);
	}
	for (const [note, noteCells] of byNote) {
		const removeKeys = new Set(noteCells.map(cell => `${cell.velocity}:${cell.clipId}`));
		const remaining = noteEntries(next, channel, note)
			.filter(entry => !removeKeys.has(`${entry.velocity}:${entry.clipId}`))
			.map(clipPlacement);
		next = replaceNoteMappings(next, channel, note, redistributeVelocities(remaining));
	}
	return next;
}

/**
 * Replace clipId on each selected cell (velocities redistributed per note).
 * Reassigned cells drop placement overrides; untouched cells keep theirs.
 *
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} mappings
 * @param {number} channel
 * @param {Array<{note: number, velocity: number, clipId: string}>} cells
 * @param {string} clipId
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>}
 */
export function assignCells(mappings, channel, cells, clipId) {
	let next = cloneMappings(mappings);
	const byNote = new Map();
	for (const cell of cells) {
		if (!byNote.has(cell.note)) {
			byNote.set(cell.note, []);
		}
		byNote.get(cell.note).push(cell);
	}
	for (const [note, noteCells] of byNote) {
		const replaceKeys = new Set(noteCells.map(cell => `${cell.velocity}:${cell.clipId}`));
		const placements = noteEntries(next, channel, note).map(entry =>
			replaceKeys.has(`${entry.velocity}:${entry.clipId}`) ? { clipId } : clipPlacement(entry)
		);
		next = replaceNoteMappings(next, channel, note, redistributeVelocities(placements));
	}
	return next;
}

/**
 * Move a placement from one note/velocity slot to another (possibly same note).
 *
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} mappings
 * @param {number} channel
 * @param {{sourceNote: number, sourceVelocity: number, sourceClipId: string, targetNote: number, targetVelocity: number}} move
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>|null} null if rejected
 */
export function movePlacement(mappings, channel, move) {
	const { sourceNote, sourceVelocity, sourceClipId, targetNote, targetVelocity } = move;
	const sourceEntries = noteEntries(mappings, channel, sourceNote);
	const sourceIndex = sourceEntries.findIndex(entry => entry.velocity === sourceVelocity && entry.clipId === sourceClipId);
	if (sourceIndex < 0) {
		return null;
	}

	const moved = clipPlacement(sourceEntries[sourceIndex]);
	const remainingSource = sourceEntries.filter((_, index) => index !== sourceIndex).map(clipPlacement);

	if (sourceNote === targetNote) {
		const remainingBands = entriesToBands(sourceEntries.filter((_, index) => index !== sourceIndex));
		const insertAt = insertionIndexForDropVelocity(targetVelocity, remainingBands);
		const nextPlacements = [...remainingSource];
		nextPlacements.splice(insertAt, 0, moved);
		if (VELOCITY_RANGE / nextPlacements.length < MIN_REGION_VELOCITY) {
			return null;
		}
		return replaceNoteMappings(mappings, channel, sourceNote, redistributeVelocities(nextPlacements));
	}

	const targetEntries = noteEntries(mappings, channel, targetNote);
	const targetBands = entriesToBands(targetEntries);
	const insertAt = insertionIndexForDropVelocity(targetVelocity, targetBands);
	const targetPlacements = targetEntries.map(clipPlacement);
	targetPlacements.splice(insertAt, 0, moved);
	if (VELOCITY_RANGE / targetPlacements.length < MIN_REGION_VELOCITY) {
		return null;
	}

	let next = replaceNoteMappings(mappings, channel, sourceNote, redistributeVelocities(remainingSource));
	next = replaceNoteMappings(next, channel, targetNote, redistributeVelocities(targetPlacements));
	return next;
}
