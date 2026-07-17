import fs from 'fs/promises';
import path from 'path';

const CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/**
 * Validate key-map.json against the flat clip bucket.
 * @param {string} sourceDir - Clips root (contains key-map.json and clipId folders)
 * @param {Array<{clipId: string}>} validClips - Clips that passed folder validation
 * @returns {Promise<{errors: {clipId: string, errors: string[]}[]}>}
 */
export async function validateKeyMap(sourceDir, validClips) {
	const validIds = new Set(validClips.map(clip => clip.clipId));
	const keyMap = await loadKeyMap(sourceDir);
	if (keyMap.errors) {
		return { errors: keyMap.errors };
	}

	const errors = [];
	const seenSlots = new Set();
	for (const [channel, notes] of Object.entries(keyMap.data)) {
		validateChannel(channel, notes, validIds, seenSlots, errors);
	}

	return { errors };
}

async function loadKeyMap(sourceDir) {
	const layoutPath = path.join(sourceDir, 'key-map.json');
	let raw;
	try {
		raw = await fs.readFile(layoutPath, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') {
			return { errors: [{ path: 'key-map.json', errors: ['Missing key-map.json (required for runtime ClipLoader)'] }] };
		}
		throw error;
	}
	let keyMap;
	try {
		keyMap = JSON.parse(raw);
	} catch (error) {
		return { errors: [{ path: 'key-map.json', errors: [`Invalid JSON: ${error.message}`] }] };
	}
	if (!keyMap || typeof keyMap !== 'object' || Array.isArray(keyMap)) {
		return { errors: [{ path: 'key-map.json', errors: ['Must be a JSON object keyed by channel number'] }] };
	}
	return { data: keyMap };
}

function validateChannel(channel, notes, validIds, seenSlots, errors) {
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
		validateNote(channelNum, note, velocities, validIds, seenSlots, errors);
	}
}

function validateNote(channelNum, note, velocities, validIds, seenSlots, errors) {
	const noteNum = Number(note);
	if (!Number.isInteger(noteNum) || noteNum < 0 || noteNum > 127) {
		errors.push({ path: `key-map.json[${channelNum}][${note}]`, errors: [`note must be an integer 0–127, got ${JSON.stringify(note)}`] });
		return;
	}
	if (!velocities || typeof velocities !== 'object' || Array.isArray(velocities)) {
		errors.push({ path: `key-map.json[${channelNum}][${note}]`, errors: ['note value must be an object keyed by velocity'] });
		return;
	}
	for (const [velocity, clipId] of Object.entries(velocities)) {
		validateVelocityEntry(channelNum, noteNum, velocity, clipId, validIds, seenSlots, errors);
	}
}

function validateVelocityEntry(channelNum, noteNum, velocity, clipId, validIds, seenSlots, errors) {
	const entryPath = `key-map.json[${channelNum}][${noteNum}][${velocity}]`;
	const entryErrors = [];

	const velocityNum = Number(velocity);
	if (!Number.isInteger(velocityNum) || velocityNum < 0 || velocityNum > 127) {
		entryErrors.push(`velocity must be an integer 0–127, got ${JSON.stringify(velocity)}`);
	}
	if (typeof clipId !== 'string' || !CLIP_ID_PATTERN.test(clipId) || /^\d+$/.test(clipId)) {
		entryErrors.push(`clipId must be a non-numeric clip folder id, got ${JSON.stringify(clipId)}`);
	} else if (!validIds.has(clipId)) {
		entryErrors.push(`clipId "${clipId}" not found in clip bucket`);
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
