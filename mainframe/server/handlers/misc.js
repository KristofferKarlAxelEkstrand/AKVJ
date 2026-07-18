import { spawn } from 'child_process';
import { REPO_ROOT } from '../paths.js';
import { expandGifBuffer } from '../gifExpand.js';
import { readBody, sendJson } from '../httpUtils.js';

export function handleGetHealth(_req, res) {
	sendJson(res, 200, { ok: true });
}

/**
 * @returns {Promise<{ok: boolean, output: string, code: number}>}
 */
function runPipeline() {
	return new Promise(resolve => {
		const child = spawn(process.execPath, ['mainframe/scripts/clips/index.js'], {
			cwd: REPO_ROOT,
			env: process.env
		});
		let output = '';
		child.stdout.on('data', chunk => {
			output += chunk.toString();
		});
		child.stderr.on('data', chunk => {
			output += chunk.toString();
		});
		child.on('close', code => {
			resolve({ ok: code === 0, output, code });
		});
	});
}

export async function handlePostPipeline(_req, res) {
	const result = await runPipeline();
	sendJson(res, result.ok ? 200 : 500, result);
}

export async function handleExpandGif(req, res) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const image = body.image ?? body.gif ?? body.data;
	if (typeof image !== 'string' || !image) {
		sendJson(res, 400, { error: 'image (base64 data URL or raw base64) is required' });
		return;
	}
	const buffer = Buffer.from(String(image).replace(/^data:image\/\w+;base64,/, ''), 'base64');
	if (buffer.length === 0) {
		sendJson(res, 400, { error: 'Invalid image data' });
		return;
	}
	try {
		const result = await expandGifBuffer(buffer);
		sendJson(res, 200, {
			ok: true,
			animated: result.animated,
			pages: result.pages,
			durationsMs: result.durationsMs,
			frames: result.frames.map(frame => `data:image/png;base64,${frame.toString('base64')}`)
		});
	} catch (error) {
		sendJson(res, 400, { error: error.message });
	}
}
