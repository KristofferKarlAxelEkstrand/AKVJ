import fs from 'fs/promises';
import path from 'path';
import { resolveProjectsDir, resolveActiveProjectPath, resolveProjectsIndexPath, isValidProjectId, projectDir, projectKeyMapPath, projectClipsDir, projectRawAssetsRoot, deriveProjectId, DEFAULT_PROJECT_ID } from './paths.js';
import { copyDirectoryRecursive } from './migrateClipsToProjects.js';

/**
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function listProjects() {
	const index = await readProjectsIndex();
	return index;
}

/**
 * @param {string} projectId
 * @returns {Promise<{id: string, name: string, settings?: object}>}
 */
export async function getProject(projectId) {
	assertValidProjectId(projectId);
	const index = await readProjectsIndex();
	const entry = index.find(project => project.id === projectId);
	if (!entry) {
		throw Object.assign(new Error(`Project "${projectId}" not found`), { statusCode: 404 });
	}
	const settings = await readProjectSettings(projectId);
	return settings ? { ...entry, settings } : { ...entry };
}

/**
 * @param {{name: string, id?: string, copyFrom?: string}} options
 * @returns {Promise<{id: string, name: string}>}
 */
export async function createProject({ name, id, copyFrom }) {
	const trimmedName = typeof name === 'string' ? name.trim() : '';
	if (!trimmedName) {
		throw Object.assign(new Error('name is required'), { statusCode: 400 });
	}

	const projectId = typeof id === 'string' && id.trim() ? id.trim() : deriveProjectId(trimmedName);
	if (!isValidProjectId(projectId)) {
		throw Object.assign(new Error('Invalid project id'), { statusCode: 400 });
	}

	const index = await readProjectsIndex();
	if (index.some(project => project.id === projectId)) {
		throw Object.assign(new Error(`Project "${projectId}" already exists`), { statusCode: 409 });
	}

	const dir = projectDir(projectId);
	await fs.mkdir(dir, { recursive: true });

	let sourceKeyMap = {};
	if (copyFrom !== null && copyFrom !== false) {
		const sourceId = typeof copyFrom === 'string' && copyFrom.trim() ? copyFrom.trim() : DEFAULT_PROJECT_ID;
		assertValidProjectId(sourceId);
		sourceKeyMap = await readProjectKeyMapFile(sourceId).catch(error => {
			if (sourceId === DEFAULT_PROJECT_ID && error.statusCode === 404) {
				return {};
			}
			throw error;
		});
	}
	await fs.writeFile(projectKeyMapPath(projectId), `${JSON.stringify(sourceKeyMap, null, '\t')}\n`);

	if (copyFrom !== null && copyFrom !== false) {
		const seedSourceId = typeof copyFrom === 'string' && copyFrom.trim() ? copyFrom.trim() : DEFAULT_PROJECT_ID;
		assertValidProjectId(seedSourceId);
		const sourceClips = projectClipsDir(seedSourceId);
		const destClips = projectClipsDir(projectId);
		const sourceRaw = projectRawAssetsRoot(seedSourceId);
		const destRaw = projectRawAssetsRoot(projectId);
		// AKVJ_CLIPS_DIR override collapses all projects to one dir — skip self-copy.
		if (path.resolve(sourceClips) !== path.resolve(destClips)) {
			await copyDirectoryRecursive(sourceClips, destClips);
		} else {
			await fs.mkdir(destClips, { recursive: true });
		}
		if (path.resolve(sourceRaw) !== path.resolve(destRaw)) {
			await copyDirectoryRecursive(sourceRaw, destRaw);
		} else {
			await fs.mkdir(destRaw, { recursive: true });
		}
	} else {
		await fs.mkdir(projectClipsDir(projectId), { recursive: true });
		await fs.mkdir(projectRawAssetsRoot(projectId), { recursive: true });
	}

	const entry = { id: projectId, name: trimmedName };
	index.push(entry);
	index.sort((a, b) => a.id.localeCompare(b.id));
	await writeProjectsIndex(index);
	return entry;
}

/**
 * @param {string} projectId
 * @param {{name?: string, settings?: object}} updates
 * @returns {Promise<{id: string, name: string, settings?: object}>}
 */
export async function updateProject(projectId, updates) {
	assertValidProjectId(projectId);
	const index = await readProjectsIndex();
	const entry = index.find(project => project.id === projectId);
	if (!entry) {
		throw Object.assign(new Error(`Project "${projectId}" not found`), { statusCode: 404 });
	}

	if (typeof updates?.name === 'string') {
		const trimmedName = updates.name.trim();
		if (!trimmedName) {
			throw Object.assign(new Error('name cannot be empty'), { statusCode: 400 });
		}
		entry.name = trimmedName;
		await writeProjectsIndex(index);
	}

	if (updates?.settings !== undefined) {
		if (!updates.settings || typeof updates.settings !== 'object' || Array.isArray(updates.settings)) {
			throw Object.assign(new Error('settings must be a JSON object'), { statusCode: 400 });
		}
		await writeProjectSettings(projectId, updates.settings);
	}

	return getProject(projectId);
}

/**
 * @param {string} projectId
 * @returns {Promise<{ok: true, id: string}>}
 */
export async function deleteProject(projectId) {
	assertValidProjectId(projectId);
	if (projectId === DEFAULT_PROJECT_ID) {
		throw Object.assign(new Error('Cannot delete the default project'), { statusCode: 400 });
	}

	const index = await readProjectsIndex();
	const next = index.filter(project => project.id !== projectId);
	if (next.length === index.length) {
		throw Object.assign(new Error(`Project "${projectId}" not found`), { statusCode: 404 });
	}

	const active = await getActiveProjectId();
	if (active === projectId) {
		await setActiveProjectId(DEFAULT_PROJECT_ID);
	}

	await writeProjectsIndex(next);
	await fs.rm(projectDir(projectId), { recursive: true, force: true });
	return { ok: true, id: projectId };
}

/**
 * @returns {Promise<string>}
 */
export async function getActiveProjectId() {
	try {
		const raw = JSON.parse(await fs.readFile(resolveActiveProjectPath(), 'utf8'));
		if (raw && typeof raw.project === 'string' && isValidProjectId(raw.project)) {
			return raw.project;
		}
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
	return DEFAULT_PROJECT_ID;
}

/**
 * @param {string} projectId
 * @returns {Promise<{project: string}>}
 */
export async function setActiveProjectId(projectId) {
	assertValidProjectId(projectId);
	const index = await readProjectsIndex();
	if (!index.some(project => project.id === projectId)) {
		throw Object.assign(new Error(`Project "${projectId}" not found`), { statusCode: 404 });
	}
	await fs.mkdir(path.dirname(resolveActiveProjectPath()), { recursive: true });
	await fs.writeFile(resolveActiveProjectPath(), `${JSON.stringify({ project: projectId }, null, '\t')}\n`);
	return { project: projectId };
}

/**
 * @param {string} projectId
 * @returns {Promise<object>}
 */
export async function readProjectKeyMapFile(projectId) {
	assertValidProjectId(projectId);
	const keyMapPath = projectKeyMapPath(projectId);
	try {
		const keyMap = JSON.parse(await fs.readFile(keyMapPath, 'utf8'));
		if (!keyMap || typeof keyMap !== 'object' || Array.isArray(keyMap)) {
			return {};
		}
		return keyMap;
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw Object.assign(new Error(`Project "${projectId}" not found`), { statusCode: 404 });
		}
		throw error;
	}
}

/**
 * @param {string} projectId
 * @param {object} keyMap - nested key-map object
 */
export async function writeProjectKeyMapFile(projectId, keyMap) {
	assertValidProjectId(projectId);
	const dir = projectDir(projectId);
	try {
		await fs.access(dir);
	} catch {
		throw Object.assign(new Error(`Project "${projectId}" not found`), { statusCode: 404 });
	}
	await fs.writeFile(projectKeyMapPath(projectId), `${JSON.stringify(keyMap, null, '\t')}\n`);
}

/**
 * @param {string} projectId
 */
function assertValidProjectId(projectId) {
	if (!isValidProjectId(projectId)) {
		throw Object.assign(new Error('Invalid project id'), { statusCode: 400 });
	}
}

/**
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function readProjectsIndex() {
	await fs.mkdir(resolveProjectsDir(), { recursive: true });
	try {
		const raw = JSON.parse(await fs.readFile(resolveProjectsIndexPath(), 'utf8'));
		if (!Array.isArray(raw)) {
			return [];
		}
		return raw
			.filter(entry => entry && typeof entry.id === 'string' && isValidProjectId(entry.id))
			.map(entry => ({
				id: entry.id,
				name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : entry.id
			}));
	} catch (error) {
		if (error.code === 'ENOENT') {
			const seed = [{ id: DEFAULT_PROJECT_ID, name: 'Default' }];
			await writeProjectsIndex(seed);
			await fs.mkdir(projectDir(DEFAULT_PROJECT_ID), { recursive: true });
			try {
				await fs.access(projectKeyMapPath(DEFAULT_PROJECT_ID));
			} catch {
				await fs.writeFile(projectKeyMapPath(DEFAULT_PROJECT_ID), `${JSON.stringify({}, null, '\t')}\n`);
			}
			return seed;
		}
		throw error;
	}
}

/**
 * @param {Array<{id: string, name: string}>} index
 */
async function writeProjectsIndex(index) {
	await fs.mkdir(resolveProjectsDir(), { recursive: true });
	await fs.writeFile(resolveProjectsIndexPath(), `${JSON.stringify(index, null, '\t')}\n`);
}

/**
 * @param {string} projectId
 * @returns {Promise<object|null>}
 */
async function readProjectSettings(projectId) {
	try {
		const settings = JSON.parse(await fs.readFile(path.join(projectDir(projectId), 'settings.json'), 'utf8'));
		if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
			return null;
		}
		return settings;
	} catch (error) {
		if (error.code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

/**
 * @param {string} projectId
 * @param {object} settings
 */
async function writeProjectSettings(projectId, settings) {
	await fs.mkdir(projectDir(projectId), { recursive: true });
	await fs.writeFile(path.join(projectDir(projectId), 'settings.json'), `${JSON.stringify(settings, null, '\t')}\n`);
}

export { DEFAULT_PROJECT_ID } from './paths.js';
