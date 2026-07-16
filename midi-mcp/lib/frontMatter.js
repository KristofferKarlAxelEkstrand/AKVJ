/**
 * Minimal front-matter (de)serialization for knowledge-base markdown files.
 * Values are flat strings/numbers/booleans — no nested YAML.
 */

/**
 * Split a markdown document into front-matter fields and body.
 *
 * @param {string} markdown
 * @returns {{ meta: object, body: string }}
 */
export function parseFrontMatter(markdown) {
	const text = String(markdown ?? '');
	const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
	if (!match) {
		return { meta: {}, body: text };
	}
	const meta = {};
	for (const line of match[1].split('\n')) {
		const separator = line.indexOf(':');
		if (separator === -1) {
			continue;
		}
		const key = line.slice(0, separator).trim();
		const raw = line.slice(separator + 1).trim();
		if (key.length === 0) {
			continue;
		}
		meta[key] = parseValue(raw);
	}
	return { meta, body: text.slice(match[0].length) };
}

/**
 * Render front-matter fields followed by the body.
 *
 * @param {object} meta - Flat object; undefined values are skipped
 * @param {string} body
 * @returns {string}
 */
export function serializeFrontMatter(meta, body) {
	const lines = ['---'];
	for (const [key, value] of Object.entries(meta)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}
		lines.push(`${key}: ${String(value).replace(/\n/g, ' ')}`);
	}
	lines.push('---', '');
	return `${lines.join('\n')}${body}\n`;
}

function parseValue(raw) {
	if (raw === 'true') {
		return true;
	}
	if (raw === 'false') {
		return false;
	}
	if (/^-?\d+(\.\d+)?$/.test(raw)) {
		return Number(raw);
	}
	return raw;
}
