import fs from 'node:fs/promises';
import path from 'node:path';

function extractNumberedRules(lines, startIdx, endPattern) {
	const rules = [];
	let currentRule = null;
	for (let i = startIdx; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line || line.startsWith('## Page')) {
			continue;
		}
		if (endPattern && endPattern.test(line)) {
			if (currentRule) {
				rules.push(currentRule.join(' '));
				currentRule = null;
			}
			break;
		}
		const ruleMatch = line.match(/^\d+\.\s+(.+)$/);
		if (ruleMatch) {
			if (currentRule) {
				rules.push(currentRule.join(' '));
			}
			currentRule = [ruleMatch[1]];
		} else if (currentRule && line && !line.match(/^\d+\./)) {
			currentRule.push(line);
		}
	}
	if (currentRule) {
		rules.push(currentRule.join(' '));
	}
	return rules;
}

export async function transformBleMidi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const bleServices = [];
	const bleCharacteristics = [];
	const headerByteFields = [];
	const timestampByteFields = [];
	const midiMessageFormat = [];
	const runningStatusRules = [];
	const sysexEncodingRules = [];
	const sysexInterruptionRules = [];
	const timestampSpecs = [];

	let inBleService = false;
	let inHeaderByte = false;
	let inTimestampByte = false;
	let inMidiMessages = false;
	let inTimestamps = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('Version 1.0')) {
			continue;
		}

		if (line === '3. BLE Service and Characteristics Definitions') {
			inBleService = true;
			continue;
		}
		if (inBleService) {
			if (line.startsWith('4. Connection')) {
				inBleService = false;
			} else {
				const serviceMatch = line.match(/MIDI Service \(UUID:\s*(.+)\)/);
				if (serviceMatch) {
					bleServices.push({ name: 'MIDI Service', uuid: serviceMatch[1] });
					continue;
				}
				const charMatch = line.match(/MIDI Data I\/O Characteristic \(UUID:\s*(.+)\)/);
				if (charMatch) {
					bleCharacteristics.push({ name: 'MIDI Data I/O Characteristic', uuid: charMatch[1], properties: [] });
					continue;
				}
				const propMatch = line.match(/^\u2022\s+((?:write|read|notify).*)$/);
				if (propMatch && bleCharacteristics.length > 0) {
					bleCharacteristics[bleCharacteristics.length - 1].properties.push(propMatch[1]);
					continue;
				}
			}
		}

		if (line === 'Header Byte') {
			inHeaderByte = true;
			continue;
		}
		if (inHeaderByte) {
			if (line === 'Timestamp Byte' || line.startsWith('The header byte')) {
				inHeaderByte = false;
			} else {
				const fieldMatch = line.match(/^(bits?\s+\d+(?:-\d+)?)\s+(.+)$/);
				if (fieldMatch) {
					headerByteFields.push({ bits: fieldMatch[1], description: fieldMatch[2] });
					continue;
				}
			}
		}

		if (line === 'Timestamp Byte') {
			inTimestampByte = true;
			continue;
		}
		if (inTimestampByte) {
			if (line.startsWith('The 13-bit timestamp') || line === 'MIDI Messages') {
				inTimestampByte = false;
			} else {
				const fieldMatch = line.match(/^(bits?\s+\d+(?:-\d+)?)\s+(.+)$/);
				if (fieldMatch) {
					timestampByteFields.push({ bits: fieldMatch[1], description: fieldMatch[2] });
					continue;
				}
			}
		}

		if (line === 'MIDI Messages') {
			inMidiMessages = true;
			continue;
		}
		if (inMidiMessages) {
			if (line.startsWith('There are two types')) {
				inMidiMessages = false;
			} else {
				const byteMatch = line.match(/^(Bytes?\s+\d+(?:\s+to\s+\w+-\d+)?)\s+(.+)$/);
				if (byteMatch) {
					midiMessageFormat.push({ byte: byteMatch[1], description: byteMatch[2] });
					continue;
				}
			}
		}

		if (line === '9. Bluetooth LE MIDI Timestamps') {
			inTimestamps = true;
			continue;
		}
		if (inTimestamps) {
			if (line.startsWith('Timestamps are 13-bit')) {
				timestampSpecs.push('13-bit values in milliseconds, maximum 8191 ms');
				continue;
			}
			if (line.startsWith('Timestamps must be issued')) {
				timestampSpecs.push('Monotonically increasing');
				continue;
			}
			if (line.startsWith('The 13-bit timestamp for a MIDI message is composed')) {
				timestampSpecs.push('Composed of timestampHigh (6 bits) and timestampLow (7 bits)');
				continue;
			}
			if (line.startsWith('timestampHigh is initially set')) {
				timestampSpecs.push('timestampHigh from lower 6 bits of header byte, timestampLow from lower 7 bits of timestamp byte');
				continue;
			}
			if (line.includes('overflow/wrap') && line.includes('receiver is responsible')) {
				timestampSpecs.push('Receiver tracks overflow by incrementing timestampHigh when timestampLow wraps');
				continue;
			}
			if (line.includes('maximum of one overflow')) {
				timestampSpecs.push('Maximum one overflow/wrap per BLE packet');
				continue;
			}
			if (line.startsWith('Timestamps are in the sender')) {
				timestampSpecs.push('In sender clock domain, not allowed to be scheduled in the future');
				continue;
			}
			if (line.startsWith('Correlation between')) {
				timestampSpecs.push('Receiver clock correlation required for accurate rendering');
				continue;
			}
		}
	}

	const rsStartIdx = lines.findIndex(l => l.includes('may only be placed in the data stream'));
	if (rsStartIdx >= 0) {
		const rsRules = extractNumberedRules(lines, rsStartIdx + 1, /^In the MIDI 1\.0 protocol/);
		runningStatusRules.push(...rsRules);
	}

	const sysexStartIdx = lines.findIndex(l => l.includes('Multiple Packet Encoding') && !l.includes('...'));
	if (sysexStartIdx >= 0) {
		const seRules = extractNumberedRules(lines, sysexStartIdx + 1, /^Once a SysEx transfer/);
		sysexEncodingRules.push(...seRules);
	}

	const sysexIntStartIdx = lines.findIndex(l => l.startsWith('Once a SysEx transfer has begun'));
	if (sysexIntStartIdx >= 0) {
		const siRules = extractNumberedRules(lines, sysexIntStartIdx + 1, /^9\. Bluetooth/);
		sysexInterruptionRules.push(...siRules);
	}

	const result = {
		metadata: {
			title: 'Specification for MIDI over Bluetooth Low Energy (BLE-MIDI)',
			doc_id: 'RP-052',
			protocol: 'midi1',
			version: '1.0',
			date: '2015-11-01'
		},
		ble_services: bleServices,
		ble_characteristics: bleCharacteristics,
		header_byte_fields: headerByteFields,
		timestamp_byte_fields: timestampByteFields,
		midi_message_format: midiMessageFormat,
		running_status_rules: runningStatusRules,
		sysex_encoding_rules: sysexEncodingRules,
		sysex_interruption_rules: sysexInterruptionRules,
		timestamp_specs: timestampSpecs,
		summary: {
			ble_service_count: bleServices.length,
			ble_characteristic_count: bleCharacteristics.length,
			header_byte_field_count: headerByteFields.length,
			timestamp_byte_field_count: timestampByteFields.length,
			midi_message_format_count: midiMessageFormat.length,
			running_status_rule_count: runningStatusRules.length,
			sysex_encoding_rule_count: sysexEncodingRules.length,
			sysex_interruption_rule_count: sysexInterruptionRules.length,
			timestamp_spec_count: timestampSpecs.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'ble-midi.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
