import path from 'path';
import { fileURLToPath } from 'url';
import { CLIP_ID_PATTERN, SAFE_PNG_NAME, isValidClipId } from '../shared/clipId.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** mainframe/server → mainframe → repo root */
export const REPO_ROOT = path.resolve(__dirname, '../..');

function resolveProjectsDir() {
	return process.env.AKVJ_PROJECTS_DIR || path.join(REPO_ROOT, 'projects');
}

function resolveActiveProjectPath() {
	return process.env.AKVJ_ACTIVE_PROJECT_PATH || path.join(REPO_ROOT, 'active-project.json');
}

function resolveProjectsIndexPath() {
	return path.join(resolveProjectsDir(), 'index.json');
}

/** @deprecated Prefer resolveProjectsDir() — snapshot at import time. */
export const PROJECTS_DIR = process.env.AKVJ_PROJECTS_DIR || path.join(REPO_ROOT, 'projects');
/** @deprecated Prefer resolveProjectsIndexPath() */
export const PROJECTS_INDEX_PATH = path.join(PROJECTS_DIR, 'index.json');
/** @deprecated Prefer resolveActiveProjectPath() */
export const ACTIVE_PROJECT_PATH = process.env.AKVJ_ACTIVE_PROJECT_PATH || path.join(REPO_ROOT, 'active-project.json');
export const DEFAULT_PROJECT_ID = 'default';

export { resolveProjectsDir, resolveActiveProjectPath, resolveProjectsIndexPath, isValidClipId, CLIP_ID_PATTERN, SAFE_PNG_NAME };

/**
 * Former flat clip pool — used only for one-time migration.
 * Override with AKVJ_LEGACY_CLIPS_DIR in tests.
 * @returns {string}
 */
export function resolveLegacyFlatClipsDir() {
	return process.env.AKVJ_LEGACY_CLIPS_DIR || path.join(REPO_ROOT, 'clips');
}

/** @deprecated Prefer resolveLegacyFlatClipsDir() — snapshot at import time. */
export const LEGACY_FLAT_CLIPS_DIR = path.join(REPO_ROOT, 'clips');

/** Marker written under `projects/default/` when flat-clips migration fully completes. */
export const FLAT_CLIPS_MIGRATION_MARKER = '.flat-clips-migrated';

/**
 * Test override: when set, all project clip roots resolve to this directory
 * (single-project temp dirs in unit tests).
 */
function clipsDirOverride() {
	return process.env.AKVJ_CLIPS_DIR || null;
}

const PROJECT_ID_PATTERN = CLIP_ID_PATTERN;

/**
 * @param {string} projectId
 * @returns {boolean}
 */
export function isValidProjectId(projectId) {
	return typeof projectId === 'string' && PROJECT_ID_PATTERN.test(projectId) && !/^\d+$/.test(projectId);
}

/**
 * Slugify a display name into a path-safe id fragment.
 * @param {string} name
 * @returns {string}
 */
function slugifyId(name) {
	return String(name)
		.toLowerCase()
		.trim()
		.replace(/_/g, '-')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/[\s]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Derive a path-safe project id from a display name.
 * @param {string} name
 * @returns {string}
 */
export function deriveProjectId(name) {
	return slugifyId(name);
}

/**
 * @param {string} projectId
 * @returns {string}
 */
export function projectDir(projectId) {
	if (!isValidProjectId(projectId)) {
		throw new Error(`Invalid project id: ${projectId}`);
	}
	return path.join(resolveProjectsDir(), projectId);
}

/**
 * Clips root for a project: `projects/{id}/clips` (or AKVJ_CLIPS_DIR override).
 * @param {string} [projectId=default]
 * @returns {string}
 */
export function projectClipsDir(projectId = DEFAULT_PROJECT_ID) {
	const override = clipsDirOverride();
	if (override) {
		return override;
	}
	return path.join(projectDir(projectId), 'clips');
}

/**
 * Raw-assets root for a project: `projects/{id}/.raw-assets`.
 * @param {string} [projectId=default]
 * @returns {string}
 */
export function projectRawAssetsRoot(projectId = DEFAULT_PROJECT_ID) {
	const override = clipsDirOverride();
	if (override) {
		return path.join(override, '.raw-assets');
	}
	return path.join(projectDir(projectId), '.raw-assets');
}

/**
 * @param {string} projectId
 * @returns {string}
 */
export function projectKeyMapPath(projectId) {
	return path.join(projectDir(projectId), 'key-map.json');
}

/**
 * @param {string} clipId
 * @param {string} [projectId=default]
 * @returns {string}
 */
export function clipDir(clipId, projectId = DEFAULT_PROJECT_ID) {
	if (!isValidClipId(clipId)) {
		throw new Error(`Invalid clipId: ${clipId}`);
	}
	return path.join(projectClipsDir(projectId), clipId);
}

/**
 * @param {string} clipId
 * @param {string} [projectId=default]
 * @returns {string}
 */
export function rawAssetsDir(clipId, projectId = DEFAULT_PROJECT_ID) {
	if (!isValidClipId(clipId)) {
		throw new Error(`Invalid clipId: ${clipId}`);
	}
	return path.join(projectRawAssetsRoot(projectId), clipId);
}

/**
 * Resolve a sprite path under the clip dir; reject path traversal via meta.png.
 * @param {string} clipId
 * @param {string} pngName
 * @param {string} [projectId=default]
 * @returns {string}
 */
export function resolveSafeSpritePath(clipId, pngName, projectId = DEFAULT_PROJECT_ID) {
	const baseName = path.basename(String(pngName));
	if (!SAFE_PNG_NAME.test(baseName)) {
		throw new Error('Invalid sprite filename');
	}
	const clipRoot = path.resolve(clipDir(clipId, projectId));
	const spritePath = path.resolve(clipRoot, baseName);
	if (!spritePath.startsWith(clipRoot + path.sep) && spritePath !== clipRoot) {
		throw new Error('Sprite path escapes clip directory');
	}
	return spritePath;
}

/** @deprecated Use projectClipsDir(activeProjectId) — kept as alias to default project for callers mid-migration. */
export const CLIPS_DIR = projectClipsDir(DEFAULT_PROJECT_ID);
/** @deprecated Use projectKeyMapPath(activeProjectId) */
export const KEY_MAP_PATH = projectKeyMapPath(DEFAULT_PROJECT_ID);
/** @deprecated Use projectRawAssetsRoot(activeProjectId) */
export const RAW_ASSETS_DIR = projectRawAssetsRoot(DEFAULT_PROJECT_ID);
