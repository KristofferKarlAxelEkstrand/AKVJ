import { isValidClipId } from '../shared/clipId.js';
import { parseMappingLeaf, serializeMappingLeaf, collectMappingOverrideErrors, parseFlatMappingEntry } from '../shared/mappingLeaf.js';

/**
 * Convert nested {channel: {note: {velocity: clipId|object}}} to flat array.
 * Object leaves become `{ clipId, overrides }` so round-trips preserve sync/trigger overrides.
 * @param {Object} keyMap
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>}
 */
export function flattenKeyMap(keyMap) {
	const entries = [];
	if (!keyMap || typeof keyMap !== 'object' || Array.isArray(keyMap)) {
		return entries;
	}
	for (const [channel, notes] of Object.entries(keyMap)) {
		if (!notes || typeof notes !== 'object' || Array.isArray(notes)) {
			continue;
		}
		for (const [note, velocities] of Object.entries(notes)) {
			if (!velocities || typeof velocities !== 'object' || Array.isArray(velocities)) {
				continue;
			}
			for (const [velocity, leaf] of Object.entries(velocities)) {
				const parsed = parseMappingLeaf(leaf);
				const entry = {
					channel: Number(channel),
					note: Number(note),
					velocity: Number(velocity),
					clipId: parsed.ok ? parsed.clipId : ''
				};
				if (parsed.ok && parsed.overrides) {
					entry.overrides = parsed.overrides;
				}
				entries.push(entry);
			}
		}
	}
	return entries;
}

/**
 * Convert flat mapping array to nested {channel: {note: {velocity: clipId|object}}}.
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>} entries
 * @returns {Object}
 */
export function nestMappingEntries(entries) {
	const keyMap = {};
	for (const entry of entries) {
		const channelKey = String(entry.channel);
		const noteKey = String(entry.note);
		const velocityKey = String(entry.velocity);
		keyMap[channelKey] ??= {};
		keyMap[channelKey][noteKey] ??= {};
		keyMap[channelKey][noteKey][velocityKey] = serializeMappingLeaf(entry.clipId, entry.overrides);
	}
	return keyMap;
}

/**
 * Validate one flat mapping entry (throws on failure — API write paths).
 * @param {object} entry
 * @param {number} index
 * @param {Set<string>} readyClips
 * @param {Set<string>} seenSlots
 */
export function validateMappingEntry(entry, index, readyClips, seenSlots) {
	const parsed = parseFlatMappingEntry(entry);
	if (!parsed.ok) {
		throw new Error(`Mapping[${index}]: ${parsed.error}`);
	}
	if (
		!Number.isInteger(entry?.channel) ||
		entry.channel < 1 ||
		entry.channel > 16 ||
		!Number.isInteger(entry?.note) ||
		entry.note < 0 ||
		entry.note > 127 ||
		!Number.isInteger(entry?.velocity) ||
		entry.velocity < 0 ||
		entry.velocity > 127 ||
		!isValidClipId(parsed.clipId)
	) {
		throw new Error(`Mapping[${index}]: needs channel (1–16), note/velocity (0–127), and a valid clipId`);
	}
	const overrideErrors = collectMappingOverrideErrors(parsed.overrides);
	if (overrideErrors.length > 0) {
		throw new Error(`Mapping[${index}]: ${overrideErrors.join('; ')}`);
	}
	if (!readyClips.has(parsed.clipId)) {
		throw new Error(`Mapping[${index}]: clipId "${parsed.clipId}" is missing or incomplete (needs meta.json + sprite + frames/framesPerRow)`);
	}
	const slotKey = `${entry.channel}/${entry.note}/${entry.velocity}`;
	if (seenSlots.has(slotKey)) {
		throw new Error(`Mapping[${index}]: duplicate MIDI slot ${slotKey}`);
	}
	seenSlots.add(slotKey);
}

/**
 * Validate a flat mapping array against ready clip ids (throws).
 * @param {unknown} mapping
 * @param {Set<string>} readyClips
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string, overrides?: Record<string, unknown>}>}
 */
export function assertValidFlatMapping(mapping, readyClips) {
	if (!Array.isArray(mapping)) {
		throw new Error('mapping must be a JSON array');
	}
	const seenSlots = new Set();
	mapping.forEach((entry, index) => {
		validateMappingEntry(entry, index, readyClips, seenSlots);
	});
	return mapping;
}

/**
 * Collect pipeline-style validation errors for a nested key-map.
 * @param {Object} keyMap
 * @param {Set<string>} validIds - Clip ids present in the bucket (pipeline-valid)
 * @returns {{path: string, errors: string[]}[]}
 */
export function collectNestedKeyMapErrors(keyMap, validIds) {
	const errors = [];
	const seenSlots = new Set();
	for (const [channel, notes] of Object.entries(keyMap)) {
		validateNestedChannel(channel, notes, validIds, seenSlots, errors);
	}
	return errors;
}

function validateNestedChannel(channel, notes, validIds, seenSlots, errors) {
	const channelNum = Number(channel);
	if (!Number.isInteger(channelNum) || channelNum < 1 || channelNum > 16) {
		errors.push({ path: `key-map.json[${channel}]`, errors: [`channel must be an integer 1–16, got ${JSON.stringify(channel)}`] });
		return;
	}
	if (!notes || typeof notes !== 'object' || Array.isArray(notes)) {
		errors.push({ path: `key-map.json[${channel}]`, errors: ['channel value must be an object keyed by note'] });
		return;
	}
	for (const [note, velocities] of Object.entries(notes)) {
		validateNestedNote(channelNum, note, velocities, validIds, seenSlots, errors);
	}
}

function validateNestedNote(channelNum, note, velocities, validIds, seenSlots, errors) {
	const noteNum = Number(note);
	if (!Number.isInteger(noteNum) || noteNum < 0 || noteNum > 127) {
		errors.push({ path: `key-map.json[${channelNum}][${note}]`, errors: [`note must be an integer 0–127, got ${JSON.stringify(note)}`] });
		return;
	}
	if (!velocities || typeof velocities !== 'object' || Array.isArray(velocities)) {
		errors.push({ path: `key-map.json[${channelNum}][${note}]`, errors: ['note value must be an object keyed by velocity'] });
		return;
	}
	for (const [velocity, leaf] of Object.entries(velocities)) {
		validateNestedVelocityEntry(channelNum, noteNum, velocity, leaf, validIds, seenSlots, errors);
	}
}

function validateNestedVelocityEntry(channelNum, noteNum, velocity, leaf, validIds, seenSlots, errors) {
	const entryPath = `key-map.json[${channelNum}][${noteNum}][${velocity}]`;
	const entryErrors = [];

	const velocityNum = Number(velocity);
	if (!Number.isInteger(velocityNum) || velocityNum < 0 || velocityNum > 127) {
		entryErrors.push(`velocity must be an integer 0–127, got ${JSON.stringify(velocity)}`);
	}

	const parsed = parseMappingLeaf(leaf);
	if (!parsed.ok) {
		entryErrors.push(parsed.error);
	} else if (!isValidClipId(parsed.clipId)) {
		entryErrors.push(`clipId must be a non-numeric clip folder id, got ${JSON.stringify(parsed.clipId)}`);
	} else if (!validIds.has(parsed.clipId)) {
		entryErrors.push(`clipId "${parsed.clipId}" not found in clip bucket`);
	} else {
		entryErrors.push(...collectMappingOverrideErrors(parsed.overrides));
	}

	if (Number.isInteger(channelNum) && Number.isInteger(noteNum) && Number.isInteger(velocityNum)) {
		const slotKey = `${channelNum}/${noteNum}/${velocityNum}`;
		if (seenSlots.has(slotKey)) {
			entryErrors.push(`Duplicate MIDI slot ${slotKey}`);
		}
		seenSlots.add(slotKey);
	}

	if (entryErrors.length > 0) {
		errors.push({ path: entryPath, errors: entryErrors });
	}
}
