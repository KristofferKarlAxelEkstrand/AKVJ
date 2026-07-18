import { isValidProjectId } from '../paths.js';
import {
	listProjects,
	getProject,
	createProject,
	updateProject,
	deleteProject,
	getActiveProjectId,
	setActiveProjectId,
	readProjectKeyMapFile,
	writeProjectKeyMapFile
} from '../projects.js';
import { readBody, sendJson } from '../httpUtils.js';
import { listClips } from '../clipCatalog.js';
import { flattenKeyMap, nestMappingEntries, assertValidFlatMapping } from '../mappingService.js';

export async function handleGetProjects(_req, res) {
	sendJson(res, 200, { projects: await listProjects() });
}

export async function handlePostProjects(req, res) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	try {
		const project = await createProject({
			name: body.name,
			id: body.id,
			copyFrom: body.copyFrom
		});
		sendJson(res, 201, { ok: true, project });
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}

export async function handleGetActiveProject(_req, res) {
	sendJson(res, 200, { project: await getActiveProjectId() });
}

export async function handleGetProject(_req, res, projectId) {
	try {
		const project = await getProject(projectId);
		sendJson(res, 200, { project });
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}

export async function handlePutProject(req, res, projectId) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	try {
		const project = await updateProject(projectId, {
			name: body.name,
			settings: body.settings
		});
		sendJson(res, 200, { ok: true, project });
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}

export async function handleDeleteProject(_req, res, projectId) {
	try {
		const result = await deleteProject(projectId);
		sendJson(res, 200, result);
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}

export async function handleActivateProject(_req, res, projectId) {
	try {
		const result = await setActiveProjectId(projectId);
		sendJson(res, 200, { ok: true, ...result });
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}

export async function handleGetProjectKeyMap(_req, res, projectId) {
	try {
		const keyMap = await readProjectKeyMapFile(projectId);
		sendJson(res, 200, { mapping: flattenKeyMap(keyMap) });
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}

export async function handlePutProjectKeyMap(req, res, projectId) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	try {
		if (!isValidProjectId(projectId)) {
			sendJson(res, 400, { error: 'Invalid project id' });
			return;
		}
		const mapping = body.mapping ?? body;
		const readyClips = new Set((await listClips(projectId)).filter(clip => clip.pipelineReady).map(clip => clip.clipId));
		assertValidFlatMapping(mapping, readyClips);
		const keyMap = nestMappingEntries(mapping);
		await writeProjectKeyMapFile(projectId, keyMap);
		sendJson(res, 200, { ok: true, mapping: flattenKeyMap(keyMap) });
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}
