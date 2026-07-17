import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { validateKeyMap } from '../scripts/clips/lib/validateMapping.js';

describe('validateKeyMap', () => {
	let dir;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-keymap-'));
	});

	afterEach(async () => {
		await fs.rm(dir, { recursive: true, force: true });
	});

	test('fails when key-map.json is missing', async () => {
		const { errors } = await validateKeyMap(dir, [{ clipId: 'clip-a' }]);
		expect(errors).toHaveLength(1);
		expect(errors[0].errors[0]).toMatch(/Missing key-map/);
	});

	test('fails when clipId is unknown', async () => {
		await fs.writeFile(path.join(dir, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: 'ghost' } } }));
		const { errors } = await validateKeyMap(dir, [{ clipId: 'clip-a' }]);
		expect(errors.some(e => e.errors.some(msg => msg.includes('not found')))).toBe(true);
	});

	test('passes for valid layout', async () => {
		await fs.writeFile(path.join(dir, 'key-map.json'), JSON.stringify({ 5: { 0: { 0: 'mask' } } }));
		const { errors } = await validateKeyMap(dir, [{ clipId: 'mask' }]);
		expect(errors).toHaveLength(0);
	});

	test('fails on duplicate MIDI slots', async () => {
		await fs.writeFile(
			path.join(dir, 'key-map.json'),
			JSON.stringify({
				1: {
					0: {
						0: 'clip-a'
					}
				},
				2: {
					0: {
						0: 'clip-b'
					}
				}
			})
		);
		const { errors } = await validateKeyMap(dir, [{ clipId: 'clip-a' }, { clipId: 'clip-b' }]);
		expect(errors).toHaveLength(0);
	});

	test('fails when channel is out of range', async () => {
		await fs.writeFile(path.join(dir, 'key-map.json'), JSON.stringify({ 99: { 0: { 0: 'clip-a' } } }));
		const { errors } = await validateKeyMap(dir, [{ clipId: 'clip-a' }]);
		expect(errors.some(e => e.errors.some(msg => msg.includes('channel must be an integer 1–16')))).toBe(true);
	});

	test('fails when note is out of range', async () => {
		await fs.writeFile(path.join(dir, 'key-map.json'), JSON.stringify({ 1: { 200: { 0: 'clip-a' } } }));
		const { errors } = await validateKeyMap(dir, [{ clipId: 'clip-a' }]);
		expect(errors.some(e => e.errors.some(msg => msg.includes('note must be an integer 0–127')))).toBe(true);
	});

	test('fails when velocity is out of range', async () => {
		await fs.writeFile(path.join(dir, 'key-map.json'), JSON.stringify({ 1: { 0: { 200: 'clip-a' } } }));
		const { errors } = await validateKeyMap(dir, [{ clipId: 'clip-a' }]);
		expect(errors.some(e => e.errors.some(msg => msg.includes('velocity must be an integer 0–127')))).toBe(true);
	});

	test('fails when layout is not an object', async () => {
		await fs.writeFile(path.join(dir, 'key-map.json'), JSON.stringify([1, 2, 3]));
		const { errors } = await validateKeyMap(dir, [{ clipId: 'clip-a' }]);
		expect(errors.some(e => e.errors.some(msg => msg.includes('Must be a JSON object')))).toBe(true);
	});
});
