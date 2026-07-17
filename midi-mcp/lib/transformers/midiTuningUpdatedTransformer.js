import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI Tuning Updated Specification overview page
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidiTuningUpdated(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		incorporates: [],
		message_types: [],
		scale_octave_tuning_description: '',
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
	let inScaleOctaveDesc = false;
	let descriptionDone = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		// Skip headers and nav
		if (trimmedLine.match(/^#/) || trimmedLine.match(/^Download$|^Sign up|^About|^MIDI Association|^MIDI Logo|^Media|^Privacy|^©/i)) {
			continue;
		}

		// Detect "incorporating the following:" section
		if (trimmedLine.match(/^incorporating the following:/i)) {
			descriptionDone = true;
			continue;
		}

		// Detect incorporated spec list items (dash bullets)
		if (trimmedLine.match(/^-\s+/) && descriptionDone && result.message_types.length === 0) {
			result.incorporates.push(trimmedLine.replace(/^-\s+/, ''));
			continue;
		}

		// Detect message types (Unicode bullet • \u2022)
		if (trimmedLine.match(/^\u2022\s+/)) {
			result.message_types.push(trimmedLine.replace(/^\u2022\s+/, ''));
			continue;
		}

		// Detect scale/octave tuning description
		if (trimmedLine.match(/^Scale\/Octave Tuning/i)) {
			inScaleOctaveDesc = true;
			result.scale_octave_tuning_description = trimmedLine;
			continue;
		}

		if (inScaleOctaveDesc && !trimmedLine.match(/^File Name:/i)) {
			result.scale_octave_tuning_description += ' ' + trimmedLine;
			continue;
		}

		// Detect file metadata
		if (trimmedLine.match(/^File Name:\s*\|/i)) {
			inScaleOctaveDesc = false;
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

		// Accumulate description (first substantive paragraph)
		if (!descriptionDone && trimmedLine.length > 20 && !trimmedLine.match(/^File Name:|^Category:|^File Size:/i)) {
			if (!inDescription) {
				inDescription = true;
				result.description = trimmedLine;
				continue;
			}
			if (inDescription && !trimmedLine.match(/^incorporating|^[-•]|^The MIDI Tuning messages/i)) {
				result.description += ' ' + trimmedLine;
				continue;
			}
		}
	}

	result.summary = {
		incorporates_count: result.incorporates.length,
		message_type_count: result.message_types.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi-tuning-updated-specification-midi-org.json'), JSON.stringify(result, null, 2), 'utf-8');
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
