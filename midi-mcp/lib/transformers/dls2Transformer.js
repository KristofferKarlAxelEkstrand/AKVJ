import fs from 'node:fs/promises';
import path from 'node:path';

const SECTION_HEADERS = new Set(['Modulator LFO', 'Vibrato LFO', 'Volume EG', 'Vol EG', 'Modulator EG', 'Key Number Generator', 'Filter', 'Gain', 'Output', 'Pitch']);

const normalizeIdentifier = value => value.replace(/_\s+/g, '_').replace(/\s+/g, ' ').trim();

const parseRoute = (line, section, pendingName) => {
	const normalizedLine = line
		.replace(/SRC_ +/g, 'SRC_')
		.replace(/DST_ +/g, 'DST_')
		.replace(/SRC_CHANNEL +PRESSURE/g, 'SRC_CHANNELPRESSURE');
	const parts = normalizedLine
		.split('\t')
		.map(part => part.trim())
		.filter(Boolean);
	if (parts.length < 9) {
		return null;
	}

	const values = parts.slice(-9);
	const nameParts = parts.slice(0, -9);
	const articulatorName = normalizeIdentifier(nameParts.length ? nameParts.join(' ') : (pendingName ?? ''));
	if (!articulatorName || !values[0].startsWith('SRC_') || !values[4].startsWith('SRC_') || !values[8].startsWith('DST_')) {
		return null;
	}

	return {
		section,
		articulator_name: articulatorName,
		source: normalizeIdentifier(values[0]),
		source_bipolar: values[1] === 'T',
		source_invert: values[2] === 'T',
		source_transform: values[3],
		control: normalizeIdentifier(values[4]),
		control_bipolar: values[5] === 'T',
		control_invert: values[6] === 'T',
		control_transform: values[7],
		destination: normalizeIdentifier(values[8])
	};
};

export async function transformDls2(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const normalizedContent = content
		.replace(/Mod LFO Channel Pressure to\nGain\nSRC_LFO\s+T\s+F\s+Linear\s+SRC_CHANNEL PRESSURE\s+F\s+F\s+Linear\s+DST_GAIN/g, 'Mod LFO Channel Pressure to Gain\tSRC_LFO\tT\tF\tLinear\tSRC_CHANNELPRESSURE\tF\tF\tLinear\tDST_GAIN')
		.replace(/Vib LFO Channel Pressure to\nPitch\nSRC_VIBRATO\s+T\s+F\s+Linear\s+SRC_CHANNEL\nPRESSURE\nF\s+F\s+Linear\s+DST_ PITCH/g, 'Vib LFO Channel Pressure to Pitch\tSRC_VIBRATO\tT\tF\tLinear\tSRC_CHANNELPRESSURE\tF\tF\tLinear\tDST_PITCH')
		.replace(/Mod LFO Channel Pressure to\nPitch\nSRC_ LFO\s+T\s+F\s+Linear\s+SRC_CHANNEL\nPRESSURE\nF\s+F\s+Linear\s+DST_ PITCH/g, 'Mod LFO Channel Pressure to Pitch\tSRC_LFO\tT\tF\tLinear\tSRC_CHANNELPRESSURE\tF\tF\tLinear\tDST_PITCH');
	const lines = normalizedContent.split('\n');
	const noteExclusivity = [];
	const modulationRoutes = [];
	const connectionDefaults = [];
	const dlsSystemMessages = [];
	const riffDefinitions = [];
	const level1ConnectionConstants = [];
	const level2ConnectionConstants = [];
	let activeTable = null;
	let currentSection = null;
	let pendingRouteName = null;
	let pendingRouteData = null;
	let pendingNoteExclusivityFeature = null;
	let systemMessage = null;
	let constantCategory = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith('## Page') || line.startsWith('DLS 2.2 Version') || line === 'DLS') {
			continue;
		}

		if (line === 'Description \tDLS instrument data') {
			activeTable = 'note-exclusivity';
			continue;
		}
		if (line === 'Table 1: Supported Note Exclusivity Functionality') {
			activeTable = null;
			continue;
		}
		if (activeTable === 'note-exclusivity') {
			const parts = line
				.split('\t')
				.map(part => part.trim())
				.filter(Boolean);
			if (parts.length === 2) {
				noteExclusivity.push({ feature: parts[0], value: parts[1] });
				continue;
			}
			const yesMatch = line.match(/^(.*)\s+Yes$/);
			if (yesMatch) {
				const feature = `${pendingNoteExclusivityFeature ?? ''} ${yesMatch[1]}`.trim();
				noteExclusivity.push({ feature, value: 'Yes' });
				pendingNoteExclusivityFeature = null;
				continue;
			}
			if (line === 'Any channel' && pendingNoteExclusivityFeature) {
				noteExclusivity.push({ feature: pendingNoteExclusivityFeature, value: line });
				pendingNoteExclusivityFeature = null;
				continue;
			}
			pendingNoteExclusivityFeature = pendingNoteExclusivityFeature ? `${pendingNoteExclusivityFeature} ${line}` : line;
			continue;
		}

		if (line.startsWith('Table ') && line.includes('Modulation Routing')) {
			activeTable = 'routes';
			pendingRouteName = null;
			pendingRouteData = null;
			continue;
		}
		if (line.startsWith('Table ') && line.includes('Default Connection Blocks')) {
			activeTable = 'defaults';
			continue;
		}
		if (activeTable === 'routes') {
			if (SECTION_HEADERS.has(line)) {
				currentSection = line;
				pendingRouteName = null;
				continue;
			}
			if (line.startsWith('Articulator Name') || line.startsWith('This table contains') || line.startsWith('(*) To improve')) {
				continue;
			}
			if (pendingRouteData) {
				pendingRouteData += rawLine.includes('\t') ? `\t${line}` : ` ${line}`;
				const splitRoute = parseRoute(pendingRouteData, currentSection, pendingRouteName);
				if (splitRoute) {
					modulationRoutes.push(splitRoute);
					pendingRouteName = null;
					pendingRouteData = null;
				}
				continue;
			}
			const route = parseRoute(line, currentSection, pendingRouteName);
			if (route) {
				modulationRoutes.push(route);
				pendingRouteName = null;
				continue;
			}
			if (line.includes('SRC_')) {
				pendingRouteData = pendingRouteName ? `${pendingRouteName}\t${line}` : line;
				pendingRouteName = null;
				continue;
			}
			if (!line.includes('\t') && !line.startsWith('Table ') && !line.startsWith('DEFAULT')) {
				pendingRouteName = pendingRouteName ? `${pendingRouteName} ${line}` : line;
			}
			continue;
		}
		if (activeTable === 'defaults') {
			if (SECTION_HEADERS.has(line)) {
				currentSection = line;
				continue;
			}
			if (line.startsWith('Articulator') || line.startsWith('DLS Synthesizer') || line.startsWith('Unspecified')) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(part => part.trim())
				.filter(Boolean);
			if (parts.length === 5) {
				connectionDefaults.push({
					section: currentSection,
					articulator: parts[0],
					default_value: parts[1],
					min_value: parts[2],
					max_value: parts[3],
					units: parts[4]
				});
				continue;
			}
		}

		if (line === '1.16 DLS System Exclusive Messages') {
			activeTable = 'sysex';
			continue;
		}
		if (activeTable === 'sysex') {
			if (line.startsWith('2. DLS File RIFF Structure')) {
				if (systemMessage) {
					dlsSystemMessages.push(systemMessage);
				}
				activeTable = null;
				continue;
			}
			if (line.endsWith(':') && line.startsWith('Turn DLS')) {
				if (systemMessage) {
					dlsSystemMessages.push(systemMessage);
				}
				systemMessage = { name: line.slice(0, -1), message: '', bytes: [] };
				continue;
			}
			if (systemMessage?.message === '' && line.startsWith('F0 7E ')) {
				systemMessage.message = line;
				continue;
			}
			const parts = line
				.split('\t')
				.map(part => part.trim())
				.filter(Boolean);
			if (systemMessage && parts.length === 2 && /^(F0 7E|< device ID >|0A|0[1-4]|F7)$/.test(parts[0])) {
				systemMessage.bytes.push({ byte: parts[0], description: parts[1] });
			}
			continue;
		}

		if (line === 'RIFF Chunk \tDefinition') {
			activeTable = 'riff';
			continue;
		}
		if (activeTable === 'riff') {
			const parts = line
				.split('\t')
				.map(part => part.trim())
				.filter(Boolean);
			if (parts.length === 2 && parts[0].startsWith('<')) {
				riffDefinitions.push({ chunk: parts[0], definition: parts[1] });
				continue;
			}
			if (line.startsWith('Figure ') || line.startsWith('2.3 ')) {
				activeTable = null;
			}
		}

		if (line.startsWith('Table 8: DLS Level 1 Sources')) {
			activeTable = 'level1-constants';
			constantCategory = null;
			continue;
		}
		if (line.startsWith('Table 9: DLS Level 2 Sources')) {
			activeTable = 'level2-constants';
			constantCategory = null;
			continue;
		}
		if (line.startsWith('Table 10: DLS Level 2 Sources')) {
			activeTable = 'level2-constants';
			continue;
		}
		if (activeTable === 'level1-constants' || activeTable === 'level2-constants') {
			if (/^(Modulator Sources|MIDI Controller Sources|Registered Parameter Numbers|Generic Destinations|Channel Output Destinations|Modulator LFO Destinations|Vibrato LFO Destinations|EG Destinations|Filter Destinations|Transforms)$/.test(line)) {
				constantCategory = line;
				continue;
			}
			const parts = line
				.split('\t')
				.map(part => part.trim())
				.filter(Boolean);
			if (parts.length === 3 && /^0x[0-9A-Fa-f]+$/.test(parts[0]) && parts[1].startsWith('CONN_')) {
				const target = activeTable === 'level1-constants' ? level1ConnectionConstants : level2ConnectionConstants;
				target.push({ value: parts[0], name: parts[1], description: parts[2], category: constantCategory });
				continue;
			}
			if (line.startsWith('2.11 ')) {
				activeTable = null;
			}
		}
	}

	const result = {
		metadata: {
			title: 'Downloadable Sounds Level 2.2 Specification',
			doc_id: 'DLS-2',
			protocol: 'midi1',
			version: '1.0',
			date: '2006-04'
		},
		note_exclusivity: noteExclusivity,
		modulation_routes: modulationRoutes,
		connection_defaults: connectionDefaults,
		dls_system_messages: dlsSystemMessages,
		riff_definitions: riffDefinitions,
		level1_connection_constants: level1ConnectionConstants,
		level2_connection_constants: level2ConnectionConstants,
		summary: {
			note_exclusivity_count: noteExclusivity.length,
			modulation_route_count: modulationRoutes.length,
			connection_default_count: connectionDefaults.length,
			dls_system_message_count: dlsSystemMessages.length,
			riff_definition_count: riffDefinitions.length,
			level1_connection_constant_count: level1ConnectionConstants.length,
			level2_connection_constant_count: level2ConnectionConstants.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'dls2.json'), JSON.stringify(result, null, 2), 'utf8');
	}

	return result;
}
