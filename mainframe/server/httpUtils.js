/** Max JSON body for uploads / key-map writes (32 MiB). */
export const MAX_BODY_BYTES = 32 * 1024 * 1024;

const ALLOWED_ORIGINS = new Set(['http://localhost:9999', 'http://127.0.0.1:9999', 'http://localhost:8888', 'http://127.0.0.1:8888']);

/**
 * @param {import('http').IncomingMessage} req
 * @param {number} [maxBytes]
 * @param {import('http').ServerResponse} [res] When provided, a 413 is written before the socket is destroyed.
 * @returns {Promise<Buffer>}
 */
export function readBody(req, maxBytes = MAX_BODY_BYTES, res) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let totalBytes = 0;
		let settled = false;

		const failPayloadTooLarge = () => {
			if (settled) {
				return;
			}
			settled = true;
			if (res && !res.headersSent) {
				res.on('finish', () => req.destroy());
				sendJson(res, 413, { error: 'Payload Too Large' });
			} else {
				req.destroy();
			}
			reject(Object.assign(new Error(`Request body exceeds ${maxBytes} bytes`), { statusCode: 413 }));
		};

		req.on('data', chunk => {
			if (settled) {
				return;
			}
			totalBytes += chunk.length;
			if (totalBytes > maxBytes) {
				failPayloadTooLarge();
				return;
			}
			chunks.push(chunk);
		});
		req.on('end', () => {
			if (settled) {
				return;
			}
			settled = true;
			resolve(Buffer.concat(chunks));
		});
		req.on('error', error => {
			if (settled) {
				return;
			}
			settled = true;
			reject(error);
		});
	});
}

/**
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 * @param {Record<string, string>} [headers]
 */
export function sendJson(res, status, payload, headers = {}) {
	const body = JSON.stringify(payload);
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': Buffer.byteLength(body),
		...headers
	});
	res.end(body);
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export function applyCors(req, res) {
	const origin = req.headers.origin;
	if (origin && ALLOWED_ORIGINS.has(origin)) {
		res.setHeader('Access-Control-Allow-Origin', origin);
		res.setHeader('Vary', 'Origin');
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {Promise<unknown>}
 */
export async function parseJsonBody(req, res) {
	let body;
	try {
		body = await readBody(req, MAX_BODY_BYTES, res);
	} catch (error) {
		if (error?.statusCode === 413) {
			if (!res.headersSent) {
				sendJson(res, 413, { error: 'Payload Too Large' });
			}
			return null;
		}
		throw error;
	}
	try {
		return JSON.parse(body.toString('utf8') || '{}');
	} catch (error) {
		if (error instanceof SyntaxError) {
			sendJson(res, 400, { error: 'Invalid JSON in request body' });
			return null;
		}
		throw error;
	}
}
