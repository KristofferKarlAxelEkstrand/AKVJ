import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transformer for RFC 6295: RTP Payload Format for MIDI (RTP-MIDI)
 * Parses the 8644-line RFC markdown into structured JSON.
 *
 * Extractable sections:
 * - Packet format figures (bitfield layouts)
 * - Recovery journal channel chapters (Appendix A: P, C, M, W, N, E, T, A)
 * - Recovery journal system chapters (Appendix B: D, V, Q, F, X)
 * - Configuration parameters (Appendix C/D)
 * - IANA media type registrations (Section 11)
 * - ABNF parameter syntax definitions (Appendix D)
 */

/**
 * @param {string} markdownPath - Absolute path to the markdown file
 * @param {string} [outDir] - Optional output directory for JSON file
 * @returns {Promise<object>} The structured JSON result
 */
export async function transformRtpMidi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	// --- State variables ---
	let currentSection = null;
	let currentAbnfParam = null;

	// --- Output arrays ---
	const packetFigures = [];
	const channelChapters = [];
	const systemChapters = [];
	const configParameters = [];
	const mediaTypeRegistrations = [];
	const abnfDefinitions = [];

	// --- Helpers ---

	/**
	 * Parse a figure block (ASCII art bitfield diagram) into structured fields.
	 * @param {string[]} figureLines - Lines of the figure block
	 * @param {string} figureId - Figure identifier (e.g., "Figure 1")
	 * @param {string} title - Figure title
	 * @returns {object} Parsed figure object
	 */
	const parseFigureBlock = (figureLines, figureId, title) => {
		// Extract field names from the bitfield rows (lines with | separators)
		const fields = [];
		for (const fl of figureLines) {
			const pipeMatch = fl.match(/\|(.+)\|/);
			if (!pipeMatch) {
				continue;
			}
			const inner = pipeMatch[1];
			// Split on | to get individual field cells
			const cells = inner.split('|').map(c => c.trim());
			for (const cell of cells) {
				// Skip empty cells, separator-only cells, and dot continuations
				if (!cell || cell === '...' || cell === '....' || cell.match(/^\.+$/)) {
					continue;
				}
				// Extract field names (uppercase letters, hyphens, digits)
				const fieldNames = cell.match(/[A-Z][A-Z0-9-]*/g);
				if (fieldNames) {
					for (const fn of fieldNames) {
						if (fn.length >= 1 && !fields.includes(fn)) {
							fields.push(fn);
						}
					}
				}
			}
		}
		return {
			figure_id: figureId,
			title: title,
			fields: fields
		};
	};

	/**
	 * Parse a chapter definition from its heading line.
	 * @param {string} heading - The heading line (e.g., "A.2.  Chapter P: MIDI Program Change")
	 * @returns {object} Chapter skeleton
	 */
	const parseChapterHeading = (heading) => {
		const match = heading.match(/^([AB])\.(\d+)\.\s+Chapter\s+(\w):\s+(.+)/);
		if (match) {
			return {
				appendix: match[1],
				section_number: match[2],
				chapter_letter: match[3],
				name: match[4].trim(),
				figure_id: null,
				fields: [],
				size: null,
				description: ''
			};
		}
		return null;
	};

	void parseChapterHeading;

	// --- Main parsing loop ---

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		const line = raw.trim();

		// Skip empty lines, page headers, and TOC dot-leader lines
		if (!line || line.match(/^Lazzaro & Wawrzynek/) || line.match(/^RFC 6295/) || line.startsWith('## Page')) {
			continue;
		}
		// Skip TOC entries (lines with dot leaders)
		if (line.match(/\.\.+\s*\d+$/) && line.length > 40) {
			continue;
		}

		// --- Section 11: IANA Media Type Registrations ---
		if (line.match(/^11\.\d+\.\s+/) && line.includes('Media Type Registration') && !line.match(/\.\./)) {
			currentSection = 'iana';
			const subMatch = line.match(/^11\.\d+\.\s+(.+)/);
			mediaTypeRegistrations.push({
				section: line.match(/^11\.\d+/)[0],
				title: subMatch[1].trim(),
				media_type: null,
				subtype: null,
				required_parameters: [],
				optional_parameters: []
			});
			continue;
		}

		if (currentSection === 'iana') {
			const lastReg = mediaTypeRegistrations[mediaTypeRegistrations.length - 1];
			if (line === 'Media type name:') {
				// Next non-empty line is the value
				for (let j = i + 1; j < lines.length; j++) {
					const valLine = lines[j].trim();
					if (valLine) {
						lastReg.media_type = valLine;
						i = j;
						break;
					}
				}
				continue;
			}
			if (line === 'Subtype name:') {
				for (let j = i + 1; j < lines.length; j++) {
					const valLine = lines[j].trim();
					if (valLine) {
						lastReg.subtype = valLine;
						i = j;
						break;
					}
				}
				continue;
			}
			if (line === 'Required parameters:') {
				currentSection = 'iana_required';
				continue;
			}
			if (line === 'Optional parameters:') {
				currentSection = 'iana_optional';
				continue;
			}
			// End of IANA section when we hit a new top-level section
			if (line.match(/^11\.\d+\.\d+\./) || line.match(/^12\./) || line.match(/^Appendix/)) {
				currentSection = null;
			}
		}

		if (currentSection === 'iana_required') {
			const lastReg = mediaTypeRegistrations[mediaTypeRegistrations.length - 1];
			// Parameters look like "param_name: See ..."
			const paramMatch = line.match(/^(\w+):\s+(.+)/);
			if (paramMatch) {
				lastReg.required_parameters.push({
					name: paramMatch[1],
					description: paramMatch[2].trim()
				});
				continue;
			}
			if (line === 'Optional parameters:') {
				currentSection = 'iana_optional';
				continue;
			}
			if (line.match(/^Encoding considerations/) || line.match(/^Restrictions on usage/) || line.match(/^Security considerations/)) {
				currentSection = 'iana';
				continue;
			}
		}

		if (currentSection === 'iana_optional') {
			const lastReg = mediaTypeRegistrations[mediaTypeRegistrations.length - 1];
			// Parameters look like "param_name: See ..."
			const paramMatch = line.match(/^(\w+):\s+(.+)/);
			if (paramMatch) {
				lastReg.optional_parameters.push({
					name: paramMatch[1],
					description: paramMatch[2].trim()
				});
				continue;
			}
			if (line === 'Extensible parameters:' || line === 'Non-extensible parameters:') {
				continue;
			}
			if (line.match(/^Encoding considerations/) || line.match(/^Restrictions on usage/) || line.match(/^Security considerations/)) {
				currentSection = 'iana';
				continue;
			}
		}

		// --- Appendix A/B: Recovery Journal Chapters ---
		const chapterMatch = line.match(/^([AB])\.(\d+)\.\s+(?:System\s+)?Chapter\s+(\w):\s+(.+)/);
		// Skip TOC entries (they have dot leaders)
		if (chapterMatch && chapterMatch[4].match(/\.\./)) {
			continue;
		}
		if (chapterMatch) {
			currentSection = 'chapter';
			const chapter = {
				appendix: chapterMatch[1],
				section_number: chapterMatch[2],
				chapter_letter: chapterMatch[3],
				name: chapterMatch[4].trim(),
				figure_id: null,
				fields: [],
				size: null,
				description: ''
			};
			if (chapter.appendix === 'A') {
				channelChapters.push(chapter);
			} else {
				systemChapters.push(chapter);
			}
			continue;
		}

		if (currentSection === 'chapter') {
			const lastChapter = channelChapters.length > 0 ? channelChapters[channelChapters.length - 1] : systemChapters[systemChapters.length - 1];
			// Check if we've moved to a new section
			if (line.match(/^([AB])\.\d+\.\d+\./) || line.match(/^Appendix [A-Z]\./) || line.match(/^[A-Z]\.\d+\.\s+Chapter/)) {
				currentSection = null;
				// Fall through to re-process this line
			} else {
				// Capture figure reference
				const figMatch = line.match(/Figure\s+([A-B]\.\d+\.\d+|\d+)\s+--\s+(.+)/);
				if (figMatch) {
					lastChapter.figure_id = `Figure ${figMatch[1]}`;
					continue;
				}
				// Capture size info
				const sizeMatch = line.match(/fixed size of\s+(\d+)\s+bits/);
				if (sizeMatch) {
					lastChapter.size = `${sizeMatch[1]} bits`;
					continue;
				}
				const octetSizeMatch = line.match(/(\d+)-octet header/);
				if (octetSizeMatch) {
					lastChapter.size = `${octetSizeMatch[1]}-octet header`;
					continue;
				}
				// Capture field names from figure blocks (lines with | separators)
				const pipeMatch = line.match(/\|(.+)\|/);
				if (pipeMatch) {
					const inner = pipeMatch[1];
					const cells = inner.split('|').map(c => c.trim());
					for (const cell of cells) {
						if (!cell || cell === '...' || cell === '....' || cell.match(/^\.+$/)) {
							continue;
						}
						const fieldNames = cell.match(/[A-Z][A-Z0-9-]*/g);
						if (fieldNames) {
							for (const fn of fieldNames) {
								if (fn.length >= 1 && !lastChapter.fields.includes(fn)) {
									lastChapter.fields.push(fn);
								}
							}
						}
					}
					continue;
				}
				// Skip page headers and figure labels
				if (line.match(/^Lazzaro/) || line.match(/^RFC 6295/) || line.match(/^Figure/) || line.match(/^\s*0\s+1\s+2\s+3/)) {
					continue;
				}
				// Skip ASCII art separator lines
				if (line.match(/^[+-]+$/)) {
					continue;
				}
				// Skip column number lines
				if (line.match(/^\s*\d\s+\d\s+\d/)) {
					continue;
				}
				continue;
			}
		}

		// --- Figures (general packet format figures) ---
		const figureLabelMatch = line.match(/^Figure\s+(\d+)\s+--\s+(.+)/);
		if (figureLabelMatch && !line.match(/^Figure\s+[AB]\./)) {
			// Look backwards for the ASCII art block
			const figureLines = [];
			for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
				const backLine = lines[j].trim();
				if (backLine.match(/^[+-]+$/) || backLine.match(/\|.*\|/)) {
					figureLines.unshift(backLine);
				} else if (backLine.match(/^\s*\d/) && !backLine.match(/\|/)) {
					continue;
				} else {
					break;
				}
			}
			packetFigures.push(parseFigureBlock(figureLines, `Figure ${figureLabelMatch[1]}`, figureLabelMatch[2].trim()));
			continue;
		}

		// --- Appendix D: ABNF Parameter Syntax ---
		if (line === 'Appendix D.  Parameter Syntax Definitions') {
			currentSection = 'abnf';
			continue;
		}

		if (currentSection === 'abnf') {
			// End of ABNF block
			if (line.match(/^Appendix E\./)) {
				currentSection = null;
				continue;
			}

			// ABNF parameter definitions
			// "param-assign =/  ("param_name=" ...)"
			const abnfParamMatch = line.match(/param-assign\s*=\/?\s*"([a-z_]+)="(.+)/);
			if (abnfParamMatch) {
				const paramName = abnfParamMatch[1];
				const syntaxRest = abnfParamMatch[2].trim();
				// Check if this is a continuation of an existing parameter
				const existing = abnfDefinitions.find(d => d.parameter === paramName);
				if (existing) {
					existing.syntax += ' ' + syntaxRest;
				} else {
					abnfDefinitions.push({
						parameter: paramName,
						syntax: syntaxRest,
						section_ref: currentAbnfParam
					});
				}
				continue;
			}

			// Section reference comments
			// "; Parameters defined in Appendix C.1"
			const refMatch = line.match(/;\s*Parameters defined in (Appendix [A-Z]\.\d+)/);
			if (refMatch) {
				currentAbnfParam = refMatch[1];
				continue;
			}

			// Other ABNF definitions (command-type, chapter-list, etc.)
			const otherAbnfMatch = line.match(/^([a-z][a-z-]+)\s*=\s*\/?\s*(.+)/);
			if (otherAbnfMatch && !line.startsWith('param-assign')) {
				const defName = otherAbnfMatch[1];
				const defSyntax = otherAbnfMatch[2].trim();
				const existing = abnfDefinitions.find(d => d.parameter === defName);
				if (existing) {
					existing.syntax += ' ' + defSyntax;
				} else {
					abnfDefinitions.push({
						parameter: defName,
						syntax: defSyntax,
						section_ref: currentAbnfParam
					});
				}
				continue;
			}
		}

		// --- Appendix C: Configuration Parameters ---
		// Extract parameter definitions from the prose
		if (line.match(/^C\.\d+\.\s+/)) {
			const sectionMatch = line.match(/^C\.\d+\.\s+(.+)/);
			if (sectionMatch) {
				currentSection = 'config';
			}
			continue;
		}

		if (currentSection === 'config' && line.match(/^C\.\d+\.\s+/) === null) {
			// Look for parameter definitions in the text
			// "o  param_name.  Description..."
			const paramDefMatch = line.match(/^o\s+([a-z_]+)\.\s+(.+)/);
			if (paramDefMatch) {
				configParameters.push({
					name: paramDefMatch[1],
					description: paramDefMatch[2].trim(),
					allowed_values: []
				});
				continue;
			}
			// "The param_name parameter" pattern
			const paramRefMatch = line.match(/The\s+([a-z_]+)\s+parameter/);
			if (paramRefMatch && !configParameters.find(p => p.name === paramRefMatch[1])) {
				configParameters.push({
					name: paramRefMatch[1],
					description: '',
					allowed_values: []
				});
				continue;
			}
		}

		// End of config section
		if (currentSection === 'config' && (line.match(/^Appendix [A-Z]\./) || line.match(/^\d+\./))) {
			currentSection = null;
		}
	}

	// --- Build result ---
	const result = {
		metadata: {
			title: 'RTP Payload Format for MIDI (RTP-MIDI)',
			doc_id: 'RFC6295',
			protocol: 'midi1',
			version: '6295',
			date: '2011-06',
			source: 'https://www.ietf.org/rfc/rfc6295.txt'
		},
		packet_figures: packetFigures,
		channel_chapters: channelChapters,
		system_chapters: systemChapters,
		configuration_parameters: configParameters,
		media_type_registrations: mediaTypeRegistrations,
		abnf_definitions: abnfDefinitions,
		summary: {
			packet_figure_count: packetFigures.length,
			channel_chapter_count: channelChapters.length,
			system_chapter_count: systemChapters.length,
			configuration_parameter_count: configParameters.length,
			media_type_registration_count: mediaTypeRegistrations.length,
			abnf_definition_count: abnfDefinitions.length
		}
	};

	// --- Write JSON output if outDir is provided ---
	if (outDir) {
		const outPath = path.join(outDir, 'rtp-midi.json');
		await fs.writeFile(outPath, JSON.stringify(result, null, '\t') + '\n', 'utf-8');
	}

	return result;
}
