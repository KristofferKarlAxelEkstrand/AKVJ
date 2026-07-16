#!/usr/bin/env node
/**
 * One-shot migration: nested clips/{channel}/{note}/{velocity}/ → flat clips/{clipId}/
 * plus clips/midi-layout.json. Verifies before deleting nested trees.
 */
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { CLIPS_DIR, MIDI_LAYOUT_PATH, isValidClipId } from './paths.js';

const BITMASK_CHANNEL = 5;

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function fileHash(filePath) {
	const buf = await fs.readFile(filePath);
	return createHash('sha256').update(buf).digest('hex');
}

/**
 * Walk legacy channel/note/velocity tree.
 * @returns {Promise<Array<{channel: number, note: number, velocity: number, dir: string, clipId: string}>>}
 */
async function walkLegacy() {
	const results = [];
	let channels;
	try {
		channels = await fs.readdir(CLIPS_DIR, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}

	for (const channelEntry of channels) {
		if (!channelEntry.isDirectory() || !/^\d+$/.test(channelEntry.name)) {
			continue;
		}
		await walkChannelTree(channelEntry, results);
	}
	return results;
}

async function walkChannelTree(channelEntry, results) {
	const channel = Number(channelEntry.name);
	const channelDir = path.join(CLIPS_DIR, channelEntry.name);
	const notes = await fs.readdir(channelDir, { withFileTypes: true });
	for (const noteEntry of notes) {
		if (!noteEntry.isDirectory() || !/^\d+$/.test(noteEntry.name)) {
			continue;
		}
		await walkNoteTree(channel, channelDir, noteEntry, results);
	}
}

async function walkNoteTree(channel, channelDir, noteEntry, results) {
	const note = Number(noteEntry.name);
	const noteDir = path.join(channelDir, noteEntry.name);
	const velocities = await fs.readdir(noteDir, { withFileTypes: true });
	for (const velEntry of velocities) {
		if (!velEntry.isDirectory() || !/^\d+$/.test(velEntry.name)) {
			continue;
		}
		const velocity = Number(velEntry.name);
		const dir = path.join(noteDir, velEntry.name);
		const clipId = `c${channel}-n${note}-v${velocity}`;
		results.push({ channel, note, velocity, dir, clipId });
	}
}

async function main() {
	const legacy = await walkLegacy();
	if (legacy.length === 0) {
		console.log('No legacy nested clips found. Nothing to migrate.');
		return;
	}

	console.log(`Found ${legacy.length} legacy clip slots`);

	const { mapping, inventory } = await migrateLegacySlots(legacy);
	await fs.writeFile(MIDI_LAYOUT_PATH, `${JSON.stringify(mapping, null, '\t')}\n`);
	console.log(`Wrote ${MIDI_LAYOUT_PATH}`);

	await verifyMigration(inventory);
	await cleanupLegacyDirs(legacy);
	console.log('Migration complete.');
}

async function migrateLegacySlots(legacy) {
	const mapping = [];
	const inventory = [];
	for (const slot of legacy) {
		await migrateSlot(slot, mapping, inventory);
	}
	return { mapping, inventory };
}

async function migrateSlot(slot, mapping, inventory) {
	if (!isValidClipId(slot.clipId)) {
		throw new Error(`Generated invalid clipId for ${slot.dir}`);
	}
	const destDir = path.join(CLIPS_DIR, slot.clipId);
	await fs.mkdir(destDir, { recursive: true });
	await copySlotFiles(slot.dir, destDir);

	const meta = await readAndPatchMeta(destDir, slot);
	mapping.push({ channel: slot.channel, note: slot.note, velocity: slot.velocity, clipId: slot.clipId });
	inventory.push(await buildInventoryEntry(slot, destDir, meta));
}

async function copySlotFiles(srcDir, destDir) {
	const files = await fs.readdir(srcDir);
	for (const file of files) {
		await fs.copyFile(path.join(srcDir, file), path.join(destDir, file));
	}
}

async function buildInventoryEntry(slot, destDir, meta) {
	const pngName = meta.png || 'sprite.png';
	return {
		channel: slot.channel,
		note: slot.note,
		velocity: slot.velocity,
		clipId: slot.clipId,
		hash: await fileHash(path.join(destDir, pngName))
	};
}

async function readAndPatchMeta(destDir, slot) {
	const metaPath = path.join(destDir, 'meta.json');
	let meta;
	try {
		meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
	} catch {
		throw new Error(`Missing meta.json in ${slot.dir}`);
	}
	delete meta.src;
	if (slot.channel === BITMASK_CHANNEL) {
		meta.role = 'bitmask';
		if (meta.bitDepth === undefined) {
			meta.bitDepth = 1;
		}
	}
	await fs.writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`);
	return meta;
}

async function verifyMigration(inventory) {
	const mappingFile = JSON.parse(await fs.readFile(MIDI_LAYOUT_PATH, 'utf8'));
	const fromMapping = await buildVerificationInventory(mappingFile);
	const key = entry => `${entry.channel}/${entry.note}/${entry.velocity}:${entry.clipId}:${entry.hash}`;
	const legacyKeys = new Set(inventory.map(key));
	const mappedKeys = new Set(fromMapping.map(key));
	checkVerificationKeys(legacyKeys, mappedKeys);
	console.log('Verification gate passed (legacy MIDI slots ↔ bucket + mapping).');
}

async function buildVerificationInventory(mappingFile) {
	const fromMapping = [];
	for (const entry of mappingFile) {
		const meta = JSON.parse(await fs.readFile(path.join(CLIPS_DIR, entry.clipId, 'meta.json'), 'utf8'));
		const pngName = meta.png || 'sprite.png';
		fromMapping.push({
			channel: entry.channel,
			note: entry.note,
			velocity: entry.velocity,
			clipId: entry.clipId,
			hash: await fileHash(path.join(CLIPS_DIR, entry.clipId, pngName))
		});
	}
	return fromMapping;
}

function checkVerificationKeys(legacyKeys, mappedKeys) {
	for (const key of legacyKeys) {
		if (!mappedKeys.has(key)) {
			throw new Error(`Verification failed: missing mapped entry for ${key}`);
		}
	}
	for (const key of mappedKeys) {
		if (!legacyKeys.has(key)) {
			throw new Error(`Verification failed: unexpected mapped entry ${key}`);
		}
	}
}

async function cleanupLegacyDirs(legacy) {
	const channelDirs = new Set(legacy.map(slot => path.join(CLIPS_DIR, String(slot.channel))));
	for (const dir of channelDirs) {
		await fs.rm(dir, { recursive: true, force: true });
		console.log(`Removed nested tree ${dir}`);
	}
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
