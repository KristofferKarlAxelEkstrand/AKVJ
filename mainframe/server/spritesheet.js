import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { clipDir, isValidClipId } from './paths.js';

/**
 * Build a horizontal/grid spritesheet from PNG frame buffers and write clip folder.
 * @param {Object} options
 * @param {string} options.clipId
 * @param {Buffer[]} options.frameBuffers
 * @param {string} [options.role]
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function createClipFromFrames({ clipId, frameBuffers, role }) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}
	if (!Array.isArray(frameBuffers) || frameBuffers.length === 0) {
		throw new Error('At least one frame PNG is required');
	}

	const { width, height } = await validateFrameDimensions(frameBuffers);
	const composites = buildComposites(frameBuffers, width, height);
	const sheet = await renderSpriteSheet(sharp, composites, width, height, frameBuffers.length);
	await writeClipFiles(clipId, role, sheet, frameBuffers.length, Math.min(frameBuffers.length, 16));
	return { clipId, frames: frameBuffers.length, framesPerRow: Math.min(frameBuffers.length, 16) };
}

async function validateFrameDimensions(frameBuffers) {
	const metas = await Promise.all(frameBuffers.map(buf => sharp(buf).metadata()));
	const width = metas[0].width;
	const height = metas[0].height;
	if (!width || !height) {
		throw new Error('Could not read frame dimensions');
	}
	for (const meta of metas) {
		if (meta.width !== width || meta.height !== height) {
			throw new Error('All frames must share the same dimensions');
		}
	}
	return { width, height };
}

function buildComposites(frameBuffers, width, height) {
	const framesPerRow = Math.min(frameBuffers.length, 16);
	const composites = [];
	for (let i = 0; i < frameBuffers.length; i++) {
		const col = i % framesPerRow;
		const row = Math.floor(i / framesPerRow);
		composites.push({ input: frameBuffers[i], left: col * width, top: row * height });
	}
	return composites;
}

async function renderSpriteSheet(sharp, composites, width, height, frameCount) {
	const framesPerRow = Math.min(frameCount, 16);
	const rows = Math.ceil(frameCount / framesPerRow);
	return sharp({
		create: {
			width: width * framesPerRow,
			height: height * rows,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}
	})
		.composite(composites)
		.png()
		.toBuffer();
}

async function writeClipFiles(clipId, role, sheet, frames, framesPerRow) {
	const dir = clipDir(clipId);
	try {
		await fs.access(dir);
		throw new Error(`Clip "${clipId}" already exists`);
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), sheet);

	const meta = buildClipMeta(role, frames, framesPerRow);
	await fs.writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(meta, null, '\t')}\n`);
}

function buildClipMeta(role, frames, framesPerRow) {
	const meta = {
		png: 'sprite.png',
		frames,
		framesPerRow,
		playback: 'loop',
		retrigger: true,
		frameRatesForFrames: { 0: 12 }
	};
	if (role === 'bitmask') {
		meta.role = 'bitmask';
		meta.bitDepth = 1;
	}
	return meta;
}
