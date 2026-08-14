import fs from 'fs/promises';
import path from 'path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { run } from '../scripts/clips/index.js';
import { writeClip } from './utils/clipFixtures.js';
import { isValidProjectId } from '../server/paths.js';

const FIXTURE_BASE = path.join(process.cwd(), 'test', 'fixtures', 'pipeline-fixture');

async function setupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
	await fs.mkdir(FIXTURE_BASE, { recursive: true });
	await writeClip(FIXTURE_BASE, 'fixture-clip');
	await fs.writeFile(path.join(FIXTURE_BASE, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: 'fixture-clip' } } }, null, '\t'));
}

async function cleanupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
}

describe('scripts/clips/index.js pipeline', () => {
	beforeEach(async () => {
		await setupFixture();
	});
	afterEach(async () => {
		await cleanupFixture();
	});

	test('validate-only returns without throwing', async () => {
		await expect(run({ validateOnly: true, sourceDir: FIXTURE_BASE })).resolves.toBeUndefined();
	});

	test('validate-only fails on invalid clips', async () => {
		await fs.writeFile(path.join(FIXTURE_BASE, 'fixture-clip', 'meta.json'), '{ invalid json');
		await expect(run({ validateOnly: true, sourceDir: FIXTURE_BASE })).rejects.toThrow();
	});

	test('rejects invalid project IDs using shared validation function', async () => {
		// Verify that the shared validation function rejects all-numeric IDs
		expect(isValidProjectId('123')).toBe(false);
		expect(isValidProjectId('default')).toBe(true);

		// Verify that pipeline rejects all-numeric project IDs
		const projectsDir = path.join(process.cwd(), 'test', 'fixtures', 'test-projects');
		await fs.mkdir(projectsDir, { recursive: true });

		// Create a project with an invalid all-numeric ID
		const invalidProjectDir = path.join(projectsDir, '123');
		await fs.mkdir(invalidProjectDir, { recursive: true });
		await fs.mkdir(path.join(invalidProjectDir, 'clips'), { recursive: true });

		// Pipeline should reject the invalid project ID
		await expect(run({ projectsDir, projectId: '123' })).rejects.toThrow('Invalid project id: 123');

		// Cleanup
		await fs.rm(projectsDir, { recursive: true, force: true });
	});
});
