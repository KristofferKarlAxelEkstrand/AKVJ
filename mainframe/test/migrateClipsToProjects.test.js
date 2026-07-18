import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { migrateFlatClipsToDefaultProject } from '../server/migrateClipsToProjects.js';
import { FLAT_CLIPS_MIGRATION_MARKER } from '../server/paths.js';

const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

let legacyDir;
let projectsDir;
let previousLegacy;
let previousProjects;

async function writeClip(clipId, root = legacyDir) {
	const dir = path.join(root, clipId);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), PNG_1x1);
	await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1 }));
}

async function pathExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

beforeEach(async () => {
	previousLegacy = process.env.AKVJ_LEGACY_CLIPS_DIR;
	previousProjects = process.env.AKVJ_PROJECTS_DIR;
	delete process.env.AKVJ_CLIPS_DIR;

	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-migrate-'));
	legacyDir = path.join(root, 'clips');
	projectsDir = path.join(root, 'projects');
	await fs.mkdir(legacyDir, { recursive: true });
	await fs.mkdir(projectsDir, { recursive: true });

	process.env.AKVJ_LEGACY_CLIPS_DIR = legacyDir;
	process.env.AKVJ_PROJECTS_DIR = projectsDir;
});

afterEach(async () => {
	if (previousLegacy === undefined) {
		delete process.env.AKVJ_LEGACY_CLIPS_DIR;
	} else {
		process.env.AKVJ_LEGACY_CLIPS_DIR = previousLegacy;
	}
	if (previousProjects === undefined) {
		delete process.env.AKVJ_PROJECTS_DIR;
	} else {
		process.env.AKVJ_PROJECTS_DIR = previousProjects;
	}

	const root = path.dirname(legacyDir);
	await fs.rm(root, { recursive: true, force: true });
});

describe('migrateFlatClipsToDefaultProject', () => {
	test('missing legacy dir is a no-op', async () => {
		await fs.rm(legacyDir, { recursive: true, force: true });

		const result = await migrateFlatClipsToDefaultProject();

		expect(result).toEqual({ migrated: false, clipCount: 0, rawMoved: false });
		expect(await pathExists(path.join(projectsDir, 'default'))).toBe(false);
	});

	test('empty legacy dir is a no-op', async () => {
		const result = await migrateFlatClipsToDefaultProject();

		expect(result).toEqual({ migrated: false, clipCount: 0, rawMoved: false });
		expect(await pathExists(path.join(projectsDir, 'default', FLAT_CLIPS_MIGRATION_MARKER))).toBe(false);
	});

	test('full legacy pool migrates clips, key-map, docs, and raw assets', async () => {
		await writeClip('clip-a');
		await writeClip('clip-b');
		await fs.mkdir(path.join(legacyDir, '.raw-assets', 'clip-a'), { recursive: true });
		await fs.writeFile(path.join(legacyDir, '.raw-assets', 'clip-a', 'source.png'), PNG_1x1);
		await fs.writeFile(path.join(legacyDir, 'key-map.json'), `${JSON.stringify({ 1: { 0: { 0: 'clip-a' } } }, null, '\t')}\n`);
		await fs.writeFile(path.join(legacyDir, 'README.md'), '# clips\n');
		await fs.writeFile(path.join(legacyDir, 'LICENSE-ASSETS.md'), 'license\n');

		const result = await migrateFlatClipsToDefaultProject();

		expect(result).toEqual({ migrated: true, clipCount: 2, rawMoved: true });

		const defaultDir = path.join(projectsDir, 'default');
		expect(await pathExists(path.join(defaultDir, 'clips', 'clip-a', 'meta.json'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, 'clips', 'clip-b', 'meta.json'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, '.raw-assets', 'clip-a', 'source.png'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, 'key-map.json'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, 'README.md'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, 'LICENSE-ASSETS.md'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, FLAT_CLIPS_MIGRATION_MARKER))).toBe(true);
		expect(await pathExists(path.join(legacyDir, 'key-map.json'))).toBe(false);
		expect(await pathExists(path.join(legacyDir, 'clip-a'))).toBe(false);
		expect(await pathExists(path.join(legacyDir, '.raw-assets'))).toBe(false);

		const second = await migrateFlatClipsToDefaultProject();
		expect(second).toEqual({ migrated: false, clipCount: 0, rawMoved: false });
	});

	test('raw-assets-only legacy dir migrates raw and cleans up key-map/docs', async () => {
		await fs.mkdir(path.join(legacyDir, '.raw-assets', 'raw-clip'), { recursive: true });
		await fs.writeFile(path.join(legacyDir, '.raw-assets', 'raw-clip', 'frame.png'), PNG_1x1);
		await fs.writeFile(path.join(legacyDir, 'key-map.json'), '{}\n');
		await fs.writeFile(path.join(legacyDir, 'README.md'), 'readme\n');
		await fs.writeFile(path.join(legacyDir, 'LICENSE-ASSETS.md'), 'license\n');

		const result = await migrateFlatClipsToDefaultProject();

		expect(result).toEqual({ migrated: true, clipCount: 0, rawMoved: true });
		expect(await pathExists(path.join(projectsDir, 'default', '.raw-assets', 'raw-clip', 'frame.png'))).toBe(true);
		expect(await pathExists(path.join(projectsDir, 'default', 'key-map.json'))).toBe(true);
		expect(await pathExists(path.join(projectsDir, 'default', 'README.md'))).toBe(true);
		expect(await pathExists(path.join(projectsDir, 'default', 'LICENSE-ASSETS.md'))).toBe(true);
		expect(await pathExists(path.join(projectsDir, 'default', FLAT_CLIPS_MIGRATION_MARKER))).toBe(true);
		expect(await pathExists(path.join(legacyDir, 'key-map.json'))).toBe(false);
	});

	test('retry after partial run finishes docs and removes stale key-map', async () => {
		const defaultDir = path.join(projectsDir, 'default');
		const defaultClips = path.join(defaultDir, 'clips');
		await fs.mkdir(defaultClips, { recursive: true });
		await fs.mkdir(path.join(defaultDir, '.raw-assets'), { recursive: true });
		await writeClip('already-moved', defaultClips);
		await fs.writeFile(path.join(defaultDir, 'key-map.json'), '{}\n');

		// Simulate crash after clips moved: legacy left with key-map + docs only
		await fs.writeFile(path.join(legacyDir, 'key-map.json'), `${JSON.stringify({ 1: { 0: { 0: 'already-moved' } } }, null, '\t')}\n`);
		await fs.writeFile(path.join(legacyDir, 'README.md'), '# leftover\n');
		await fs.writeFile(path.join(legacyDir, 'LICENSE-ASSETS.md'), 'license leftover\n');

		const result = await migrateFlatClipsToDefaultProject();

		expect(result).toEqual({ migrated: true, clipCount: 0, rawMoved: false });
		expect(await pathExists(path.join(defaultDir, 'README.md'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, 'LICENSE-ASSETS.md'))).toBe(true);
		expect(await pathExists(path.join(defaultDir, FLAT_CLIPS_MIGRATION_MARKER))).toBe(true);
		expect(await pathExists(path.join(legacyDir, 'key-map.json'))).toBe(false);
		expect(await fs.readFile(path.join(defaultDir, 'README.md'), 'utf8')).toBe('# leftover\n');

		const second = await migrateFlatClipsToDefaultProject();
		expect(second).toEqual({ migrated: false, clipCount: 0, rawMoved: false });
	});

	test('destination receives key-map.json, README.md, and LICENSE-ASSETS.md', async () => {
		await writeClip('solo-clip');
		await fs.writeFile(path.join(legacyDir, 'key-map.json'), `${JSON.stringify({ 2: { 1: { 64: 'solo-clip' } } }, null, '\t')}\n`);
		await fs.writeFile(path.join(legacyDir, 'README.md'), 'readme body\n');
		await fs.writeFile(path.join(legacyDir, 'LICENSE-ASSETS.md'), 'license body\n');

		await migrateFlatClipsToDefaultProject();

		const defaultDir = path.join(projectsDir, 'default');
		const keyMap = JSON.parse(await fs.readFile(path.join(defaultDir, 'key-map.json'), 'utf8'));
		expect(keyMap).toEqual({ 2: { 1: { 64: 'solo-clip' } } });
		expect(await fs.readFile(path.join(defaultDir, 'README.md'), 'utf8')).toBe('readme body\n');
		expect(await fs.readFile(path.join(defaultDir, 'LICENSE-ASSETS.md'), 'utf8')).toBe('license body\n');
	});
});
