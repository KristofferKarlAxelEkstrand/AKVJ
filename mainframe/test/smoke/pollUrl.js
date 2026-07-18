import http from 'http';
import { setTimeout as sleep } from 'timers/promises';

/**
 * Poll a URL until it returns HTTP 200 or the deadline is reached.
 * @param {string} url
 * @param {number} deadline - Absolute timestamp (Date.now() + timeout)
 * @param {{ pollIntervalMs?: number, fetchTimeoutMs?: number }} [options]
 * @returns {Promise<boolean>}
 */
export async function pollUrl(url, deadline, { pollIntervalMs = 500, fetchTimeoutMs = 3000 } = {}) {
	while (Date.now() < deadline) {
		try {
			const ok = await new Promise((resolve, reject) => {
				const req = http.get(url, { timeout: fetchTimeoutMs }, res => {
					res.resume();
					resolve(res.statusCode === 200);
				});
				req.on('error', reject);
				req.on('timeout', () => {
					req.destroy();
					reject(new Error('request timeout'));
				});
			});
			if (ok) {
				return true;
			}
		} catch {
			// Server not ready yet, keep polling
		}
		await sleep(pollIntervalMs);
	}
	return false;
}
