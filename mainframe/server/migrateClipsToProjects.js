import fs from 'fs/promises';
import path from 'path';
import {
	resolveLegacyFlatClipsDir,
	resolveProjectsDir,
	resolveProjectsIndexPath,
	DEFAULT_PROJECT_ID,
	projectDir,
	projectClipsDir,
	projectRawAssetsRoot,
	projectKeyMapPath,
	isValidClipId,
	FLAT_CLIPS_MIGRATION_MARKER
} from './paths.js';

const LEGACY_DOC_NAMES = ['LICENSE-ASSETS.md', 'README.md'];

/**
 * @param {string} defaultDir
 * @returns {string}
 */
function migrationMarkerPath(defaultDir) {
	return path.join(defaultDir, FLAT_CLIPS_MIGRATION_MARKER);
}

/**
 * One-time migration: move flat `clips/{clipId}` into `projects/default/clips/`.
 * Completion is marked explicitly via `.flat-clips-migrated` so a retry after a
 * partial crash still finishes docs copy and stale key-map removal.
 * @returns {Promise<{ migrated: boolean, clipCount: number, rawMoved: boolean }>}
 */
export async function migrateFlatClipsToDefaultProject() {
	const legacyDir = resolveLegacyFlatClipsDir();
	const defaultDir = projectDir(DEFAULT_PROJECT_ID);
	const markerPath = migrationMarkerPath(defaultDir);

	try {
		await fs.access(markerPath);
		return { migrated: false, clipCount: 0, rawMoved: false };
	} catch {
		// Marker absent — migration not completed yet (or never started).
	}

	let legacyEntries;
	try {
		legacyEntries = await fs.readdir(legacyDir, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return { migrated: false, clipCount: 0, rawMoved: false };
		}
		throw error;
	}

	const clipFolders = legacyEntries.filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && isValidClipId(entry.name));
	const hasRaw = legacyEntries.some(entry => entry.isDirectory() && entry.name === '.raw-assets');
	const hasLegacyKeyMap = legacyEntries.some(entry => entry.isFile() && entry.name === 'key-map.json');
	const hasLegacyDocs = legacyEntries.some(entry => entry.isFile() && LEGACY_DOC_NAMES.includes(entry.name));

	if (clipFolders.length === 0 && !hasRaw && !hasLegacyKeyMap && !hasLegacyDocs) {
		return { migrated: false, clipCount: 0, rawMoved: false };
	}

	await fs.mkdir(resolveProjectsDir(), { recursive: true });
	try {
		await fs.access(resolveProjectsIndexPath());
	} catch {
		await fs.writeFile(resolveProjectsIndexPath(), `${JSON.stringify([{ id: DEFAULT_PROJECT_ID, name: 'Default' }], null, '\t')}\n`);
	}

	const defaultClips = projectClipsDir(DEFAULT_PROJECT_ID);
	const defaultRaw = projectRawAssetsRoot(DEFAULT_PROJECT_ID);
	await fs.mkdir(defaultClips, { recursive: true });
	await fs.mkdir(defaultRaw, { recursive: true });

	try {
		await fs.access(projectKeyMapPath(DEFAULT_PROJECT_ID));
	} catch {
		const legacyKeyMap = path.join(legacyDir, 'key-map.json');
		try {
			await fs.copyFile(legacyKeyMap, projectKeyMapPath(DEFAULT_PROJECT_ID));
		} catch {
			await fs.writeFile(projectKeyMapPath(DEFAULT_PROJECT_ID), `${JSON.stringify({}, null, '\t')}\n`);
		}
	}

	for (const entry of clipFolders) {
		const source = path.join(legacyDir, entry.name);
		const dest = path.join(defaultClips, entry.name);
		try {
			await fs.access(dest);
			await fs.rm(source, { recursive: true, force: true });
		} catch {
			await fs.rename(source, dest);
		}
	}

	let rawMoved = false;
	if (hasRaw) {
		const legacyRaw = path.join(legacyDir, '.raw-assets');
		const rawEntries = await fs.readdir(legacyRaw, { withFileTypes: true }).catch(() => []);
		for (const entry of rawEntries) {
			if (!entry.isDirectory()) {
				continue;
			}
			const source = path.join(legacyRaw, entry.name);
			const dest = path.join(defaultRaw, entry.name);
			try {
				await fs.access(dest);
				await fs.rm(source, { recursive: true, force: true });
			} catch {
				await fs.rename(source, dest);
			}
		}
		await fs.rm(legacyRaw, { recursive: true, force: true }).catch(() => {});
		rawMoved = true;
	}

	for (const docName of LEGACY_DOC_NAMES) {
		const source = path.join(legacyDir, docName);
		const dest = path.join(defaultDir, docName);
		try {
			await fs.access(source);
			try {
				await fs.access(dest);
			} catch {
				await fs.copyFile(source, dest);
			}
		} catch {
			// optional
		}
	}

	const legacyKeyMap = path.join(legacyDir, 'key-map.json');
	await fs.rm(legacyKeyMap, { force: true }).catch(() => {});

	await fs.writeFile(markerPath, '1\n');

	return { migrated: true, clipCount: clipFolders.length, rawMoved };
}

/**
 * Deep-copy directory tree (files + dirs).
 * @param {string} sourceDir
 * @param {string} destDir
 */
export async function copyDirectoryRecursive(sourceDir, destDir) {
	await fs.mkdir(destDir, { recursive: true });
	let entries;
	try {
		entries = await fs.readdir(sourceDir, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return;
		}
		throw error;
	}
	for (const entry of entries) {
		const source = path.join(sourceDir, entry.name);
		const dest = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			await copyDirectoryRecursive(source, dest);
		} else if (entry.isFile()) {
			await fs.copyFile(source, dest);
		}
	}
}
