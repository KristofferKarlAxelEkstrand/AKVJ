import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the Summary of MIDI 1.0 Messages reference page
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformSummaryMidi10Messages(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		warning: '',
		categories: [],
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let currentCategory = null;
	let inTable = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		// Skip headers and nav
		if (trimmedLine.match(/^#/) || trimmedLine.match(/^Download$|^Sign up|^About|^MIDI Association|^MIDI Logo|^Media|^Privacy|^©/i)) {
			continue;
		}

		// Detect table header
		if (trimmedLine.match(/^Table 1.*MIDI 1\.0 Specification Message Summary/i)) {
			inTable = true;
			continue;
		}

		if (trimmedLine.match(/^Status.*Data Byte.*Description/i)) {
			continue;
		}

		// Detect description text
		if (trimmedLine.match(/^The following table/i)) {
			result.description = trimmedLine;
			continue;
		}

		if (trimmedLine.match(/^WARNING!/i)) {
			result.warning = trimmedLine;
			continue;
		}

		// Detect category headers
		if (inTable && isCategoryHeader(trimmedLine)) {
			currentCategory = {
				name: trimmedLine.replace(/\s*\[.*\]/, '').replace(/\s*\(.*\)/, ''),
				messages: []
			};
			result.categories.push(currentCategory);
			continue;
		}

		// Parse message rows: "1000nnnn | 0kkkkkkk 0vvvvvvv | Description..."
		const msgMatch = trimmedLine.match(/^([01n]+\s*[01n]*)\s*\|\s*(.*?)\s*\|\s*(.+)$/);
		if (msgMatch && inTable && currentCategory) {
			currentCategory.messages.push({
				status: msgMatch[1].trim(),
				data_bytes: msgMatch[2].trim(),
				description: msgMatch[3].trim()
			});
			continue;
		}

		// Parse continuation rows (no status byte, just description continuation)
		// Format: " | description text" or "description text"
		if (inTable && currentCategory && currentCategory.messages.length > 0) {
			const lastMsg = currentCategory.messages[currentCategory.messages.length - 1];
			if (trimmedLine.match(/^\|/) || (!trimmedLine.match(/[01]{8}/) && !trimmedLine.match(/^Download|^Sign up|^About/i) && !isCategoryHeader(trimmedLine))) {
				// Check if it's a pipe-prefixed continuation
				const contMatch = trimmedLine.match(/^\s*\|\s*(.+)$/);
				if (contMatch) {
					lastMsg.description += ' ' + contMatch[1].trim();
					continue;
				}
				// Non-pipe continuation (e.g., sub-commands within Channel Mode)
				if (!trimmedLine.match(/^Download|^Sign up|^About|^MIDI Association|^MIDI Logo|^Media|^Privacy|^©/i)) {
					lastMsg.description += ' ' + trimmedLine;
					continue;
				}
			}
		}
	}

	const totalMessages = result.categories.reduce((sum, cat) => sum + cat.messages.length, 0);

	result.summary = {
		category_count: result.categories.length,
		total_messages: totalMessages
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'summary-of-midi-1-0-messages-midi-org.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function isCategoryHeader(line) {
	return line.match(/^Channel Voice Messages/i) || line.match(/^Channel Mode Messages/i) || line.match(/^System Common Messages/i) || line.match(/^System Real-Time Messages/i);
}

function parseFrontmatter(content, result) {
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!fmMatch) {
		return;
	}

	const fm = fmMatch[1];
	for (const line of fm.split('\n')) {
		const match = line.match(/^(\w+):\s*(.+)$/);
		if (match) {
			const key = match[1];
			const value = match[2].trim();
			if (key === 'title') {
				result.metadata.title = value;
			} else if (key === 'version') {
				result.metadata.version = value;
			} else if (key === 'protocol') {
				result.metadata.protocol = value;
			} else if (key === 'source') {
				result.metadata.source = value;
			} else if (key === 'summary') {
				result.metadata.summary = value;
			}
		}
	}
}
