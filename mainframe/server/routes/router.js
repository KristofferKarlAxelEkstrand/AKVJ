import { sendJson } from '../httpUtils.js';
import { handleGetHealth, handlePostPipeline, handleExpandGif } from '../handlers/misc.js';
import {
	handleGetClips,
	handleGetMapping,
	handlePutMapping,
	handlePostClips,
	serveSprite,
	handleGetClipFrames,
	handlePutClipFrames,
	handleRecompileClip,
	handleDeleteClip,
	handlePutClipMeta
} from '../handlers/clips.js';
import {
	handleGetProjects,
	handlePostProjects,
	handleGetActiveProject,
	handleGetProject,
	handlePutProject,
	handleDeleteProject,
	handleActivateProject,
	handleGetProjectKeyMap,
	handlePutProjectKeyMap
} from '../handlers/projects.js';

const EXACT_ROUTES = {
	'GET /api/health': handleGetHealth,
	'GET /api/clips': handleGetClips,
	'GET /api/mapping': handleGetMapping,
	'PUT /api/mapping': handlePutMapping,
	'GET /api/projects': handleGetProjects,
	'POST /api/projects': handlePostProjects,
	'GET /api/projects/active': handleGetActiveProject,
	'POST /api/clips': handlePostClips,
	'POST /api/expand-gif': handleExpandGif,
	'POST /api/pipeline': handlePostPipeline
};

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {URL} url
 */
export async function routeRequest(req, res, url) {
	const routeKey = `${req.method} ${url.pathname}`;
	const handler = EXACT_ROUTES[routeKey];
	if (handler) {
		await handler(req, res);
		return;
	}
	if (await routeProjectRequest(req, res, url)) {
		return;
	}
	if (req.method === 'GET' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/sprite')) {
		await serveSprite(req, res, url);
		return;
	}
	if (req.method === 'GET' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/frames')) {
		await handleGetClipFrames(req, res, url);
		return;
	}
	if (req.method === 'DELETE' && url.pathname.startsWith('/api/clips/')) {
		await handleDeleteClip(req, res, url);
		return;
	}
	if (req.method === 'PUT' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/frames')) {
		await handlePutClipFrames(req, res, url);
		return;
	}
	if (req.method === 'PUT' && url.pathname.startsWith('/api/clips/') && !url.pathname.endsWith('/sprite')) {
		await handlePutClipMeta(req, res, url);
		return;
	}
	if (req.method === 'POST' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/recompile')) {
		await handleRecompileClip(req, res, url);
		return;
	}
	sendJson(res, 404, { error: 'Not found' });
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {URL} url
 * @returns {Promise<boolean>}
 */
async function routeProjectRequest(req, res, url) {
	const pathname = url.pathname;
	if (!pathname.startsWith('/api/projects/')) {
		return false;
	}

	const rest = pathname.slice('/api/projects/'.length);
	if (!rest) {
		return false;
	}

	if (rest.endsWith('/activate') && req.method === 'POST') {
		const projectId = decodeURIComponent(rest.slice(0, -'/activate'.length));
		await handleActivateProject(req, res, projectId);
		return true;
	}

	if (rest.endsWith('/key-map')) {
		const projectId = decodeURIComponent(rest.slice(0, -'/key-map'.length));
		if (req.method === 'GET') {
			await handleGetProjectKeyMap(req, res, projectId);
			return true;
		}
		if (req.method === 'PUT') {
			await handlePutProjectKeyMap(req, res, projectId);
			return true;
		}
		return false;
	}

	const projectId = decodeURIComponent(rest);
	if (projectId.includes('/')) {
		return false;
	}
	if (req.method === 'GET') {
		await handleGetProject(req, res, projectId);
		return true;
	}
	if (req.method === 'PUT') {
		await handlePutProject(req, res, projectId);
		return true;
	}
	if (req.method === 'DELETE') {
		await handleDeleteProject(req, res, projectId);
		return true;
	}
	return false;
}
