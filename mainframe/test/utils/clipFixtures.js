import fs from 'fs/promises';
import path from 'path';
import { PNG_1x1 } from './pngFixtures.js';

const DEFAULT_META = { png: 'sprite.png', frames: 1, framesPerRow: 1 };

/**
 * Write a minimal clip folder under `dir` for pipeline/validate/migrate tests.
 * @param {string} dir - Parent clips directory
 * @param {string} clipId
 * @param {{ meta?: object, hasPng?: boolean, pngBuffer?: Buffer }} [options]
 */
export async function writeClip(dir, clipId, { meta = DEFAULT_META, hasPng = true, pngBuffer = PNG_1x1 } = {}) {
	const clipDir = path.join(dir, clipId);
	await fs.mkdir(clipDir, { recursive: true });
	await fs.writeFile(path.join(clipDir, 'meta.json'), JSON.stringify(meta));
	if (hasPng) {
		await fs.writeFile(path.join(clipDir, 'sprite.png'), pngBuffer);
	}
}
