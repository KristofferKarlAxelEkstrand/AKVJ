import fs from 'fs/promises';
import path from 'path';
import { describe, test, expect, afterEach } from 'vitest';
import { createAnimation } from '../scripts/animations/new.js';

const ANIM_ROOT = path.join(process.cwd(), 'animations');

async function cleanup(dir) {
	await fs.rm(dir, { recursive: true, force: true });
}

describe('scripts/animations/new.js', () => {
	afterEach(async () => {
		// Remove created animation path if it exists
		await cleanup(path.join(ANIM_ROOT, '99'));
	});

	test('creates new animation meta.json scaffold', async () => {
		const channel = '99';
		const note = '98';
		const velocity = '97';
		const dir = path.join(ANIM_ROOT, channel, note, velocity);
		// Ensure it's gone first
		await cleanup(path.join(ANIM_ROOT, channel));

		// Run the scaffolding function directly
		await createAnimation(channel, note, velocity);

		// Check meta.json exists and contains png property
		const metaPath = path.join(dir, 'meta.json');
		const content = await fs.readFile(metaPath, 'utf8');
		const meta = JSON.parse(content);
		expect(meta.png).toBe('sprite.png');
		expect(meta.numberOfFrames).toBe(1);
	});
});
