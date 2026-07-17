import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms MDN Web MIDI API reference pages
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMdnWebMidi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		availability: '',
		secure_context: false,
		constructor: null,
		instance_properties: [],
		instance_methods: [],
		events: [],
		examples: [],
		specifications: [],
		browser_compatibility: {},
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let currentSection = null;
	let inCodeBlock = false;
	let codeLines = [];
	let pastFrontmatter = false;
	let frontmatterEndFound = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Skip frontmatter
		if (!pastFrontmatter) {
			if (trimmedLine === '---') {
				if (!frontmatterEndFound) {
					frontmatterEndFound = true;
				} else {
					pastFrontmatter = true;
				}
				continue;
			}
			if (!frontmatterEndFound) {
				continue;
			}
			continue;
		}

		if (!trimmedLine) {
			continue;
		}

		// Track code blocks
		if (trimmedLine.match(/^```/)) {
			if (inCodeBlock) {
				result.examples.push(codeLines.join('\n'));
				codeLines = [];
				inCodeBlock = false;
			} else {
				inCodeBlock = true;
			}
			continue;
		}

		if (inCodeBlock) {
			codeLines.push(line);
			continue;
		}

		// Skip nav/boilerplate
		if (trimmedLine.match(/^Learn more$|^See full|^Want more|^Tell us|^Help improve|^Learn how|^View this|^Your blueprint|^MDN$|^About$|^Blog$|^Mozilla|^Advertise|^MDN Plus$|^Product help$|^Contribute$|^MDN Community$|^Community resources$|^Writing guidelines$|^MDN Discord$|^MDN on GitHub$|^Developers$|^Web technologies$|^Learn web|^Guides$|^Tutorials$|^Glossary$|^Hacks blog$|^Website Privacy|^Telemetry|^Legal$|^Community Participation|^Portions of this/i)) {
			continue;
		}

		// Skip header fragments
		if (trimmedLine.match(/^<\?>/)) {
			continue;
		}

		// Detect availability
		if (trimmedLine.match(/^Limited availability/i)) {
			result.availability = trimmedLine;
			continue;
		}

		if (trimmedLine.match(/^This feature is not Baseline/i)) {
			result.availability += ' ' + trimmedLine;
			continue;
		}

		// Detect secure context
		if (trimmedLine.match(/^Secure context:/i)) {
			result.secure_context = true;
			continue;
		}

		// Detect description (first substantive paragraph)
		if (!result.description && trimmedLine.length > 30 && !trimmedLine.match(/^#|^Limited|^This feature is|^Want more|^Learn more|^See full|^Secure context|^\?>/i)) {
			result.description = trimmedLine;
			continue;
		}

		// Detect sections
		if (trimmedLine.match(/^## Constructor/i)) {
			currentSection = 'constructor';
			continue;
		}

		if (trimmedLine.match(/^## Instance properties/i)) {
			currentSection = 'instance_properties';
			continue;
		}

		if (trimmedLine.match(/^## Instance methods/i)) {
			currentSection = 'instance_methods';
			continue;
		}

		if (trimmedLine.match(/^##+ Events/i)) {
			currentSection = 'events';
			continue;
		}

		if (trimmedLine.match(/^## Examples/i)) {
			currentSection = 'examples';
			continue;
		}

		if (trimmedLine.match(/^## Specifications/i)) {
			currentSection = 'specifications';
			continue;
		}

		if (trimmedLine.match(/^## Browser compatibility/i)) {
			currentSection = 'browser_compatibility';
			continue;
		}

		// Parse constructor
		if (currentSection === 'constructor' && trimmedLine.match(/^[A-Z]\w+\(/)) {
			result.constructor = {
				name: trimmedLine.replace(/\(.*/, ''),
				signature: trimmedLine
			};
			continue;
		}

		if (currentSection === 'constructor' && result.constructor && !result.constructor.description) {
			result.constructor.description = trimmedLine;
			continue;
		}

		// Parse instance properties
		if (currentSection === 'instance_properties' && trimmedLine.match(/^[A-Z]\w+\./)) {
			const propMatch = trimmedLine.match(/^([A-Z]\w+)\.(\w+)\s*(.*)$/);
			if (propMatch) {
				result.instance_properties.push({
					name: propMatch[2],
					modifiers: propMatch[3].trim(),
					description: ''
				});
			}
			continue;
		}

		if (currentSection === 'instance_properties' && result.instance_properties.length > 0) {
			const lastProp = result.instance_properties[result.instance_properties.length - 1];
			if (!lastProp.description && !trimmedLine.match(/^##|^js$|^```/i)) {
				lastProp.description = trimmedLine;
				continue;
			}
		}

		// Parse instance methods
		if (currentSection === 'instance_methods' && trimmedLine.match(/^[A-Z]\w+\./)) {
			const methodMatch = trimmedLine.match(/^([A-Z]\w+)\.(\w+)\(/);
			if (methodMatch) {
				result.instance_methods.push({
					name: methodMatch[2],
					signature: trimmedLine,
					description: ''
				});
			}
			continue;
		}

		if (currentSection === 'instance_methods' && result.instance_methods.length > 0) {
			const lastMethod = result.instance_methods[result.instance_methods.length - 1];
			if (!lastMethod.description && !trimmedLine.match(/^##|^js$|^```/i)) {
				lastMethod.description = trimmedLine;
				continue;
			}
		}

		// Parse events
		if (currentSection === 'events' && trimmedLine.match(/^[a-z]/i) && !trimmedLine.match(/^##/i)) {
			result.events.push(trimmedLine);
			continue;
		}

		// Parse specifications
		if (currentSection === 'specifications' && trimmedLine.match(/^Web MIDI/i)) {
			result.specifications.push(trimmedLine.replace(/<\?>/g, '').trim());
			continue;
		}
	}

	result.summary = {
		instance_property_count: result.instance_properties.length,
		instance_method_count: result.instance_methods.length,
		event_count: result.events.length,
		example_count: result.examples.length,
		specification_count: result.specifications.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		const baseName = path.basename(markdownPath, '.md');
		await fs.writeFile(path.join(outDir, `${baseName}.json`), JSON.stringify(result, null, 2), 'utf-8');
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
