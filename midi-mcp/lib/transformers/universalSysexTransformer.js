import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a hex value (e.g. "04") or hex range (e.g. "00-7F")
 * at the start of a line, followed by whitespace and a description.
 * Used for lines that have no tab separators.
 */
const HEX_PREFIX_REGEX = /^([0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2})?)\s+(.+)$/;

/**
 * Regex to validate that a string is a 2-digit hex value.
 */
const HEX_VALUE_REGEX = /^[0-9A-Fa-f]{2}$/;

/**
 * Regex to validate that a string is a hex range (e.g. "00-7F").
 */
const HEX_RANGE_REGEX = /^[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}$/;

/**
 * Normalises a sub-ID #2 value for use in the JSON output.
 *
 * @param {string} raw - The raw sub-ID #2 string from the markdown.
 * @returns {string|null} - Normalised value: null for "--", "nn" for variable,
 *   uppercased hex for fixed values, uppercased range for ranges.
 */
function normaliseSubId2(raw) {
	const trimmed = raw.trim();
	if (trimmed === '--') {
		return null;
	}
	if (trimmed.toLowerCase() === 'nn') {
		return 'nn';
	}
	return trimmed.toUpperCase();
}

/**
 * Parses a single line of the Universal SysEx markdown document.
 *
 * The document uses tab-separated columns. Lines can be:
 * - 3-column: SUB-ID#1 \t SUB-ID#2 \t Description
 * - 2-column: hex/range \t Description
 * - 1-column: hex Description (space-separated, no tabs)
 *
 * @param {string} line - A single trimmed line from the markdown.
 * @returns {{type: string, subId1?: string, subId2?: string, hex?: string, description?: string} | null}
 *   Parsed entry or null if the line should be skipped.
 */
function parseLine(line) {
	const tabParts = line
		.split('\t')
		.map(p => p.trim())
		.filter(p => p !== '');

	if (tabParts.length >= 3) {
		const subId1 = tabParts[0];
		const subId2 = tabParts[1];
		const description = tabParts.slice(2).join(' ');

		if (!HEX_VALUE_REGEX.test(subId1)) {
			return null;
		}
		return { type: 'parent', subId1, subId2, description };
	}

	if (tabParts.length === 2) {
		const hex = tabParts[0];
		const description = tabParts[1];

		if (!HEX_VALUE_REGEX.test(hex) && !HEX_RANGE_REGEX.test(hex)) {
			return null;
		}
		return { type: 'entry', hex, description };
	}

	if (tabParts.length === 1) {
		const match = tabParts[0].match(HEX_PREFIX_REGEX);
		if (match) {
			return { type: 'entry', hex: match[1], description: match[2] };
		}
		return null;
	}

	return null;
}

/**
 * Transforms the Universal System Exclusive Messages markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformUniversalSysex(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const categories = [];
	let currentCategory = null;
	let currentGroup = null;

	for (const line of lines) {
		if (!line || line.startsWith('## Page')) {
			continue;
		}

		if (line.includes('Non-Real Time') && line.includes('7E')) {
			if (currentCategory) {
				if (currentGroup) {
					currentCategory.messages.push(currentGroup);
				}
				categories.push(currentCategory);
			}
			currentCategory = { type: 'non_real_time', sysex_id: '7E', messages: [] };
			currentGroup = null;
			continue;
		}

		if (line.includes('Real Time') && line.includes('7F') && !line.includes('Non-Real')) {
			if (currentCategory) {
				if (currentGroup) {
					currentCategory.messages.push(currentGroup);
				}
				categories.push(currentCategory);
			}
			currentCategory = { type: 'real_time', sysex_id: '7F', messages: [] };
			currentGroup = null;
			continue;
		}

		if (!currentCategory) {
			continue;
		}

		const parsed = parseLine(line);
		if (!parsed) {
			continue;
		}

		if (parsed.type === 'parent') {
			if (currentGroup) {
				currentCategory.messages.push(currentGroup);
			}

			const message = {
				sub_id_1: parsed.subId1.toUpperCase(),
				sub_id_2: normaliseSubId2(parsed.subId2),
				description: parsed.description,
				children: []
			};

			if (parsed.subId2.trim().toLowerCase() === 'nn') {
				currentGroup = message;
			} else {
				currentCategory.messages.push(message);
				currentGroup = null;
			}
		} else if (parsed.type === 'entry') {
			if (currentGroup) {
				currentGroup.children.push({
					sub_id_2: parsed.hex.toUpperCase(),
					description: parsed.description
				});
			} else {
				currentCategory.messages.push({
					sub_id_1: parsed.hex.toUpperCase(),
					sub_id_2: null,
					description: parsed.description,
					children: []
				});
			}
		}
	}

	if (currentCategory) {
		if (currentGroup) {
			currentCategory.messages.push(currentGroup);
		}
		categories.push(currentCategory);
	}

	const result = {
		metadata: {
			title: 'Universal System Exclusive Messages',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		categories
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'universal-sysex.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
