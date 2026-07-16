import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match the RPN table header.
 * Format: `LSB MSB Function`
 */
const RPN_TABLE_HEADER_REGEX = /^LSB\s+MSB\s+Function/i;

/**
 * Regex to match RPN table entries.
 * Format: `05 00 Modulation Depth Range`
 */
const RPN_ENTRY_REGEX = /^([0-9A-Fa-f]{2})\s+([0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Transforms the Modulation Depth Range RPN (CA-026) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa26ModulationDepthRange(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	let abstract = '';
	let background = '';
	let dateOfIssue = null;
	let originatedBy = null;
	let referenceItem = null;
	let title = null;
	let caNumber = null;
	let relatedItems = null;

	const rpnEntries = [];
	let messageFormat = null;
	const details = [];

	let currentSection = null;
	let inRpnTable = false;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, and boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('docId:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# Modulation') || line.startsWith('## Page') || line.startsWith('MMA Technical Standards') || line.startsWith('AMEI MIDI Committee') || line.startsWith('Confirmation of Approval')) {
			continue;
		}

		// Parse header fields
		if (line.startsWith('Date of issue:')) {
			// Handle "Date of issue: 3/02/99 Originated by: MMA" on one line
			const dateMatch = line.match(/^Date of issue:\s+(.+?)\s+Originated by:\s+(.+)$/);
			if (dateMatch) {
				dateOfIssue = dateMatch[1].trim();
				originatedBy = dateMatch[2].trim();
			} else {
				dateOfIssue = line.replace(/^Date of issue:\s*/, '').trim();
			}
			continue;
		}
		if (line.startsWith('Originated by:')) {
			originatedBy = line.replace(/^Originated by:\s*/, '').trim();
			continue;
		}
		if (line.startsWith('Reference TSBB')) {
			referenceItem = line.trim();
			continue;
		}
		if (line.startsWith('Title:')) {
			title = line.replace(/^Title:\s*/, '').trim();
			continue;
		}
		if (line.startsWith('CA#:')) {
			caNumber = line
				.replace(/^CA#:\s*/, '')
				.replace(/_$/, '')
				.trim();
			continue;
		}
		if (line.startsWith('Related item')) {
			relatedItems = line.replace(/^Related item.*?:\s*/, '').trim();
			continue;
		}

		// Detect sections
		if (line.startsWith('Abstract:')) {
			currentSection = 'abstract';
			const rest = line.replace(/^Abstract:\s*/, '').trim();
			if (rest) {
				abstract = rest;
			}
			continue;
		}
		if (line.startsWith('Background:')) {
			currentSection = 'background';
			const rest = line.replace(/^Background:\s*/, '').trim();
			if (rest) {
				background = rest;
			}
			continue;
		}
		if (line.startsWith('Details:')) {
			currentSection = 'details';
			continue;
		}
		if (line.startsWith('[REGISTERED PARAMETER NUMBER]')) {
			currentSection = 'rpn';
			inRpnTable = false;
			continue;
		}

		// Parse RPN table
		if (currentSection === 'rpn') {
			// Check for table header
			if (RPN_TABLE_HEADER_REGEX.test(line)) {
				inRpnTable = true;
				continue;
			}

			// Check for separator line
			if (line.startsWith('===') || line.startsWith('---')) {
				continue;
			}

			// Parse RPN entry
			if (inRpnTable) {
				const entryMatch = line.match(RPN_ENTRY_REGEX);
				if (entryMatch) {
					rpnEntries.push({
						lsb: entryMatch[1].toUpperCase(),
						msb: entryMatch[2].toUpperCase(),
						function: entryMatch[3].trim()
					});
					continue;
				}
			}

			// Parse message format (embedded in "Message Format: Bn 64 05 65 00 where n is...")
			if (line.startsWith('Message Format:')) {
				const formatPart = line.replace(/^Message Format:\s*/, '').trim();
				const formatMatch = formatPart.match(/^(Bn\s+\d+\s+[0-9A-Fa-f]{2}\s+\d+\s+[0-9A-Fa-f]{2})/);
				if (formatMatch) {
					messageFormat = {
						raw: formatMatch[1],
						status_byte: 'Bn',
						bytes: formatMatch[1].split(/\s+/),
						description: formatPart
					};
				}
				continue;
			}

			// Accumulate remaining details and their continuation lines
			if (line.startsWith('This message must be followed') || line.startsWith('Neither default') || line.startsWith('The destination parameter')) {
				details.push(line);
				continue;
			}

			// Continuation lines for previous detail entry
			if (details.length > 0 && !line.startsWith('Message Format:') && !RPN_ENTRY_REGEX.test(line) && !RPN_TABLE_HEADER_REGEX.test(line) && !line.startsWith('===') && !line.startsWith('MODULATION')) {
				details[details.length - 1] += ' ' + line;
				continue;
			}
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

		// Accumulate details section
		if (currentSection === 'details') {
			details.push(line);
			continue;
		}
	}

	const result = {
		metadata: {
			title: title || 'Modulation Depth Range RPN',
			doc_id: caNumber || 'CA-026',
			protocol: 'midi1',
			source: path.basename(markdownPath),
			date_of_issue: dateOfIssue,
			originated_by: originatedBy,
			reference: referenceItem,
			related_items: relatedItems
		},
		abstract: abstract.trim(),
		background: background.trim(),
		rpn_entries: rpnEntries,
		message_format: messageFormat,
		details: details,
		summary: {
			rpn_entry_count: rpnEntries.length,
			has_message_format: messageFormat !== null,
			detail_count: details.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca26-modulation-depth-range.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
