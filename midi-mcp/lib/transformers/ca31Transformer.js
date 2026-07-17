import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the CA-031 CC #88 High Resolution Velocity Prefix specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa31(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		abstract: '',
		background: '',
		controller_message: {},
		usage_rules: [],
		compatibility: '',
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

		if (trimmedLine.match(/^Abstract:/i)) {
			currentSection = 'abstract';
			result.abstract = trimmedLine.replace(/^Abstract:\s*/, '');
			continue;
		}

		if (trimmedLine.match(/^Background & Purpose:/i)) {
			currentSection = 'background';
			result.background = trimmedLine.replace(/^Background & Purpose:\s*/, '');
			continue;
		}

		// Accumulate continuation lines for abstract and background
		if (currentSection === 'abstract' && !trimmedLine.match(/^Background|^\[CONTROLLER/i)) {
			result.abstract += ' ' + trimmedLine;
			continue;
		}

		if (currentSection === 'background' && !trimmedLine.match(/^\[CONTROLLER/i)) {
			result.background += ' ' + trimmedLine;
			continue;
		}

		if (trimmedLine.match(/^\[CONTROLLER MESSAGE\]/i)) {
			currentSection = 'controller_message';
			continue;
		}

		if (trimmedLine.match(/^HIGH-RESOLUTION VELOCITY PREFIX/i)) {
			if (currentSection === 'controller_message') {
				result.controller_message.name = trimmedLine;
			}
			continue;
		}

		// Detect message format: "Bn 58 vv"
		if (currentSection === 'controller_message' && trimmedLine.match(/^Bn\s+58\s+vv$/)) {
			result.controller_message.format = trimmedLine;
			continue;
		}

		// Detect value description: "vv = lower 7 bits..."
		if (currentSection === 'controller_message' && trimmedLine.match(/^vv\s*=/)) {
			result.controller_message.value_description = trimmedLine;
			continue;
		}

		// Usage rules start after "The velocity byte..."
		if (trimmedLine.match(/^The velocity byte/i)) {
			currentSection = 'usage_rules';
		}

		if (currentSection === 'usage_rules' && !trimmedLine.match(/^In order|^If the receiver/i)) {
			if (!trimmedLine.match(/^\[CONTROLLER|^HIGH-RES|^Bn |^vv /i)) {
				result.usage_rules.push(trimmedLine);
			}
			continue;
		}

		// Compatibility note
		if (trimmedLine.match(/^If the receiver does not recognize/i)) {
			result.compatibility = trimmedLine;
			currentSection = null;
		}

		// Running status compatibility rules
		if (trimmedLine.match(/^In order to maintain/i)) {
			result.usage_rules.push(trimmedLine);
		}
	}

	result.controller_message.cc_number = 88;
	result.controller_message.cc_hex = '0x58';

	result.summary = {
		usage_rule_count: result.usage_rules.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca31.json'), JSON.stringify(result, null, 2), 'utf-8');
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
