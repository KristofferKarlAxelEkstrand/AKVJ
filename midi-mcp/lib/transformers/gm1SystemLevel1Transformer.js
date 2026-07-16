import fs from 'node:fs/promises';
import path from 'node:path';

const INSTRUMENT_REGEX = /^(\d+)\.\s+(.+)$/;
const CONTROLLER_REGEX = /^(\d+)\s+(.+)$/;
const RPN_REGEX = /^(\d+)\s+(.+)$/;

export async function transformGm1SystemLevel1(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const soundSetGroupings = [];
	const instruments = [];
	const percussionMap = [];
	const controllers = [];
	const rpnEntries = [];
	const sysexMessages = [];

	let inSoundSetGroupings = false;
	let inInstrumentList = false;
	let inPercussionMap = false;
	let inControllers = false;
	let inRpns = false;
	let inSysexSection = false;
	let currentSysexMessage = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('# RP 003')) {
			continue;
		}

		if (line === 'General MIDI Sound Set Groupings:') {
			inSoundSetGroupings = true;
			continue;
		}
		if (inSoundSetGroupings) {
			if (line.startsWith('(all channels')) {
				continue;
			}
			const groupingMatch = line.match(/^(\d+-\d+)\s+(.+?)\s+(\d+-\d+)\s+(.+)$/);
			if (groupingMatch) {
				soundSetGroupings.push({
					range_start: parseInt(groupingMatch[1].split('-')[0], 10),
					range_end: parseInt(groupingMatch[1].split('-')[1], 10),
					group: groupingMatch[2],
					range_start_2: parseInt(groupingMatch[3].split('-')[0], 10),
					range_end_2: parseInt(groupingMatch[3].split('-')[1], 10),
					group_2: groupingMatch[4]
				});
				continue;
			}
			if (line === 'Table 1') {
				inSoundSetGroupings = false;
				continue;
			}
		}

		if (line === 'Table 2') {
			inInstrumentList = false;
			continue;
		}
		if (line.includes('General MIDI Sound Set:') || line.includes('MIDI Program Numbers 1')) {
			inInstrumentList = true;
			continue;
		}
		if (inInstrumentList) {
			if (line === 'Prog # Instrument' || line === 'Prog #' || line === 'Instrument') {
				continue;
			}
			const instrumentMatch = line.match(INSTRUMENT_REGEX);
			if (instrumentMatch) {
				instruments.push({
					program: parseInt(instrumentMatch[1], 10),
					name: instrumentMatch[2]
				});
				continue;
			}
		}

		if (line === 'Table 3') {
			inPercussionMap = false;
			continue;
		}
		if (line.includes('General MIDI Percussion Map:')) {
			inPercussionMap = true;
			continue;
		}
		if (inPercussionMap) {
			if (line === '(Channel 10)') {
				continue;
			}
			if (line.startsWith('MIDI Key Drum Sound')) {
				continue;
			}
			const percussionParts = line
				.split(/\t/)
				.map(p => p.trim())
				.filter(p => p);
			if (percussionParts.length >= 2) {
				for (let j = 0; j < percussionParts.length; j += 2) {
					if (j + 1 < percussionParts.length) {
						const keyMatch = percussionParts[j].match(/^(\d+)/);
						if (keyMatch) {
							percussionMap.push({
								midi_key: parseInt(keyMatch[1], 10),
								drum_sound: percussionParts[j + 1]
							});
						}
					}
				}
				continue;
			}
		}

		if (line === 'Controller Changes:') {
			inControllers = true;
			continue;
		}
		if (inControllers) {
			if (line === 'Controller #' || line.startsWith('Description') || line === 'Controller # Description') {
				continue;
			}
			const controllerMatch = line.match(CONTROLLER_REGEX);
			if (controllerMatch && !line.startsWith('Registered')) {
				controllers.push({
					controller: parseInt(controllerMatch[1], 10),
					description: controllerMatch[2]
				});
				continue;
			}
			if (line.startsWith('Registered Parameter #')) {
				inControllers = false;
				inRpns = true;
				continue;
			}
		}

		if (inRpns) {
			if (line === 'Registered Parameter #' || line === 'Registered Parameter # Description' || line.startsWith('Description')) {
				continue;
			}
			const rpnMatch = line.match(RPN_REGEX);
			if (rpnMatch) {
				rpnEntries.push({
					rpn: parseInt(rpnMatch[1], 10),
					description: rpnMatch[2]
				});
				continue;
			}
			if (line.startsWith('Channel Messages:') || line.startsWith('Default Settings:')) {
				inRpns = false;
				continue;
			}
		}

		if (line === 'General MIDI System Messages' || line.startsWith('In addition to the above')) {
			inSysexSection = true;
			continue;
		}
		if (inSysexSection) {
			if (line.startsWith('• Turn General MIDI System On:')) {
				if (currentSysexMessage) {
					sysexMessages.push(currentSysexMessage);
				}
				const match = line.match(/F0\s+7E\s+<device ID>\s+(\d+)\s+(\d+)\s+F7/);
				currentSysexMessage = {
					name: 'Turn General MIDI System On',
					bytes: match ? `F0 7E <device ID> ${match[1]} ${match[2]} F7` : '',
					sub_id_1: match ? parseInt(match[1], 10) : null,
					sub_id_2: match ? parseInt(match[2], 10) : null,
					fields: []
				};
				continue;
			}
			if (line.startsWith('• Turn General MIDI System Off:')) {
				if (currentSysexMessage) {
					sysexMessages.push(currentSysexMessage);
				}
				const match = line.match(/F0\s+7E\s+<device ID>\s+(\d+)\s+(\d+)\s+F7/);
				currentSysexMessage = {
					name: 'Turn General MIDI System Off',
					bytes: match ? `F0 7E <device ID> ${match[1]} ${match[2]} F7` : '',
					sub_id_1: match ? parseInt(match[1], 10) : null,
					sub_id_2: match ? parseInt(match[2], 10) : null,
					fields: []
				};
				continue;
			}
			if (currentSysexMessage) {
				const fieldMatch = line.match(/^(F0\s+7E|<device ID>|\d+|F7)\s+(.+)$/);
				if (fieldMatch) {
					currentSysexMessage.fields.push({
						value: fieldMatch[1],
						description: fieldMatch[2]
					});
					continue;
				}
			}
			if (line.startsWith('GM System - Level 1 Sound Set') || line.startsWith('General MIDI Sound Set Groupings')) {
				if (currentSysexMessage) {
					sysexMessages.push(currentSysexMessage);
					currentSysexMessage = null;
				}
				inSysexSection = false;
			}
		}
	}

	if (currentSysexMessage) {
		sysexMessages.push(currentSysexMessage);
	}

	const result = {
		metadata: {
			title: 'General MIDI System Level 1',
			doc_id: 'RP-003',
			protocol: 'midi1',
			version: '96.1.4',
			date: '1991-1994'
		},
		sound_set_groupings: soundSetGroupings,
		instruments: instruments,
		percussion_map: percussionMap,
		controllers: controllers,
		rpns: rpnEntries,
		sysex_messages: sysexMessages,
		summary: {
			sound_set_grouping_count: soundSetGroupings.length,
			instrument_count: instruments.length,
			percussion_count: percussionMap.length,
			controller_count: controllers.length,
			rpn_count: rpnEntries.length,
			sysex_message_count: sysexMessages.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'gm1-system-level-1.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
