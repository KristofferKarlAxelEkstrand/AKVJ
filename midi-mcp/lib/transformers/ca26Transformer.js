import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the CA-026 Modulation Depth Range RPN specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa26(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		approval_info: {},
		abstract: '',
		background: '',
		rpn: {
			name: 'Modulation Depth Range',
			rpn_number: 5,
			lsb: 5,
			msb: 0,
			message_format: '',
			follow_up: '',
			default_setting: ''
		},
		comment: '',
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let currentSection = null;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(/^## Page \d+$/)) {
			continue;
		}

		// Detect approval info
		if (trimmedLine.match(/^Date of issue:/i)) {
			const dateMatch = trimmedLine.match(/Date of issue:\s*(.+?)\s+Originated by:\s*(.+)$/i);
			if (dateMatch) {
				result.approval_info.date_of_issue = dateMatch[1].trim();
				result.approval_info.originated_by = dateMatch[2].trim();
			}
			continue;
		}

		if (trimmedLine.match(/^Reference TSBB/i)) {
			result.approval_info.reference = trimmedLine;
			continue;
		}

		if (trimmedLine.match(/^Title:/i)) {
			result.approval_info.title = trimmedLine.replace(/^Title:\s*/, '');
			continue;
		}

		if (trimmedLine.match(/^CA#:/i)) {
			result.approval_info.ca_number = trimmedLine.replace(/^CA#:\s*/, '').trim();
			continue;
		}

		if (trimmedLine.match(/^Related item/i)) {
			result.approval_info.related_items = trimmedLine.replace(/^Related item\(s\):\s*/, '');
			continue;
		}

		// Detect abstract
		if (trimmedLine.match(/^Abstract:/i)) {
			currentSection = 'abstract';
			result.abstract = trimmedLine.replace(/^Abstract:\s*/, '');
			continue;
		}

		if (currentSection === 'abstract' && !trimmedLine.match(/^Background:/i)) {
			result.abstract += ' ' + trimmedLine;
			continue;
		}

		// Detect background
		if (trimmedLine.match(/^Background:/i)) {
			currentSection = 'background';
			result.background = trimmedLine.replace(/^Background:\s*/, '');
			continue;
		}

		if (currentSection === 'background' && !trimmedLine.match(/^Details:/i)) {
			result.background += ' ' + trimmedLine;
			continue;
		}

		// Detect details section
		if (trimmedLine.match(/^Details:/i)) {
			currentSection = 'details';
			continue;
		}

		// Parse RPN table line: "05 00 Modulation Depth Range"
		if (currentSection === 'details' && trimmedLine.match(/^\d+\s+\d+\s+/)) {
			const parts = trimmedLine.split(/\s+/);
			result.rpn.lsb = parseInt(parts[0], 10);
			result.rpn.msb = parseInt(parts[1], 10);
			result.rpn.name = parts.slice(2).join(' ');
			continue;
		}

		// Parse message format
		if (currentSection === 'details' && trimmedLine.match(/^Message Format:/i)) {
			result.rpn.message_format = trimmedLine.replace(/^Message Format:\s*/, '');
			continue;
		}

		// Parse follow-up rules
		if (currentSection === 'details' && trimmedLine.match(/^This message must be followed/i)) {
			result.rpn.follow_up = trimmedLine;
			continue;
		}

		// Parse default setting
		if (currentSection === 'details' && trimmedLine.match(/^Neither default/i)) {
			result.rpn.default_setting = trimmedLine;
			currentSection = 'default_setting';
			continue;
		}

		if (currentSection === 'default_setting' && !trimmedLine.match(/^Comment:/i)) {
			result.rpn.default_setting += ' ' + trimmedLine;
			continue;
		}

		// Detect comment
		if (trimmedLine.match(/^Comment:/i)) {
			currentSection = 'comment';
			result.comment = trimmedLine.replace(/^Comment:\s*/, '');
			continue;
		}

		if (currentSection === 'comment') {
			result.comment += ' ' + trimmedLine;
			continue;
		}
	}

	result.summary = {
		rpn_number: result.rpn.rpn_number
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(
			path.join(outDir, 'ca26.json'),
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
			} else if (key === 'docId') {
				result.metadata.doc_id = value;
			} else if (key === 'protocol') {
				result.metadata.protocol = value;
			} else if (key === 'source') {
				result.metadata.source = value;
			} else if (key === 'pages') {
				result.metadata.pages = parseInt(value, 10);
			} else if (key === 'summary') {
				result.metadata.summary = value;
			}
		}
	}
}
