import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-032 XMF Patch Type Prefix Meta-Event specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp32(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		abstract: '',
		meta_event: {
			name: 'XMF Patch Type Prefix Meta-Event',
			format: 'FF 60 <len> <param>',
			meta_event_type: '0x60'
		},
		params: [],
		usage_rules: [],
		sysex_relationship: '',
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

		// Detect abstract
		if (trimmedLine.match(/^\[Abstract\]/i)) {
			currentSection = 'abstract';
			continue;
		}

		if (currentSection === 'abstract' && !trimmedLine.match(/^\[XMF/i)) {
			result.abstract += (result.abstract ? ' ' : '') + trimmedLine;
			continue;
		}

		// Detect meta-event section
		if (trimmedLine.match(/^\[XMF Patch Type Prefix Meta-Event\]/i)) {
			currentSection = 'meta_event_section';
			continue;
		}

		// Detect format line
		if (currentSection === 'meta_event_section' && trimmedLine.match(/^FF\s+60/i)) {
			result.meta_event.format = trimmedLine;
			continue;
		}

		// Detect usage rules
		if (trimmedLine.match(/^In a Type 0 or Type 1 XMF File, this meta-event/i)) {
			currentSection = 'usage_rules';
		}

		if (currentSection === 'usage_rules' && !trimmedLine.match(/^<param>|^\[Relationship/i)) {
			result.usage_rules.push(trimmedLine);
			continue;
		}

		// Detect param entries: "<param> = 0x01 General MIDI 1..."
		const paramMatch = trimmedLine.match(/^<param>\s*=\s*(0x[0-9A-Fa-f]+)\s+(.+)$/);
		if (paramMatch) {
			const paramValue = paramMatch[1];
			const rest = paramMatch[2];
			// Extract name (first few words before a period)
			const nameMatch = rest.match(/^([^.]+)\.\s*(.*)$/);
			result.params.push({
				param: paramValue,
				name: nameMatch ? nameMatch[1].trim() : rest,
				description: nameMatch ? nameMatch[2].trim() : '',
				syntax: ''
			});
			currentSection = 'param_description';
			continue;
		}

		// Accumulate param description continuation and extract syntax
		if (currentSection === 'param_description' && !trimmedLine.match(/^<param>|^\[Relationship/i)) {
			const lastParam = result.params[result.params.length - 1];
			if (lastParam) {
				// Check if we're inside a syntax bracket that hasn't closed
				if (lastParam.syntax && !lastParam.syntax.includes(']')) {
					// Continuation of multi-line syntax
					lastParam.syntax += ' ' + trimmedLine;
				} else {
					const syntaxMatch = trimmedLine.match(/Syntax:\s*\[([^\]]*)/i);
					if (syntaxMatch) {
						lastParam.syntax = syntaxMatch[1].trim();
						// Check if syntax closes on same line
						const fullSyntaxMatch = trimmedLine.match(/Syntax:\s*\[([^\]]+)\]/i);
						if (fullSyntaxMatch) {
							lastParam.syntax = fullSyntaxMatch[1].trim();
						}
					} else {
						lastParam.description += ' ' + trimmedLine;
					}
				}
			}
			continue;
		}

		// Detect SysEx relationship
		if (trimmedLine.match(/^\[Relationship to System Exclusive/i)) {
			currentSection = 'sysex';
			continue;
		}

		if (currentSection === 'sysex' && !trimmedLine.match(/^MIDI Manufacturers/i)) {
			result.sysex_relationship += (result.sysex_relationship ? ' ' : '') + trimmedLine;
			continue;
		}
	}

	result.summary = {
		param_count: result.params.length,
		usage_rule_count: result.usage_rules.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'rp32.json'), JSON.stringify(result, null, 2), 'utf-8');
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
