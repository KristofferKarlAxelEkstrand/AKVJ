import fs from 'node:fs/promises';
import path from 'node:path';

export async function transformDls1(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const connectionBlocks = [];
	const articulatorDefaults = [];
	const exampleParameters = [];
	const riffDefinitions = [];
	const dlsSystemMessages = [];
	const connectionSources = [];
	const connectionDestinations = [];
	const connectionTransforms = [];
	const infoChunkIds = [];
	const parameterUnits = [];

	let currentSection = null;

	// State flags for parsing different sections
	let inConnectionTable = false;
	let inDefaultsTable = false;
	let inExampleTable = false;
	let inRiffDefs = false;
	let inSysExMessages = false;
	let inConnConstants = false;
	let inInfoChunks = false;
	let inParamUnits = false;
	let sysExMsgBuffer = null;

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		const line = raw.trim();

		if (!line || line.startsWith('## Page') || line.startsWith('LEVEL 1') || line.startsWith('PAGE ')) {
			continue;
		}

		// --- Table 1: Connection Block Table ---
		if (line.includes('Cid#') && line.includes('usSource') && line.includes('usControl')) {
			inConnectionTable = true;
			continue;
		}
		if (line === 'Table 1 - Connection Block Table') {
			inConnectionTable = false;
			continue;
		}
		if (inConnectionTable) {
			// Section headers
			if (line === 'LFO Section' || line === 'EG1 Section' || line === 'EG2 Section' || line === 'Miscellaneous Section') {
				currentSection = line;
				continue;
			}
			if (line === 'Connections inferred by DLS1 Architecture') {
				currentSection = 'Inferred';
				continue;
			}
			// Parse connection block rows: "1* \t LFO Frequency \t SRC_NONE \t SRC_NONE \t DST_LFO_FREQ \t TRN_NONE"
			const match = line.match(/^(\d+\*?)\s+(.+?)\s+(SRC_\S+)\s+(SRC_\S+|SRC_NONE)\s+(DST_\S+)\s+(TRN_\S+)$/);
			if (match) {
				connectionBlocks.push({
					cid: match[1],
					section: currentSection,
					articulator_name: match[2].trim(),
					source: match[3],
					control: match[4],
					destination: match[5],
					transform: match[6]
				});
				continue;
			}
		}

		// --- Table 2: Default/Min/Max/Unit Values ---
		if (line === 'Articulator \tDefault Value \tMin Value \tMax Value \tUnits' || (line.includes('Default Value') && line.includes('Min Value') && line.includes('Max Value') && line.includes('Units'))) {
			inDefaultsTable = true;
			continue;
		}
		if (line === 'Table 2 - DLS Level 1 Default, Minimum, Maximum and Unit Values for Connection Blocks') {
			inDefaultsTable = false;
			continue;
		}
		if (inDefaultsTable) {
			// Section headers
			if (line === 'LFO Section' || line === 'EG1 Section' || line === 'EG2 Section' || line === 'Miscellaneous Section') {
				currentSection = line;
				continue;
			}
			// Parse rows: "LFO Frequency \t5 Hz \t0.1 Hz \t10 Hz \t32 bit pitch cents"
			const parts = line.split('\t');
			if (parts.length >= 5 && !line.startsWith('Articulator')) {
				articulatorDefaults.push({
					articulator: parts[0].trim(),
					section: currentSection,
					default_value: parts[1].trim(),
					min_value: parts[2].trim(),
					max_value: parts[3].trim(),
					units: parts[4].trim()
				});
				continue;
			}
		}

		// --- Table 3: Example DLS Parameters ---
		if (line === 'Control Events') {
			inExampleTable = true;
			continue;
		}
		if (line === 'Table 3 - Example DLS Parameter Table') {
			inExampleTable = false;
			continue;
		}
		if (inExampleTable) {
			const parts = line.split('\t');
			if (parts.length >= 2) {
				exampleParameters.push({
					parameter: parts[0].trim(),
					value: parts[1].trim()
				});
				continue;
			}
		}

		// --- Table 4: RIFF Definitions ---
		if (line === 'Chunk \tDefinition') {
			inRiffDefs = true;
			continue;
		}
		if (line === 'Table 4 - RIFF Definitions') {
			inRiffDefs = false;
			continue;
		}
		if (inRiffDefs) {
			const parts = line.split('\t');
			if (parts.length >= 2 && parts[0].startsWith('<')) {
				riffDefinitions.push({
					chunk: parts[0].trim(),
					definition: parts.slice(1).join(' ').trim()
				});
				continue;
			}
		}

		// --- DLS-1 System Messages (SysEx) ---
		if (line === 'DLS-1 System Messages') {
			inSysExMessages = true;
			continue;
		}
		if (inSysExMessages) {
			if (line.startsWith('Chapter 2:') || line.startsWith('Purpose')) {
				inSysExMessages = false;
				continue;
			}
			// Message header lines like "Turn DLS Level 1 On:"
			if (line.endsWith(':') && (line.includes('DLS') || line.includes('Voice Allocation'))) {
				// Flush previous message
				if (sysExMsgBuffer && sysExMsgBuffer.message) {
					dlsSystemMessages.push(sysExMsgBuffer);
				}
				sysExMsgBuffer = {
					name: line.replace(/:$/, ''),
					message: '',
					bytes: []
				};
				continue;
			}
			// Message format line: "F0 7E < device ID > 0A 01 F7"
			if (sysExMsgBuffer && !sysExMsgBuffer.message && line.match(/^F0\s+7E\s+/)) {
				sysExMsgBuffer.message = line;
				continue;
			}
			// Byte description lines
			if (sysExMsgBuffer && line.match(/^(F0 7E|< device|0A|0[1-4]|F7)\s/)) {
				const parts = line.split('\t');
				if (parts.length >= 2) {
					sysExMsgBuffer.bytes.push({
						byte: parts[0].trim(),
						description: parts[1].trim()
					});
					continue;
				}
			}
			// End of a SysEx message (blank line or new section)
			if (sysExMsgBuffer && sysExMsgBuffer.message) {
				if (line === '' || !line.match(/^(F0|< |0A|0[1-4]|F7)/)) {
					dlsSystemMessages.push(sysExMsgBuffer);
					sysExMsgBuffer = null;
					continue;
				}
			}
		}

		// --- Connection Constants (from header file / list section) ---
		if (line === 'List of defined Sources, Controls, Destinations, and Transforms') {
			inConnConstants = true;
			continue;
		}
		if (inConnConstants) {
			if (line.startsWith('<wlnk-ck>')) {
				inConnConstants = false;
				continue;
			}
			// Category headers
			if (line === 'Generic Sources' || line === 'MIDI Sources') {
				currentSection = 'sources';
				continue;
			}
			if (line === 'Generic Destinations' || line === 'LFO Destinations' || line === 'EG1 Destinations' || line === 'EG2 Destinations') {
				currentSection = 'destinations';
				continue;
			}
			if (line === 'Transforms') {
				currentSection = 'transforms';
				continue;
			}
			// Parse constant definitions: "CONN_SRC_NONE \tNo Source"
			if (currentSection === 'sources') {
				const match = line.match(/^(CONN_SRC_\S+)\s+(.+)$/);
				if (match && !match[2].startsWith('0x')) {
					connectionSources.push({ name: match[1], description: match[2].trim() });
					continue;
				}
			}
			if (currentSection === 'destinations') {
				const match = line.match(/^(CONN_DST_\S+)\s+(.+)$/);
				if (match && !match[2].startsWith('0x')) {
					connectionDestinations.push({ name: match[1], description: match[2].trim() });
					continue;
				}
			}
			if (currentSection === 'transforms') {
				const match = line.match(/^(CONN_TRN_\S+)\s+(.+)$/);
				if (match && !match[2].startsWith('0x')) {
					connectionTransforms.push({ name: match[1], description: match[2].trim() });
					continue;
				}
			}
		}

		// --- INFO List Chunk IDs ---
		if (line.includes('Chunk ID') && line.includes('Description') && !line.startsWith('proprietary')) {
			inInfoChunks = true;
			continue;
		}
		if (inInfoChunks) {
			if (line.startsWith('Coding Requirements') || line.startsWith('Coding ')) {
				inInfoChunks = false;
				continue;
			}
			const parts = line.split('\t');
			if (parts.length >= 2 && parts[0].trim().match(/^[A-Z]{4}$/)) {
				infoChunkIds.push({
					chunk_id: parts[0].trim(),
					description: parts.slice(1).join(' ').trim()
				});
				continue;
			}
		}

		// --- Parameter Units (Appendix A) ---
		if (line === 'Appendix A  Parameter Units' || (line.includes('Appendix') && line.includes('Parameter Units'))) {
			inParamUnits = true;
			continue;
		}
		if (inParamUnits) {
			if (line.startsWith('Appendix B') || line.includes('Transform and Pan')) {
				inParamUnits = false;
				continue;
			}
			// Unit type headers: "32-bit Time Cents", "32-bit Absolute Pitch Cents", etc.
			const unitMatch = line.match(/^(32-bit Time Cents|32-bit Absolute Pitch Cents|16-bit Relative Pitch Cents|32-bit Relative Gain|0\.1 % units)$/);
			if (unitMatch) {
				parameterUnits.push({
					name: unitMatch[1],
					formulas: []
				});
				continue;
			}
			// Formula lines: "tc = log2(time[secs]) * 1200*65536"
			if (parameterUnits.length > 0 && line.match(/^[a-z]/)) {
				parameterUnits[parameterUnits.length - 1].formulas.push(line);
				continue;
			}
		}
	}

	// Flush any remaining SysEx message
	if (sysExMsgBuffer && sysExMsgBuffer.message) {
		dlsSystemMessages.push(sysExMsgBuffer);
	}

	const result = {
		metadata: {
			title: 'Downloadable Sounds Level 1 Specification',
			doc_id: 'DLS-1',
			protocol: 'midi1',
			version: '1.1b',
			date: '2004-09'
		},
		connection_blocks: connectionBlocks,
		articulator_defaults: articulatorDefaults,
		example_parameters: exampleParameters,
		riff_definitions: riffDefinitions,
		dls_system_messages: dlsSystemMessages,
		connection_sources: connectionSources,
		connection_destinations: connectionDestinations,
		connection_transforms: connectionTransforms,
		info_chunk_ids: infoChunkIds,
		parameter_units: parameterUnits,
		summary: {
			connection_block_count: connectionBlocks.length,
			articulator_default_count: articulatorDefaults.length,
			example_parameter_count: exampleParameters.length,
			riff_definition_count: riffDefinitions.length,
			dls_system_message_count: dlsSystemMessages.length,
			connection_source_count: connectionSources.length,
			connection_destination_count: connectionDestinations.length,
			connection_transform_count: connectionTransforms.length,
			info_chunk_id_count: infoChunkIds.length,
			parameter_unit_count: parameterUnits.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'dls1.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
