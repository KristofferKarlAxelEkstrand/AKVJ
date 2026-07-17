import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the Standard MIDI Files 1.0 Specification (RP-001)
 * into a structured JSON object.
 *
 * The document has no formal tables but contains structured data:
 * - Variable-length quantity examples (hex number -> hex representation)
 * - File format definitions (0, 1, 2)
 * - Division formats (metrical vs SMPTE)
 * - Meta-event definitions (FF type, syntax, name, description)
 * - Example MIDI file events
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformSmf(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'Standard MIDI Files 1.0',
			doc_id: 'RP-001',
			protocol: 'midi1',
			version: '1.0',
			date: '1996-02',
			source: 'RP-001_v1-0_Standard_MIDI_Files_Specification_96-1-4.pdf'
		},
		variable_length_examples: [],
		file_formats: [],
		division_formats: [],
		meta_events: [],
		example_events: [],
		summary: {}
	};

	let pendingMetaEvent = null;
	let pendingDescription = [];
	let inExampleSection = false;

	const PAGE_HEADER_RE = /^## Page \d+$/;
	// Section headers look like "1 Introduction", "2 Sequences", or "Standard MIDI Files 1.0 \t5"
	// Limit to 1-2 digit numbers to avoid matching 8-digit hex data
	const SECTION_HEADER_RE = /^(?:Standard MIDI Files 1\.0\s+)?\d{1,2}(?:\.\d+)*\s+[A-Z]/;

	// Meta-event pattern: "FF 00 02 ssss \tSequence Number" or "FF 01 len text \tText Event"
	// The name must start with an uppercase letter to avoid matching continuation lines
	const META_EVENT_RE = /^(FF\s+[0-9A-Fa-f]{2}(?:\s+(?:[0-9A-Fa-f]{2}|len|ssss|text|data|nn\s+dd\s+cc\s+bb|sf\s+mi|hr\s+mn\s+se\s+fr\s+ff|tttttt))*)\s+([A-Z].+)$/;

	// Variable-length quantity: "00000000 \t00"
	const VARLEN_RE = /^([0-9A-F]{8})\s+([0-9A-F]{2}(?:\s[0-9A-F]{2})*)$/;

	// File format: "0 \tthe file contains a single multi-channel track"
	const FORMAT_RE = /^([012])\s+(the file .+)$/i;

	// Division format lines
	const DIVISION_TICKS_RE = /^0\s+ticks per quarter-note$/i;
	const DIVISION_SMPTE_RE = /^15\s+14\s+8\s+7\s+0$/i;

	// Example event: "0 \tFF 58 \t04 04 02 24 08 \t4 bytes: 4/4 time..."
	const EXAMPLE_EVENT_RE = /^(\d+)\s+([0-9A-Fa-f]{2}(?:\s[0-9A-Fa-f]{2})*)\s+(.+)$/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.match(PAGE_HEADER_RE)) {
			continue;
		}

		// Skip page numbers and section headers
		if (line.match(SECTION_HEADER_RE) && !line.match(/^FF\s/)) {
			// Flush pending meta-event
			flushPendingMetaEvent(result, pendingMetaEvent, pendingDescription);
			pendingMetaEvent = null;
			pendingDescription = [];
			continue;
		}

		// Detect example section start
		if (line.match(/^Delta Time.*Event.*Comment/i) || line.match(/^Delta-time\s+Event\s+Comments/i)) {
			inExampleSection = true;
			continue;
		}

		// Variable-length quantity examples
		const varlenMatch = line.match(VARLEN_RE);
		if (varlenMatch) {
			result.variable_length_examples.push({
				number_hex: varlenMatch[1],
				representation_hex: varlenMatch[2]
			});
			continue;
		}

		// File format definitions
		const formatMatch = line.match(FORMAT_RE);
		if (formatMatch) {
			result.file_formats.push({
				format: parseInt(formatMatch[1], 10),
				description: formatMatch[2].trim()
			});
			continue;
		}

		// Division format lines
		if (line.match(DIVISION_TICKS_RE)) {
			result.division_formats.push({
				type: 'metrical',
				description: 'ticks per quarter-note (bit 15 = 0, bits 14-0 = ticks)'
			});
			continue;
		}
		if (line.match(DIVISION_SMPTE_RE)) {
			result.division_formats.push({
				type: 'smpte',
				description: 'ticks per frame (bit 15 = 1, bits 14-8 = negative SMPTE format, bits 7-0 = ticks per frame)'
			});
			continue;
		}

		// Meta-event definitions
		const metaMatch = line.match(META_EVENT_RE);
		if (metaMatch) {
			// Flush previous pending meta-event
			flushPendingMetaEvent(result, pendingMetaEvent, pendingDescription);
			pendingMetaEvent = {
				syntax: metaMatch[1].trim(),
				name: metaMatch[2].trim()
			};
			pendingDescription = [];
			continue;
		}

		// Accumulate description lines for pending meta-event
		if (pendingMetaEvent && line && !line.match(PAGE_HEADER_RE)) {
			// Check if this line is a new meta-event or section content
			if (line.match(/^FF\s/) || line.match(/^sf\s*=/) || line.match(/^mi\s*=/)) {
				// sf/mi lines are part of Key Signature description
				if (line.match(/^sf\s*=/) || line.match(/^mi\s*=/)) {
					pendingDescription.push(line);
					continue;
				}
				// New meta-event - flush and reprocess
				flushPendingMetaEvent(result, pendingMetaEvent, pendingDescription);
				pendingMetaEvent = null;
				pendingDescription = [];
				// Try to match as meta-event
				const newMetaMatch = line.match(META_EVENT_RE);
				if (newMetaMatch) {
					pendingMetaEvent = {
						syntax: newMetaMatch[1].trim(),
						name: newMetaMatch[2].trim()
					};
					pendingDescription = [];
				}
				continue;
			}
			pendingDescription.push(line);
			continue;
		}

		// Example events (from the example MIDI file section)
		if (inExampleSection) {
			const exampleMatch = line.match(EXAMPLE_EVENT_RE);
			if (exampleMatch && !line.match(/^FF\s/) && !line.match(VARLEN_RE)) {
				result.example_events.push({
					delta_time: parseInt(exampleMatch[1], 10),
					event_code: exampleMatch[2],
					other_bytes: exampleMatch[3].trim()
				});
				continue;
			}
		}
	}

	// Flush final pending meta-event
	flushPendingMetaEvent(result, pendingMetaEvent, pendingDescription);

	result.summary = {
		variable_length_example_count: result.variable_length_examples.length,
		file_format_count: result.file_formats.length,
		division_format_count: result.division_formats.length,
		meta_event_count: result.meta_events.length,
		example_event_count: result.example_events.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'smf.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function flushPendingMetaEvent(result, metaEvent, description) {
	if (!metaEvent) {
		return;
	}
	// Extract the FF type byte from the syntax
	const syntaxParts = metaEvent.syntax.split(/\s+/);
	const ffType = syntaxParts.length >= 2 ? syntaxParts[1] : '';
	result.meta_events.push({
		ff_type: ffType,
		syntax: metaEvent.syntax,
		name: metaEvent.name,
		description: description.join(' ').trim()
	});
}
