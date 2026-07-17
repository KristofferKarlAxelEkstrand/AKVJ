import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI Clip File Specification (M2-116-U)
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidiClipFile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {},
		version_history: [],
		definitions: [],
		conformance_words: [],
		normative_references: [],
		smf_types: [],
		file_header: {},
		file_structure: [],
		dctpq: {},
		dcs: {},
		max_times_table: [],
		clip_configuration_header: {},
		clip_sequence_data: {},
		smf1_to_smf2_concordance: {},
		useful_midi_messages: [],
		summary: {}
	};

	const PAGE_HEADER_RE = /^## Page \d+$/;

	// Parse frontmatter
	parseFrontmatter(content, result);

	let currentSection = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(PAGE_HEADER_RE)) {
			continue;
		}

		// Skip TOC entries (lines with lots of dots)
		if (trimmedLine.match(/\.{5,}/)) {
			continue;
		}

		// Detect section boundaries
		if (trimmedLine.match(/^Table 1 Version History/i)) {
			currentSection = 'version_history';
			continue;
		}
		if (trimmedLine.match(/^1\.4\.1\s+Definitions/i)) {
			currentSection = 'definitions';
			continue;
		}
		if (trimmedLine.match(/^Table 2 Words Relating/i)) {
			currentSection = 'conformance_required';
			continue;
		}
		if (trimmedLine.match(/^Table 3 Words Not Relating/i)) {
			currentSection = 'conformance_descriptive';
			continue;
		}
		if (trimmedLine.match(/^1\.3\.1\s+Normative References/i)) {
			currentSection = 'normative_references';
			continue;
		}
		if (trimmedLine.match(/^Table 5 MIDI Clip File Header/i)) {
			currentSection = 'file_header_table';
			continue;
		}
		if (trimmedLine.match(/^Table 4 Maximum Times/i)) {
			currentSection = 'max_times_table';
			continue;
		}
		if (trimmedLine.match(/^1\.2\s+Background/i)) {
			currentSection = 'smf_types';
			continue;
		}
		if (trimmedLine.match(/^2\s+MIDI Clip File and Other/i)) {
			currentSection = 'smf_types_section2';
			continue;
		}
		if (trimmedLine.match(/^4\s+File Format/i)) {
			currentSection = 'file_format';
			continue;
		}
		if (trimmedLine.match(/^3\.2\.1\s+Delta Clockstamp Ticks/i)) {
			currentSection = 'dctpq';
			continue;
		}
		if (trimmedLine.match(/^3\.2\.2\s+Delta Clockstamp \(DCS\)/i)) {
			currentSection = 'dcs';
			continue;
		}
		if (trimmedLine.match(/^6\s+Clip Configuration Header/i)) {
			currentSection = 'clip_config';
			continue;
		}
		if (trimmedLine.match(/^7\s+Clip Sequence Data/i)) {
			currentSection = 'clip_sequence';
			continue;
		}
		if (trimmedLine.match(/^Appendix A.*SMF1 to SMF2/i)) {
			currentSection = 'smf1_to_smf2';
			continue;
		}
		if (trimmedLine.match(/^Appendix B.*MIDI Messages Useful/i)) {
			currentSection = 'useful_messages';
			continue;
		}

		// Dispatch to section handlers
		switch (currentSection) {
			case 'version_history':
				handleVersionHistory(result, trimmedLine);
				break;
			case 'definitions':
				handleDefinitions(result, trimmedLine);
				break;
			case 'conformance_required':
				handleConformanceWords(result, trimmedLine, 'required');
				break;
			case 'conformance_descriptive':
				handleConformanceWords(result, trimmedLine, 'descriptive');
				break;
			case 'normative_references':
				handleNormativeReferences(result, trimmedLine);
				break;
			case 'smf_types':
			case 'smf_types_section2':
				handleSmfTypes(result, trimmedLine);
				break;
			case 'file_header_table':
				handleFileHeaderTable(result, trimmedLine);
				break;
			case 'max_times_table':
				handleMaxTimesTable(result, trimmedLine);
				break;
			case 'file_format':
				handleFileFormat(result, trimmedLine);
				break;
			case 'dctpq':
				handleDctpq(result, trimmedLine);
				break;
			case 'dcs':
				handleDcs(result, trimmedLine);
				break;
			case 'clip_config':
				handleClipConfig(result, trimmedLine);
				break;
			case 'clip_sequence':
				handleClipSequence(result, trimmedLine);
				break;
			case 'useful_messages':
				handleUsefulMessages(result, trimmedLine);
				break;
			default:
				break;
		}
	}

	result.summary = {
		version_history_count: result.version_history.length,
		definition_count: result.definitions.length,
		conformance_word_count: result.conformance_words.length,
		normative_reference_count: result.normative_references.length,
		smf_type_count: result.smf_types.length,
		file_header_byte_count: result.file_header.bytes?.length || 0,
		file_structure_section_count: result.file_structure.length,
		max_times_table_rows: result.max_times_table.length,
		useful_midi_message_count: result.useful_midi_messages.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi-clip-file.json'), JSON.stringify(result, null, 2), 'utf-8');
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
			} else if (key === 'version') {
				result.metadata.version = value;
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

function handleVersionHistory(result, line) {
	// "June 15, 2023 \t1.0 \tInitial release"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 3 && parts[0].match(/\w+ \d+, \d{4}/)) {
		result.version_history.push({
			date: parts[0],
			version: parts[1],
			changes: parts.slice(2).join(' ')
		});
	}
}

function handleDefinitions(result, line) {
	// "AMEI: Association of Musical Electronics Industry..."
	// "MUID (MIDI Unique Identifier): A 28-bit random number..."
	const defMatch = line.match(/^([A-Z][A-Za-z\s/()]+?):\s+(.+)$/);
	if (defMatch && defMatch[1].length < 60) {
		// Avoid matching section numbers or sentences
		if (!defMatch[1].match(/^\d/) && !defMatch[1].match(/^Table|^Figure|^Appendix/i)) {
			result.definitions.push({
				term: defMatch[1].trim(),
				definition: defMatch[2].trim()
			});
		}
	}
}

function handleConformanceWords(result, line, category) {
	// "shall \tStatements of requirement \tMandatory"
	// "should \tStatements of recommendation \tRecommended but not mandatory"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^(shall|should|may|must|will|can|might)$/)) {
		result.conformance_words.push({
			word: parts[0],
			reserved_for: parts[1] || '',
			relation: parts.slice(2).join(' ') || '',
			category
		});
	}
}

function handleNormativeReferences(result, line) {
	// "[MA01] \tComplete MIDI 1.0 Detailed Specification..."
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^\[MA\d+\]$/)) {
		result.normative_references.push({
			reference: parts[0],
			description: parts.slice(1).join(' ')
		});
	}
}

function handleSmfTypes(result, line) {
	// "1. Type 0: These files consist of one track..."
	// "2. Type 1: A sequence is saved as separate tracks..."
	// "3. Type 2: Same as Type 1..."
	// "1. MIDI Clip File: The MIDI Clip File is a file format..."
	// "2. MIDI Container File: The MIDI Clip File has a complementary..."
	const typeMatch = line.match(/^(\d+)\.\s+(.+?):\s+(.+)$/);
	if (typeMatch) {
		result.smf_types.push({
			number: parseInt(typeMatch[1], 10),
			name: typeMatch[2].trim(),
			description: typeMatch[3].trim()
		});
	}
}

function handleFileHeaderTable(result, line) {
	if (!result.file_header.bytes) {
		result.file_header = { format: 'SMF2CLIP', byte_count: 8, bytes: [] };
	}

	// "Value \t0x53 \t0x4D \t0x46 \t0x32 \t0x43 \t0x4C \t0x49 \t0x50"
	// "Text \tS \tM \tF \t2 \tC \tL \tI \tP"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && (parts[0] === 'Value' || parts[0] === 'Text')) {
		if (parts[0] === 'Value') {
			for (let i = 1; i < parts.length; i++) {
				result.file_header.bytes.push({ byte_index: i, hex: parts[i] });
			}
		} else if (parts[0] === 'Text') {
			for (let i = 1; i < parts.length; i++) {
				if (result.file_header.bytes[i - 1]) {
					result.file_header.bytes[i - 1].text = parts[i];
				}
			}
		}
	}
}

function handleMaxTimesTable(result, line) {
	// Header row: "1 \t24 \t96 \t480 \t960 \t65,535"
	// Data rows: "1048575 \t43691 \t10923 \t2185 \t1092 \t16"
	// "20 \t3s 0ms \t873h 49m \t..."
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2) {
		// Skip label rows and section headers
		if (parts[0].match(/^Max Number|^Beats Per|^Seconds Per|^Per Beat/i)) {
			return;
		}
		// Skip section headers like "3.3 Messages Replace..."
		if (parts[0].match(/^\d\.\d/) && parts.length === 2) {
			return;
		}
		result.max_times_table.push({ row: parts });
	}
}

function handleFileFormat(result, line) {
	// "1. File Header – The first 8 bytes in the file."
	// "2. Clip Configuration Header – Data used to set up..."
	// "3. Clip Sequence Data – A set of MIDI Messages..."
	const sectionMatch = line.match(/^(\d+)\.\s+(.+?)\s+[–-]\s+(.+)$/);
	if (sectionMatch) {
		result.file_structure.push({
			number: parseInt(sectionMatch[1], 10),
			name: sectionMatch[2].trim(),
			description: sectionMatch[3].trim()
		});
	}
}

function handleDctpq(result, line) {
	// Accumulate description text for DCTPQ
	if (!result.dctpq.description) {
		result.dctpq = { name: 'Delta Clockstamp Ticks Per Quarter Note (DCTPQ)', description: '' };
	}
	if (line.match(/^3\.2\.1|^3\.2\s|^3\.3\s|^4\s|^5\s|^6\s/i)) {
		return;
	}
	if (line && !line.match(/^Figure|^Table/i)) {
		const current = result.dctpq.description;
		result.dctpq.description = current ? current + ' ' + line : line;
	}
}

function handleDcs(result, line) {
	if (!result.dcs.description) {
		result.dcs = { name: 'Delta Clockstamp (DCS): Ticks Since Last Event', description: '' };
	}
	if (line.match(/^3\.2\.2|^3\.3\s|^4\s|^5\s|^6\s/i)) {
		return;
	}
	if (line && !line.match(/^Figure|^Table/i)) {
		const current = result.dcs.description;
		result.dcs.description = current ? current + ' ' + line : line;
	}
}

function handleClipConfig(result, line) {
	if (!result.clip_configuration_header.description) {
		result.clip_configuration_header = {
			name: 'Clip Configuration Header',
			sections: [],
			description: ''
		};
	}

	// Sub-sections: "6.1 Configuration Timing...", "6.2 Receiver Configuration..."
	const subMatch = line.match(/^6\.\d+(?:\.\d+)?\s+(.+)$/);
	if (subMatch) {
		result.clip_configuration_header.sections.push({
			name: subMatch[1].trim(),
			description: ''
		});
		return;
	}

	// Accumulate description text
	if (line && !line.match(/^Figure|^Table|^6\.\d/i)) {
		const lastSection = result.clip_configuration_header.sections[result.clip_configuration_header.sections.length - 1];
		if (lastSection) {
			lastSection.description = lastSection.description ? lastSection.description + ' ' + line : line;
		} else {
			result.clip_configuration_header.description = result.clip_configuration_header.description ? result.clip_configuration_header.description + ' ' + line : line;
		}
	}
}

function handleClipSequence(result, line) {
	if (!result.clip_sequence_data.description) {
		result.clip_sequence_data = {
			name: 'Clip Sequence Data',
			sections: [],
			description: ''
		};
	}

	// Sub-sections: "7.1 Start of Clip...", "7.2 MIDI Data...", "7.3 End of Clip..."
	const subMatch = line.match(/^7\.\d+(?:\.\d+)?\s+(.+)$/);
	if (subMatch) {
		result.clip_sequence_data.sections.push({
			name: subMatch[1].trim(),
			description: ''
		});
		return;
	}

	if (line && !line.match(/^Figure|^Table|^7\.\d/i)) {
		const lastSection = result.clip_sequence_data.sections[result.clip_sequence_data.sections.length - 1];
		if (lastSection) {
			lastSection.description = lastSection.description ? lastSection.description + ' ' + line : line;
		} else {
			result.clip_sequence_data.description = result.clip_sequence_data.description ? result.clip_sequence_data.description + ' ' + line : line;
		}
	}
}

function handleUsefulMessages(result, line) {
	// Bullet list: "• Set Tempo", "• Set Time Signature", etc.
	const match = line.match(/^[•·]\s*(.+)$/);
	if (match) {
		result.useful_midi_messages.push(match[1].trim());
	}
}
