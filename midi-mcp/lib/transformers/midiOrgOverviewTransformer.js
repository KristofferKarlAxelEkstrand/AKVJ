import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms MIDI.org overview/reference pages into a structured JSON object.
 * These pages have a common structure: title, description, download link, and file metadata.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidiOrgOverview(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		download_file: {
			file_name: '',
			category: '',
			file_size: ''
		},
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let inDescription = false;
	let descriptionDone = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		// Skip header fragments and nav text
		if (trimmedLine.match(/^#/) || trimmedLine.match(/^Download$|^Sign up|^About|^MIDI Association|^MIDI Logo|^Media|^Privacy|^©/i)) {
			continue;
		}

		// Detect the main description (first substantive paragraph after headers)
		if (!descriptionDone && !trimmedLine.match(/^File Name:|^\|/i)) {
			if (!inDescription && trimmedLine.length > 20) {
				inDescription = true;
				result.description = trimmedLine;
				continue;
			}
			// Accumulate continuation description
			if (inDescription && !trimmedLine.match(/^File Name:|^\|/i)) {
				result.description += ' ' + trimmedLine;
				continue;
			}
		}

		// Detect file metadata table rows
		if (trimmedLine.match(/^File Name:\s*\|/i)) {
			inDescription = false;
			descriptionDone = true;
			result.download_file.file_name = trimmedLine.replace(/^File Name:\s*\|\s*/, '').trim();
			continue;
		}

		if (trimmedLine.match(/^Category:\s*\|/i)) {
			result.download_file.category = trimmedLine.replace(/^Category:\s*\|\s*/, '').trim();
			continue;
		}

		if (trimmedLine.match(/^File Size:\s*\|/i)) {
			result.download_file.file_size = trimmedLine.replace(/^File Size:\s*\|\s*/, '').trim();
			continue;
		}
	}

	result.summary = {
		has_description: result.description.length > 0,
		has_download_file: result.download_file.file_name.length > 0
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		const baseName = path.basename(markdownPath, '.md');
		await fs.writeFile(
			path.join(outDir, `${baseName}.json`),
			JSON.stringify(result, null, 2),
			'utf-8'
		);
	}

	return result;
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
