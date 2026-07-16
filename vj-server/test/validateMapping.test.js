import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { validateSetMapping } from '../scripts/clips/lib/validateMapping.js';

describe('validateSetMapping', () => {
	let dir;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-mapping-'));
	});

	afterEach(async () => {
		await fs.rm(dir, { recursive: true, force: true });
	});

	test('fails when set-mapping.json is missing', async () => {
		const { errors } = await validateSetMapping(dir, [{ clipId: 'clip-a' }]);
		expect(errors).toHaveLength(1);
		expect(errors[0].errors[0]).toMatch(/Missing set-mapping/);
	});

	test('fails when clipId is unknown', async () => {
		await fs.writeFile(path.join(dir, 'set-mapping.json'), JSON.stringify([{ channel: 1, note: 0, velocity: 0, clipId: 'ghost' }]));
		const { errors } = await validateSetMapping(dir, [{ clipId: 'clip-a' }]);
		expect(errors.some(e => e.errors.some(msg => msg.includes('not found')))).toBe(true);
	});

	test('passes for valid mapping', async () => {
		await fs.writeFile(path.join(dir, 'set-mapping.json'), JSON.stringify([{ channel: 5, note: 0, velocity: 0, clipId: 'mask' }]));
		const { errors } = await validateSetMapping(dir, [{ clipId: 'mask' }]);
		expect(errors).toHaveLength(0);
	});

	test('fails on duplicate MIDI slots', async () => {
		await fs.writeFile(
			path.join(dir, 'set-mapping.json'),
			JSON.stringify([
				{ channel: 1, note: 0, velocity: 0, clipId: 'clip-a' },
				{ channel: 1, note: 0, velocity: 0, clipId: 'clip-b' }
			])
		);
		const { errors } = await validateSetMapping(dir, [{ clipId: 'clip-a' }, { clipId: 'clip-b' }]);
		expect(errors.some(e => e.errors.some(msg => msg.includes('Duplicate MIDI slot')))).toBe(true);
	});
});
