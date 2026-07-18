import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pipeline } from '../scripts/clips/Pipeline.js';
import { PNG_1x1 } from './utils/pngFixtures.js';
import { writeClip } from './utils/clipFixtures.js';

describe('Pipeline full build', () => {
	let root;
	let sourceDir;
	let cacheDir;
	let publicDir;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-pipeline-build-'));
		sourceDir = path.join(root, 'clips');
		cacheDir = path.join(root, 'cache');
		publicDir = path.join(root, 'public');
		await fs.mkdir(sourceDir, { recursive: true });
		await writeClip(sourceDir, 'build-clip');
		await fs.writeFile(path.join(sourceDir, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: 'build-clip' } } }, null, '\t'));
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		if (root) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	function createPipeline(overrides = {}) {
		return new Pipeline({
			sourceDir,
			cacheDir,
			publicDir,
			...overrides
		});
	}

	test('full build produces clips.json and copies sprites to public', async () => {
		const pipeline = createPipeline();
		await pipeline.run({});
		await expect(fs.access(path.join(cacheDir, 'clips.json'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(publicDir, 'clips.json'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(publicDir, 'build-clip', 'sprite.png'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(publicDir, 'key-map.json'))).resolves.toBeUndefined();
		const clipsJson = JSON.parse(await fs.readFile(path.join(publicDir, 'clips.json'), 'utf8'));
		expect(clipsJson['build-clip']).toBeDefined();
	});

	test('noOptimize skips sharp optimization and still copies PNGs', async () => {
		const pipeline = createPipeline();
		await pipeline.run({ noOptimize: true });
		await expect(fs.access(path.join(publicDir, 'build-clip', 'sprite.png'))).resolves.toBeUndefined();
		const cached = await fs.readFile(path.join(cacheDir, 'build-clip', 'sprite.png'));
		expect(cached.equals(PNG_1x1)).toBe(true);
	});

	test('clean removes cache directory', async () => {
		const pipeline = createPipeline();
		await pipeline.run({});
		await expect(fs.access(cacheDir)).resolves.toBeUndefined();
		await pipeline.clean();
		await expect(fs.access(cacheDir)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('build fails when meta.json references a missing sprite PNG', async () => {
		await fs.rm(path.join(sourceDir, 'build-clip', 'sprite.png'));
		const pipeline = createPipeline();
		await expect(pipeline.run({})).rejects.toThrow(/Validation failed/);
	});

	test('per-project build only builds the requested project', async () => {
		const projectsDir = path.join(root, 'projects');
		const cacheRoot = path.join(root, '.cache/projects');
		const publicRoot = path.join(root, 'public-root');
		const activeProjectPath = path.join(root, 'active-project.json');

		for (const projectId of ['default', 'other']) {
			const clips = path.join(projectsDir, projectId, 'clips');
			await fs.mkdir(clips, { recursive: true });
			await writeClip(clips, `${projectId}-clip`);
			await fs.writeFile(path.join(projectsDir, projectId, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: `${projectId}-clip` } } }, null, '\t'));
		}
		await fs.writeFile(path.join(projectsDir, 'index.json'), JSON.stringify([{ id: 'default', name: 'Default' }, { id: 'other', name: 'Other' }]));
		await fs.writeFile(activeProjectPath, JSON.stringify({ project: 'default' }));

		const pipeline = new Pipeline({ projectsDir, cacheRoot, publicRoot, activeProjectPath });
		await pipeline.run({ project: 'default' });

		await expect(fs.access(path.join(publicRoot, 'projects', 'default', 'clips', 'clips.json'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(publicRoot, 'projects', 'other', 'clips', 'clips.json'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('multi-project build iterates all projects', async () => {
		const projectsDir = path.join(root, 'projects');
		const cacheRoot = path.join(root, '.cache/projects');
		const publicRoot = path.join(root, 'public-root');
		const activeProjectPath = path.join(root, 'active-project.json');

		for (const projectId of ['alpha', 'beta']) {
			const clips = path.join(projectsDir, projectId, 'clips');
			await fs.mkdir(clips, { recursive: true });
			await writeClip(clips, `${projectId}-clip`);
			await fs.writeFile(path.join(projectsDir, projectId, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: `${projectId}-clip` } } }, null, '\t'));
		}
		await fs.writeFile(path.join(projectsDir, 'index.json'), JSON.stringify([{ id: 'alpha', name: 'A' }, { id: 'beta', name: 'B' }]));
		await fs.writeFile(activeProjectPath, JSON.stringify({ project: 'alpha' }));

		const pipeline = new Pipeline({ projectsDir, cacheRoot, publicRoot, activeProjectPath });
		await pipeline.run({});

		await expect(fs.access(path.join(publicRoot, 'projects', 'alpha', 'clips', 'clips.json'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(publicRoot, 'projects', 'beta', 'clips', 'clips.json'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(publicRoot, 'projects', 'index.json'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(publicRoot, 'active-project.json'))).resolves.toBeUndefined();
	});
});

describe('Pipeline sharp-unavailable fallback', () => {
	test('build succeeds when optimize reports sharp unavailable (copy fallback)', async () => {
		vi.resetModules();
		vi.doMock('../scripts/clips/lib/optimize.js', async () => {
			const fsPromises = await import('fs/promises');
			const pathMod = await import('path');
			return {
				optimize: async (clips, cacheDir) => {
					const results = [];
					for (const clip of clips) {
						if (!clip.pngPath) {
							continue;
						}
						const destDir = pathMod.join(cacheDir, clip.clipId);
						await fsPromises.mkdir(destDir, { recursive: true });
						const pngName = pathMod.basename(clip.pngPath);
						await fsPromises.copyFile(clip.pngPath, pathMod.join(destDir, pngName));
						await fsPromises.copyFile(pathMod.join(clip.dir, 'meta.json'), pathMod.join(destDir, 'meta.json'));
						results.push({ path: clip.pngPath, skipped: false, optimized: true });
					}
					return { results, sharp: false, bitDepthCounts: {} };
				}
			};
		});

		const root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-pipeline-sharp-'));
		try {
			const sourceDir = path.join(root, 'clips');
			const cacheDir = path.join(root, 'cache');
			const publicDir = path.join(root, 'public');
			await fs.mkdir(sourceDir, { recursive: true });
			await writeClip(sourceDir, 'sharp-free');
			await fs.writeFile(path.join(sourceDir, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: 'sharp-free' } } }, null, '\t'));

			const { Pipeline: PipelineFresh } = await import('../scripts/clips/Pipeline.js');
			const pipeline = new PipelineFresh({ sourceDir, cacheDir, publicDir });
			await pipeline.run({});
			await expect(fs.access(path.join(publicDir, 'sharp-free', 'sprite.png'))).resolves.toBeUndefined();
		} finally {
			vi.doUnmock('../scripts/clips/lib/optimize.js');
			vi.resetModules();
			await fs.rm(root, { recursive: true, force: true });
		}
	});
});
