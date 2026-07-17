const API = '/api';

/**
 * Fetch wrapper that checks response.ok and parses JSON error messages.
 * @param {string} path - Path appended to the API base URL
 * @param {RequestInit} [options]
 * @returns {Promise<object>}
 */
export async function api(path, options = {}) {
	const response = await fetch(`${API}${path}`, {
		headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
		...options
	});
	const responseBody = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(responseBody.error || `HTTP ${response.status}`);
	}
	return responseBody;
}

export { API };
