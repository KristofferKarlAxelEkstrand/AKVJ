import fs from 'node:fs/promises';
import path from 'node:path';

export async function transformMidi1(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const statusByteSummary = [];
	const channelVoiceMessages = [];
	const controllerNumbers = [];
	const registeredParameterNumbers = [];
	const channelModeMessages = [];
	const systemCommonMessages = [];
	const systemRealTimeMessages = [];
	const systemExclusiveMessages = [];
	const universalSysExNonRealTime = [];
	const universalSysExRealTime = [];
	const manufacturerIdNumbers = [];
	const additionalSpecDocuments = [];
	const sysexMessageFormats = [];

	let currentSection = null;
	let currentRegion = null;
	let inTablesSection = false;
	let pendingSysExFormat = null;
	let table7NotesSeen = false;

	const isStatusHex = str => /^[0-9A-F](n|0)H?$/i.test(str);
	const isFHex = str => /^F[0-9A-F]H$/i.test(str);

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		const line = raw.trim();

		if (!line || line.startsWith('## Page')) {
			continue;
		}

		// Detect start of tables appendix (page 73+)
		if (line.match(/^Tables\s+T-\d/)) {
			inTablesSection = true;
			continue;
		}

		// --- Body text SysEx message formats (pages 39-63, before tables) ---
		if (!inTablesSection) {
			// Named message headers like "ACK:", "NAK:", "DUMP HEADER", etc.
			const namedHeader = line.match(/^(ACK|NAK|CANCEL|WAIT|EOF|DUMP HEADER|DUMP REQUEST|DATA PACKET|LOOP POINT TRANSMISSION|LOOP POINTS REQUEST|BULK TUNING DUMP REQUEST|BULK TUNING DUMP|SINGLE NOTE TUNING CHANGE|IDENTITY REQUEST|IDENTITY REPLY|HEADER|REQUEST|BAR MARKER|TIME SIGNATURE|MASTER VOLUME|MASTER BALANCE):/i);
			if (namedHeader) {
				if (pendingSysExFormat) {
					sysexMessageFormats.push(pendingSysExFormat);
				}
				pendingSysExFormat = {
					name: namedHeader[1],
					format: null,
					fields: []
				};
				continue;
			}

			// SysEx format lines starting with F0
			if (line.startsWith('F0 7E') || line.startsWith('F0 7F')) {
				if (pendingSysExFormat && !pendingSysExFormat.format) {
					pendingSysExFormat.format = line;
				} else {
					if (pendingSysExFormat) {
						sysexMessageFormats.push(pendingSysExFormat);
					}
					pendingSysExFormat = {
						name: null,
						format: line,
						fields: []
					};
				}
				continue;
			}

			// Field descriptions following a format line
			if (pendingSysExFormat) {
				const parts = line
					.split('\t')
					.map(p => p.trim())
					.filter(Boolean);
				if (parts.length >= 2) {
					pendingSysExFormat.fields.push({
						byte: parts[0],
						description: parts.slice(1).join(' ')
					});
					continue;
				}
				if (parts.length === 1 && line.match(/^[0-9a-fA-F]+\s*=/)) {
					pendingSysExFormat.fields.push({
						byte: null,
						description: parts[0]
					});
					continue;
				}
			}

			// GM System On/Off message headers
			if (line === 'Turn General MIDI System On:' || line === 'Turn General MIDI System Off:') {
				if (pendingSysExFormat) {
					sysexMessageFormats.push(pendingSysExFormat);
				}
				pendingSysExFormat = {
					name: line.replace(/:$/, ''),
					format: null,
					fields: []
				};
				continue;
			}

			// Time Signature sub-headers
			if (line === 'Time Signature (Immediate):' || line === 'Time Signature (Delayed):') {
				if (pendingSysExFormat) {
					sysexMessageFormats.push(pendingSysExFormat);
				}
				pendingSysExFormat = {
					name: line.replace(/:$/, ''),
					format: null,
					fields: []
				};
				continue;
			}

			// Handshaking flags header
			if (line === 'HANDSHAKING FLAGS') {
				if (pendingSysExFormat) {
					sysexMessageFormats.push(pendingSysExFormat);
				}
				pendingSysExFormat = {
					name: 'Handshaking Flags',
					format: null,
					fields: []
				};
				continue;
			}
			continue;
		}

		// ===== Tables section (pages 73-86) =====

		// --- Table I: Summary of Status Bytes ---
		if (line === 'TABLE I' || line === 'SUMMARY OF STATUS BYTES') {
			currentSection = 'table1';
			continue;
		}
		if (currentSection === 'table1') {
			if (line === 'TABLE II' || line === 'CHANNEL VOICE MESSAGES') {
				currentSection = 'table2';
				continue;
			}
			if (line.startsWith('STATUS') || line.startsWith('Hex') || line.startsWith('D7--D0') || line.startsWith('NUMBER') || line.startsWith('OF DATA') || line.startsWith('BYTES')) {
				continue;
			}
			if (line === 'Channel Voice Messages' || line === 'Channel Mode Messages' || line === 'System Messages') {
				continue;
			}
			if (line.startsWith('NOTES:') || line.startsWith('nnnn:') || line.startsWith('*****:') || line.startsWith('iiiiiii:') || line.startsWith('sss:') || line.startsWith('ttt:') || line.startsWith('xxx:')) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			// Special rows: "11110sss 	0 to 2 	System Common"
			if (parts.length >= 3 && parts[0].startsWith('11110')) {
				statusByteSummary.push({
					status_hex: null,
					binary: parts[0],
					data_bytes: parts[1],
					description: parts.slice(2).join(' ')
				});
				continue;
			}
			// Special rows: "11111ttt 	0 	System Real Time"
			if (parts.length >= 3 && parts[0].startsWith('11111')) {
				statusByteSummary.push({
					status_hex: null,
					binary: parts[0],
					data_bytes: parts[1],
					description: parts.slice(2).join(' ')
				});
				continue;
			}
			// Standard rows: "8nH 	1000nnnn 	2 	Note Off" or "F0H 	11110000 	***** 	System Exclusive"
			if (parts.length >= 3 && isStatusHex(parts[0])) {
				statusByteSummary.push({
					status_hex: parts[0],
					binary: parts[1],
					data_bytes: parts[2],
					description: parts.slice(3).join(' ')
				});
				continue;
			}
			// Channel Mode row: "BnH 	1011nnnn 	(01111xxx) 	2 	Selects Channel Mode"
			if (parts.length >= 4 && isStatusHex(parts[0])) {
				statusByteSummary.push({
					status_hex: parts[0],
					binary: parts[1],
					data_bytes: parts.slice(2, -1).join(' '),
					description: parts[parts.length - 1]
				});
				continue;
			}
			continue;
		}

		// --- Table II: Channel Voice Messages ---
		if (line === 'TABLE II' || line === 'CHANNEL VOICE MESSAGES') {
			if (currentSection !== 'table2') {
				currentSection = 'table2';
				continue;
			}
		}
		if (currentSection === 'table2') {
			if (line === 'TABLE III' || line === 'CONTROLLER NUMBERS') {
				currentSection = 'table3';
				continue;
			}
			if (line.startsWith('STATUS') || line.startsWith('Hex') || line.startsWith('Binary') || line.startsWith('DATA BYTES') || line.startsWith('DESCRIPTION') || line.startsWith('NOTES:')) {
				continue;
			}
			if (line.match(/^\d+\.\s/) || line.startsWith('nnnn:') || line.startsWith('kkkkkkk:') || line.startsWith('vvvvvvv:') || line.startsWith('A logarithmic')) {
				continue;
			}
			if (line.startsWith('Continuous controllers')) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			// Main row: "8nH 	1000nnnn 	0kkkkkkk 	Note Off"
			if (parts.length >= 3 && isStatusHex(parts[0])) {
				channelVoiceMessages.push({
					status_hex: parts[0],
					binary: parts[1],
					data_bytes: [parts[2]],
					description: parts.slice(3).join(' '),
					data_byte_descriptions: []
				});
				continue;
			}
			// Continuation line: "0vvvvvvv 	vvvvvvv: note off velocity"
			if (parts.length >= 2 && channelVoiceMessages.length > 0 && !isStatusHex(parts[0])) {
				const lastEntry = channelVoiceMessages[channelVoiceMessages.length - 1];
				lastEntry.data_bytes.push(parts[0]);
				lastEntry.data_byte_descriptions.push(parts.slice(1).join(' '));
				continue;
			}
			// Continuation line with just description
			if (parts.length === 1 && channelVoiceMessages.length > 0 && !isStatusHex(parts[0])) {
				const lastEntry = channelVoiceMessages[channelVoiceMessages.length - 1];
				lastEntry.data_byte_descriptions.push(parts[0]);
				continue;
			}
			continue;
		}

		// --- Table III: Controller Numbers ---
		if (line === 'TABLE III' || line === 'CONTROLLER NUMBERS') {
			if (currentSection !== 'table3') {
				currentSection = 'table3';
				continue;
			}
		}
		if (currentSection === 'table3') {
			if (line === 'TABLE IIIa' || line === 'REGISTERED PARAMETER NUMBERS') {
				currentSection = 'table3a';
				continue;
			}
			if (line.startsWith('CONTROL NUMBER') || line.startsWith('CONTROL FUNCTION') || line.startsWith('(2nd Byte') || line.startsWith('Decimal') || line.startsWith('Hex')) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			// "0 	00H 	Bank Select"
			if (parts.length >= 3 && parts[0].match(/^\d+/) && parts[1].match(/[0-9A-F]H$/i)) {
				controllerNumbers.push({
					decimal: parts[0],
					hex: parts[1],
					function: parts.slice(2).join(' ')
				});
				continue;
			}
			// "14-15 	0E-0FH 	Undefined"
			if (parts.length >= 3 && parts[0].match(/^\d+-\d+/) && parts[1].match(/[0-9A-F]H$/i)) {
				controllerNumbers.push({
					decimal: parts[0],
					hex: parts[1],
					function: parts.slice(2).join(' ')
				});
				continue;
			}
			continue;
		}

		// --- Table IIIa: Registered Parameter Numbers ---
		if (line === 'TABLE IIIa' || line === 'REGISTERED PARAMETER NUMBERS') {
			if (currentSection !== 'table3a') {
				currentSection = 'table3a';
				continue;
			}
		}
		if (currentSection === 'table3a') {
			if (line === 'TABLE IV' || line === 'CHANNEL MODE MESSAGES') {
				currentSection = 'table4';
				continue;
			}
			if (line.startsWith('Parameter Number') || line.startsWith('Function') || line.startsWith('LSB') || line.startsWith('MSB')) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			if (parts.length >= 3 && parts[0].match(/[0-9A-F]H$/i)) {
				registeredParameterNumbers.push({
					lsb: parts[0],
					msb: parts[1],
					function: parts.slice(2).join(' ')
				});
			}
			continue;
		}

		// --- Table IV: Channel Mode Messages ---
		if (line === 'TABLE IV' || line === 'CHANNEL MODE MESSAGES') {
			if (currentSection !== 'table4') {
				currentSection = 'table4';
				continue;
			}
		}
		if (currentSection === 'table4') {
			if (line === 'TABLE V' || line === 'SYSTEM COMMON MESSAGES') {
				currentSection = 'table5';
				continue;
			}
			if (line.startsWith('STATUS') || line.startsWith('Hex') || line.startsWith('Binary') || line.startsWith('DATA BYTES') || line.startsWith('DESCRIPTION') || line.startsWith('NOTES:')) {
				continue;
			}
			if (line.startsWith('Bn ') || line === 'Bn 	1011nnnn 	0ccccccc 	Mode Messages') {
				continue;
			}
			if (line.match(/^\d+\.\s/) || line.startsWith('nnnn:') || line.startsWith('ccccccc:') || line.startsWith('vvvvvvv:')) {
				continue;
			}
			// "ccccccc = 120: All Sound Off"
			const modeMatch = line.match(/ccccccc\s*=\s*(\d+):?\s*(.*)/);
			if (modeMatch) {
				channelModeMessages.push({
					controller_number: parseInt(modeMatch[1], 10),
					description: modeMatch[2].trim(),
					values: []
				});
				continue;
			}
			// "vvvvvvv = 0" or "vvvvvvv = 0, Local Control Off"
			const valueMatch = line.match(/vvvvvvv\s*=\s*(.*)/);
			if (valueMatch && channelModeMessages.length > 0) {
				channelModeMessages[channelModeMessages.length - 1].values.push(valueMatch[1].trim());
				continue;
			}
			// Continuation lines for multiline values (e.g. "channels.")
			if (channelModeMessages.length > 0 && !line.match(/^\d+\./) && !line.startsWith('Bn') && !line.match(/^T-\d+/) && !line.match(/^Tables\s+T-\d/)) {
				const lastEntry = channelModeMessages[channelModeMessages.length - 1];
				if (lastEntry.values.length > 0) {
					lastEntry.values[lastEntry.values.length - 1] += ' ' + line;
				}
			}
			continue;
		}

		// --- Table V: System Common Messages ---
		if (line === 'TABLE V' || line === 'SYSTEM COMMON MESSAGES') {
			if (currentSection !== 'table5') {
				currentSection = 'table5';
				continue;
			}
		}
		if (currentSection === 'table5') {
			if (line === 'TABLE VI' || line === 'SYSTEM REAL TIME MESSAGES') {
				currentSection = 'table6';
				continue;
			}
			if (line.startsWith('STATUS') || line.startsWith('Hex') || line.startsWith('Binary') || line.startsWith('DATA BYTES') || line.startsWith('DESCRIPTION')) {
				continue;
			}
			if (line.match(/^Tables\s+T-\d/) || line.match(/^T-\d+/)) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			// "F1H 	11110001 	0nnndddd 	MIDI Time Code Quarter Frame"
			if (parts.length >= 3 && isFHex(parts[0])) {
				const dataByte = parts.slice(2, -1).join(' ');
				systemCommonMessages.push({
					status_hex: parts[0],
					binary: parts[1],
					data_bytes: dataByte ? [dataByte] : [],
					description: parts[parts.length - 1],
					data_byte_descriptions: []
				});
				continue;
			}
			// Continuation lines
			if (parts.length >= 1 && systemCommonMessages.length > 0 && !isFHex(parts[0])) {
				const lastEntry = systemCommonMessages[systemCommonMessages.length - 1];
				if (parts.length >= 2) {
					if (parts[0]) {
						lastEntry.data_bytes.push(parts[0]);
					}
					lastEntry.data_byte_descriptions.push(parts.slice(1).join(' '));
				} else {
					lastEntry.data_byte_descriptions.push(parts[0]);
				}
				continue;
			}
			continue;
		}

		// --- Table VI: System Real Time Messages ---
		if (line === 'TABLE VI' || line === 'SYSTEM REAL TIME MESSAGES') {
			if (currentSection !== 'table6') {
				currentSection = 'table6';
				continue;
			}
		}
		if (currentSection === 'table6') {
			if (line === 'TABLE VII' || line === 'SYSTEM EXCLUSIVE MESSAGES') {
				currentSection = 'table7';
				continue;
			}
			if (line.startsWith('STATUS') || line.startsWith('Hex') || line.startsWith('Binary') || line.startsWith('DATA BYTES') || line.startsWith('DESCRIPTION')) {
				continue;
			}
			if (line.match(/^Tables\s+T-\d/) || line.match(/^T-\d+/)) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			if (parts.length >= 2 && isFHex(parts[0])) {
				systemRealTimeMessages.push({
					status_hex: parts[0],
					binary: parts[1],
					description: parts.slice(2).join(' ') || ''
				});
			}
			continue;
		}

		// --- Table VII: System Exclusive Messages ---
		if (line === 'TABLE VII' || line === 'SYSTEM EXCLUSIVE MESSAGES') {
			if (currentSection !== 'table7') {
				currentSection = 'table7';
				continue;
			}
		}
		if (currentSection === 'table7') {
			if (line === 'TABLE VIIa' || line.startsWith('CURRENTLY DEFINED UNIVERSAL')) {
				currentSection = 'table7a';
				continue;
			}
			if (line.startsWith('STATUS') || line.startsWith('Hex') || line.startsWith('Binary') || line.startsWith('DATA BYTES') || line.startsWith('DESCRIPTION') || line.startsWith('NOTES:')) {
				if (line.startsWith('NOTES:')) {
					table7NotesSeen = true;
				}
				continue;
			}
			if (line.match(/^Tables\s+T-\d/) || line.match(/^T-\d+/)) {
				continue;
			}
			if (line.match(/^[0-9A-F]\)\s/) || line.startsWith('A)') || line.startsWith('B)') || line.startsWith('C)')) {
				continue;
			}
			// Skip numbered notes and continuation of notes
			if (line.match(/^\d+\.\s/) || line === '0ddddddd' || line === '.' || line === '..' || line === '...') {
				continue;
			}
			// After NOTES:, skip all remaining continuation lines
			if (table7NotesSeen) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			if (parts.length >= 2 && isFHex(parts[0])) {
				const dataByte = parts.slice(2, -1).join(' ');
				systemExclusiveMessages.push({
					status_hex: parts[0],
					binary: parts[1],
					data_bytes: dataByte ? [dataByte] : [],
					description: parts[parts.length - 1],
					data_byte_descriptions: []
				});
				continue;
			}
			if (parts.length >= 1 && systemExclusiveMessages.length > 0 && !isFHex(parts[0])) {
				const lastEntry = systemExclusiveMessages[systemExclusiveMessages.length - 1];
				if (parts.length >= 2) {
					if (parts[0] && parts[0] !== '.') {
						lastEntry.data_bytes.push(parts[0]);
					}
					lastEntry.data_byte_descriptions.push(parts.slice(1).join(' '));
				} else {
					lastEntry.data_byte_descriptions.push(parts[0]);
				}
				continue;
			}
			continue;
		}

		// --- Table VIIa: Universal System Exclusive Messages ---
		if (line === 'TABLE VIIa' || line.startsWith('CURRENTLY DEFINED UNIVERSAL')) {
			if (currentSection !== 'table7a') {
				currentSection = 'table7a';
				continue;
			}
		}
		if (currentSection === 'table7a') {
			if (line === 'TABLE VIIb' || line.startsWith('SYSTEM EXCLUSIVE MANUFACTURER')) {
				currentSection = 'table7b';
				continue;
			}
			if (line.startsWith('SUB-ID') || line.startsWith('DESCRIPTION')) {
				continue;
			}
			if (line === 'Non-Real Time (7EH)') {
				currentRegion = 'non_real_time';
				continue;
			}
			if (line === 'Real Time (7FH)') {
				currentRegion = 'real_time';
				continue;
			}
			if (line.startsWith('CURRENTLY DEFINED') || line.startsWith('NOTES:') || line.startsWith('The standardized')) {
				continue;
			}
			if (line.match(/^Tables\s+T-\d/) || line.match(/^T-\d+/)) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			if (parts.length >= 3 && currentRegion) {
				// Parent entry: "06 	nn 	General Information"
				const entry = {
					sub_id_1: parts[0],
					sub_id_2: parts[1],
					description: parts.slice(2).join(' ')
				};
				if (currentRegion === 'non_real_time') {
					universalSysExNonRealTime.push(entry);
				} else if (currentRegion === 'real_time') {
					universalSysExRealTime.push(entry);
				}
			} else if (parts.length === 2 && currentRegion) {
				// Sub-entry: "01 	Identity Request" (inherits parent sub_id_1)
				const entry = {
					sub_id_1: parts[0],
					sub_id_2: null,
					description: parts[1]
				};
				if (currentRegion === 'non_real_time') {
					universalSysExNonRealTime.push(entry);
				} else if (currentRegion === 'real_time') {
					universalSysExRealTime.push(entry);
				}
			}
			continue;
		}

		// --- Table VIIb: Manufacturer ID Numbers ---
		if (line === 'TABLE VIIb' || line.startsWith('SYSTEM EXCLUSIVE MANUFACTURER')) {
			if (currentSection !== 'table7b') {
				currentSection = 'table7b';
				continue;
			}
		}
		if (currentSection === 'table7b') {
			if (line === 'TABLE VIII' || line.startsWith('ADDITIONAL OFFICIAL')) {
				currentSection = 'table8';
				continue;
			}
			if (line.startsWith('NUMBER') || line.startsWith('MANUFACTURER')) {
				continue;
			}
			if (line.match(/^Tables\s+T-\d/) || line.match(/^T-\d+/)) {
				continue;
			}
			if (line === 'American Group' || line === 'European Group' || line === 'Japanese Group (as of 10/92)') {
				currentRegion = line
					.replace(/ \(as of .*\)/, '')
					.replace(' Group', '')
					.toLowerCase();
				continue;
			}
			if (line.startsWith('SYSTEM EXCLUSIVE MANUFACTURER') || line.startsWith('- continued')) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			if (parts.length >= 2 && currentRegion) {
				const fixedNumber = parts[0].replace(/OOH/g, '00H').replace(/OO /g, '00 ');
				manufacturerIdNumbers.push({
					region: currentRegion,
					number: fixedNumber,
					manufacturer: parts.slice(1).join(' ')
				});
			}
			continue;
		}

		// --- Table VIII: Additional Official Specification Documents ---
		if (line === 'TABLE VIII' || line.startsWith('ADDITIONAL OFFICIAL')) {
			if (currentSection !== 'table8') {
				currentSection = 'table8';
				continue;
			}
		}
		if (currentSection === 'table8') {
			if (line.startsWith('DOCUMENT TITLE') || line.startsWith('DESCRIPTION') || line.startsWith('THE MIDI MANUFACTURERS')) {
				continue;
			}
			if (line.startsWith('*')) {
				continue;
			}
			if (line.match(/^Tables\s+T-\d/) || line.match(/^T-\d+/)) {
				continue;
			}
			const parts = line
				.split('\t')
				.map(p => p.trim())
				.filter(Boolean);
			if (parts.length >= 2) {
				additionalSpecDocuments.push({
					title: parts[0],
					description: parts.slice(1).join(' ')
				});
			}
			continue;
		}
	}

	// Flush last pending SysEx format
	if (pendingSysExFormat && (pendingSysExFormat.format || pendingSysExFormat.fields.length > 0)) {
		sysexMessageFormats.push(pendingSysExFormat);
	}

	// Deduplicate SysEx formats: merge entries with same name, keeping the one with format
	const dedupedFormats = [];
	const seenNames = new Map();
	for (const fmt of sysexMessageFormats) {
		if (fmt.name && !fmt.format && seenNames.has(fmt.name)) {
			continue;
		}
		if (fmt.name && fmt.format) {
			seenNames.set(fmt.name, true);
		}
		dedupedFormats.push(fmt);
	}

	const result = {
		metadata: {
			title: 'MIDI 1.0 Detailed Specification',
			doc_id: 'M1',
			protocol: 'midi1',
			version: '4.2.1',
			date: '1996-02'
		},
		status_byte_summary: statusByteSummary,
		channel_voice_messages: channelVoiceMessages,
		controller_numbers: controllerNumbers,
		registered_parameter_numbers: registeredParameterNumbers,
		channel_mode_messages: channelModeMessages,
		system_common_messages: systemCommonMessages,
		system_real_time_messages: systemRealTimeMessages,
		system_exclusive_messages: systemExclusiveMessages,
		universal_sysex_non_real_time: universalSysExNonRealTime,
		universal_sysex_real_time: universalSysExRealTime,
		manufacturer_id_numbers: manufacturerIdNumbers,
		additional_spec_documents: additionalSpecDocuments,
		sysex_message_formats: dedupedFormats,
		summary: {
			status_byte_count: statusByteSummary.length,
			channel_voice_message_count: channelVoiceMessages.length,
			controller_number_count: controllerNumbers.length,
			registered_parameter_number_count: registeredParameterNumbers.length,
			channel_mode_message_count: channelModeMessages.length,
			system_common_message_count: systemCommonMessages.length,
			system_real_time_message_count: systemRealTimeMessages.length,
			system_exclusive_message_count: systemExclusiveMessages.length,
			universal_sysex_non_real_time_count: universalSysExNonRealTime.length,
			universal_sysex_real_time_count: universalSysExRealTime.length,
			manufacturer_id_number_count: manufacturerIdNumbers.length,
			additional_spec_document_count: additionalSpecDocuments.length,
			sysex_message_format_count: dedupedFormats.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'midi1.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
