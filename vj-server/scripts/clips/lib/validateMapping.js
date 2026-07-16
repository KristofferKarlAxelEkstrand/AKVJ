import fs from 'fs/promises';
import path from 'path';

const CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/**
 * Validate set-mapping.json against the flat clip bucket.
 * @param {string} sourceDir - Clips root (contains set-mapping.json and clipId folders)
 * @param {Array<{clipId: string}>} validClips - Clips that passed folder validation
 * @returns {Promise<{errors: {clipId: string, errors: string[]}[]}>}
 */
export async function validateSetMapping(sourceDir, validClips) {
	const validIds = new Set(validClips.map(clip => clip.clipId));
	const mapping = await loadMapping(sourceDir);
	if (mapping.errors) {
		return { errors: mapping.errors };
	}

	const errors = [];
	const seenSlots = new Set();
	mapping.entries.forEach((entry, index) => {
		validateMappingEntry(entry, index, validIds, seenSlots, errors);
	});

	return { errors };
}

async function loadMapping(sourceDir) {
	const mappingPath = path.join(sourceDir, 'set-mapping.json');
	let raw;
	try {
		raw = await fs.readFile(mappingPath, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') {
			return { errors: [{ path: 'set-mapping.json', errors: ['Missing set-mapping.json (required for runtime ClipLoader)'] }] };
		}
		throw error;
	}
	let mapping;
	try {
		mapping = JSON.parse(raw);
	} catch (error) {
		return { errors: [{ path: 'set-mapping.json', errors: [`Invalid JSON: ${error.message}`] }] };
	}
	if (!Array.isArray(mapping)) {
		return { errors: [{ path: 'set-mapping.json', errors: ['Must be a JSON array of mapping entries'] }] };
	}
	return { entries: mapping };
}

function validateMappingEntry(entry, index, validIds, seenSlots, errors) {
	const entryPath = `set-mapping.json[${index}]`;
	const entryErrors = [];

	if (!entry || typeof entry !== 'object') {
		entryErrors.push('Entry must be an object');
		errors.push({ path: entryPath, errors: entryErrors });
		return;
	}

	const { channel, note, velocity, clipId } = entry;
	validateMappingFields(channel, note, velocity, clipId, validIds, entryErrors);
	checkDuplicateSlot(channel, note, velocity, seenSlots, entryErrors);

	if (entryErrors.length > 0) {
		errors.push({ path: entryPath, errors: entryErrors });
	}
}

function validateMappingFields(channel, note, velocity, clipId, validIds, entryErrors) {
	if (!Number.isInteger(channel) || channel < 1 || channel > 16) {
		entryErrors.push(`channel must be an integer 1–16, got ${JSON.stringify(channel)}`);
	}
	if (!Number.isInteger(note) || note < 0 || note > 127) {
		entryErrors.push(`note must be an integer 0–127, got ${JSON.stringify(note)}`);
	}
	if (!Number.isInteger(velocity) || velocity < 0 || velocity > 127) {
		entryErrors.push(`velocity must be an integer 0–127, got ${JSON.stringify(velocity)}`);
	}
	if (typeof clipId !== 'string' || !CLIP_ID_PATTERN.test(clipId) || /^\d+$/.test(clipId)) {
		entryErrors.push(`clipId must be a non-numeric clip folder id, got ${JSON.stringify(clipId)}`);
	} else if (!validIds.has(clipId)) {
		entryErrors.push(`clipId "${clipId}" not found in clip bucket`);
	}
}

function checkDuplicateSlot(channel, note, velocity, seenSlots, entryErrors) {
	if (Number.isInteger(channel) && Number.isInteger(note) && Number.isInteger(velocity)) {
		const slotKey = `${channel}/${note}/${velocity}`;
		if (seenSlots.has(slotKey)) {
			entryErrors.push(`Duplicate MIDI slot ${slotKey}`);
		}
		seenSlots.add(slotKey);
	}
}
