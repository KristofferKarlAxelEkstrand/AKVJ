import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to extract the message format line.
 * Format: `Bn 58 vv`
 */
const MESSAGE_FORMAT_REGEX = /^Bn\s+58\s+vv$/;

/**
 * Regex to extract the data byte description.
 * Format: `vv = lower 7 bits affixed to the subsequent Note On / Note Off velocity`
 */
const DATA_BYTE_DESC_REGEX = /^vv\s*=\s*(.+)$/;

/**
 * Regex to extract hex velocity range values.
 * Matches patterns like `0080H` or `3FFFH`.
 */
const HEX_VALUE_REGEX = /([0-9A-Fa-f]+H)/g;

/**
 * Regex to extract the step count.
 * Matches patterns like `16,256 steps`.
 */
const STEP_COUNT_REGEX = /(\d[\d,]+)\s+steps/;

/**
 * Transforms the CC#88 High Resolution Velocity Prefix (CA-031) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa31HighResVelocityPrefix(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	let abstract = '';
	let background = '';
	let messageFormat = null;
	let dataByteDescription = null;
	const behaviorRules = [];
	let sourceCommittee = null;

	let currentSection = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, and boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('docId:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# CC') || line.startsWith('## Page') || line.startsWith('MMA Technical Standards') || line.startsWith('AMEI MIDI Committee') || line.startsWith('Confirmation of Approval')) {
			continue;
		}

		// Detect sections
		if (line.startsWith('CC #88 High Resolution Velocity Prefix (CA-031)')) {
			continue;
		}
		if (line.startsWith('Source:')) {
			sourceCommittee = line.replace(/^Source:\s*/, '').trim();
			continue;
		}
		if (line.startsWith('Abstract:')) {
			currentSection = 'abstract';
			const rest = line.replace(/^Abstract:\s*/, '').trim();
			if (rest) {
				abstract = rest;
			}
			continue;
		}
		if (line.startsWith('Background & Purpose:')) {
			currentSection = 'background';
			const rest = line.replace(/^Background & Purpose:\s*/, '').trim();
			if (rest) {
				background = rest;
			}
			continue;
		}
		if (line.startsWith('[CONTROLLER MESSAGE]')) {
			currentSection = 'message';
			continue;
		}
		if (line.startsWith('HIGH-RESOLUTION VELOCITY PREFIX')) {
			continue;
		}

		// Parse message format line
		if (currentSection === 'message' && MESSAGE_FORMAT_REGEX.test(line)) {
			messageFormat = {
				status_byte: 'Bn',
				controller_number: 88,
				controller_hex: '0x58',
				data_byte: 'vv',
				raw: line
			};
			continue;
		}

		// Parse data byte description
		if (currentSection === 'message' && DATA_BYTE_DESC_REGEX.test(line)) {
			dataByteDescription = line.match(DATA_BYTE_DESC_REGEX)[1].trim();
			currentSection = 'behavior';
			continue;
		}

		// Accumulate abstract
		if (currentSection === 'abstract') {
			abstract += (abstract ? ' ' : '') + line;
			continue;
		}

		// Accumulate background
		if (currentSection === 'background') {
			background += (background ? ' ' : '') + line;
			continue;
		}

		// Accumulate behavior rules
		if (currentSection === 'behavior') {
			behaviorRules.push(line);
			continue;
		}
	}

	// Extract structured details from behavior rules
	const fullBehaviorText = behaviorRules.join(' ');
	const hexValues = fullBehaviorText.match(HEX_VALUE_REGEX) || [];
	const stepCountMatch = fullBehaviorText.match(STEP_COUNT_REGEX);
	const minVelocity = hexValues.find(h => h === '0080H') || null;
	const maxVelocity = hexValues.find(h => h === '3FFFH') || null;
	const stepCount = stepCountMatch ? parseInt(stepCountMatch[1].replace(/,/g, ''), 10) : null;

	const result = {
		metadata: {
			title: 'CC #88 High Resolution Velocity Prefix',
			doc_id: 'CA-031',
			protocol: 'midi1',
			source: path.basename(markdownPath),
			source_committee: sourceCommittee
		},
		abstract: abstract.trim(),
		background: background.trim(),
		message_format: messageFormat,
		data_byte_description: dataByteDescription,
		velocity_range: {
			min_14bit_hex: minVelocity,
			max_14bit_hex: maxVelocity,
			step_count: stepCount
		},
		behavior_rules: behaviorRules,
		summary: {
			behavior_rule_count: behaviorRules.length,
			has_message_format: messageFormat !== null,
			has_velocity_range: minVelocity !== null && maxVelocity !== null
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca31-high-res-velocity-prefix.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
