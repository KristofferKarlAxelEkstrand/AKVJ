import fs from 'fs/promises';
import path from 'path';
import { isValidClipId, SAFE_PNG_NAME } from '../shared/clipId.js';
import { clipDir, projectClipsDir } from './paths.js';
import { getActiveProjectId } from './projects.js';

/**
 * @returns {Promise<string>}
 */
export async function activeProjectId() {
	return getActiveProjectId();
}

/**
 * @param {string} [projectId]
 * @returns {Promise<string>}
 */
export async function clipsRootFor(projectId) {
	const id = projectId ?? (await activeProjectId());
	return projectClipsDir(id);
}

/**
 * Whether a clip folder has enough metadata + sprite to pass the pipeline.
 * @param {object} meta
 * @param {boolean} hasSprite
 * @returns {boolean}
 */
export function isPipelineReadyClip(meta, hasSprite) {
	if (!hasSprite || !meta) {
		return false;
	}
	const pngName = meta.png ? path.basename(meta.png) : '';
	if (meta.png && !SAFE_PNG_NAME.test(pngName)) {
		return false;
	}
	const frameCount = meta.frames ?? meta.numberOfFrames;
	return Number.isInteger(frameCount) && frameCount >= 1 && Number.isInteger(meta.framesPerRow) && meta.framesPerRow >= 1;
}

/**
 * @param {string} [projectId]
 * @returns {Promise<import('fs').Dirent[]>}
 */
async function readClipDirectories(projectId) {
	const clipsRoot = await clipsRootFor(projectId);
	try {
		return await fs.readdir(clipsRoot, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}
}

/**
 * @param {string} [projectId]
 * @returns {Promise<Array<{clipId: string, meta: object, hasSprite: boolean, pipelineReady: boolean}>>}
 */
export async function listClips(projectId) {
	const id = projectId ?? (await activeProjectId());
	const entries = await readClipDirectories(id);
	const clipEntries = entries.filter(entry => entry.isDirectory() && isValidClipId(entry.name));
	const clips = await Promise.all(clipEntries.map(entry => buildClipEntry(entry.name, id)));
	clips.sort((a, b) => a.clipId.localeCompare(b.clipId));
	return clips;
}

/**
 * @param {string} clipId
 * @param {string} projectId
 */
async function buildClipEntry(clipId, projectId) {
	const dir = clipDir(clipId, projectId);
	const meta = await readClipMeta(dir);
	const hasSprite = await checkSpriteExists(dir, meta);
	return {
		clipId,
		meta,
		hasSprite,
		pipelineReady: isPipelineReadyClip(meta, hasSprite)
	};
}

async function readClipMeta(dir) {
	try {
		return JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
	} catch {
		return {};
	}
}

async function checkSpriteExists(dir, meta) {
	const pngCandidate = typeof meta.png === 'string' ? path.basename(meta.png) : 'sprite.png';
	if (!SAFE_PNG_NAME.test(pngCandidate)) {
		return false;
	}
	try {
		await fs.access(path.join(dir, pngCandidate));
		return true;
	} catch {
		return false;
	}
}

/**
 * @param {string} [projectId]
 * @returns {Promise<Set<string>>}
 */
export async function readyClipIdSet(projectId) {
	return new Set((await listClips(projectId)).filter(clip => clip.pipelineReady).map(clip => clip.clipId));
}
