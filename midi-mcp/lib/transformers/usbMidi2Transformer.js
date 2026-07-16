import fs from 'node:fs/promises';
import path from 'node:path';

export async function transformUsbMidi2(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const umpMessageTypes = [];
	const conformanceWords = [];
	const nonConformanceWords = [];
	const descriptorTypes = [];
	const interfaceDescriptorSubtypes = [];
	const endpointDescriptorSubtypes = [];
	const groupTerminalBlockSubtypes = [];
	const msClassRevisions = [];
	const jackTypes = [];
	const groupTerminalBlockTypes = [];
	const defaultMidiProtocols = [];
	const groupTerminalNumbers = [];
	const revisionHistory = [];
	const version2Changes = [];

	let inUmpTable = false;
	let inConformanceTable = false;
	let inNonConformanceTable = false;
	let inDescriptorTypes = false;
	let inInterfaceSubtypes = false;
	let inEndpointSubtypes = false;
	let inGroupTerminalSubtypes = false;
	let inMsClassRevisions = false;
	let inJackTypes = false;
	let inGroupTerminalBlockTypes = false;
	let inDefaultMidiProtocols = false;
	let inGroupTerminalNumbers = false;
	let inRevisionHistory = false;
	let inVersion2Changes = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('USB Device Class Definition for MIDI Devices')) {
			continue;
		}

		// UMP Message Type Packet Sizes (Table 3-1)
		if (line.includes('Table 3-1: Packet Sizes based on Message Types') && !line.includes('.....')) {
			inUmpTable = true;
			continue;
		}
		if (inUmpTable) {
			if (line.startsWith('3.2.4')) {
				inUmpTable = false;
				continue;
			}
			// Skip header words and Description label
			if (line === 'Message' || line === 'Type' || line === 'Packet' || line === 'Size' || line === 'Description') {
				continue;
			}
			const match = line.match(/^(0x[0-9A-Fa-f])\s+(\d+\s+bits)\s+(.+)$/);
			if (match) {
				umpMessageTypes.push({
					message_type: match[1],
					packet_size: match[2].trim(),
					description: match[3]
				});
				continue;
			}
		}

		// Conformance Words (Table 1-1)
		if (line === 'Table 1-1: Words Relating to Specification Conformance') {
			inConformanceTable = true;
			continue;
		}
		if (inConformanceTable) {
			if (line.startsWith('Table 1-2') || line.startsWith('By contrast')) {
				inConformanceTable = false;
			} else {
				const match = line.match(/^(shall|should|may)\s+(.+)$/);
				if (match) {
					conformanceWords.push({
						word: match[1],
						reserved_for: match[2]
					});
					continue;
				}
			}
		}

		// Non-Conformance Words (Table 1-2)
		if (line === 'Table 1-2: Words Not Relating to Specification Conformance') {
			inNonConformanceTable = true;
			continue;
		}
		if (inNonConformanceTable) {
			if (line.startsWith('2 Management Overview')) {
				inNonConformanceTable = false;
			} else {
				const match = line.match(/^(must|will|can|might)\s+(.+)$/);
				if (match) {
					nonConformanceWords.push({
						word: match[1],
						reserved_for: match[2]
					});
					continue;
				}
			}
		}

		// Version 2.0 Changes
		if (line.startsWith('2.1 Overview of what is new or changed')) {
			inVersion2Changes = true;
			continue;
		}
		if (inVersion2Changes) {
			if (line.startsWith('3 Functional Characteristics')) {
				inVersion2Changes = false;
			} else if (line.startsWith('\u2022')) {
				version2Changes.push(line.replace(/^\u2022\s*/, ''));
				continue;
			}
		}

		// Appendix A.1: Descriptor Types
		if (line === 'A.1 MS Class-Specific Interface Descriptor Types') {
			inDescriptorTypes = true;
			continue;
		}
		if (inDescriptorTypes) {
			if (line.startsWith('A.1 MS Class-Specific Interface Descriptor Subtypes')) {
				inDescriptorTypes = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					descriptorTypes.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.1: Interface Descriptor Subtypes
		if (line === 'A.1 MS Class-Specific Interface Descriptor Subtypes') {
			inInterfaceSubtypes = true;
			continue;
		}
		if (inInterfaceSubtypes) {
			if (line.startsWith('A.2 ')) {
				inInterfaceSubtypes = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					interfaceDescriptorSubtypes.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.2: Endpoint Descriptor Subtypes
		if (line === 'A.2 MS Class-Specific Endpoint Descriptor Subtypes') {
			inEndpointSubtypes = true;
			continue;
		}
		if (inEndpointSubtypes) {
			if (line.startsWith('A.3 ')) {
				inEndpointSubtypes = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					endpointDescriptorSubtypes.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.3: Group Terminal Block Subtypes
		if (line === 'A.3 MS Class-Specific Group Terminal Block Descriptor') {
			inGroupTerminalSubtypes = true;
			continue;
		}
		if (inGroupTerminalSubtypes) {
			if (line.startsWith('A.4 ')) {
				inGroupTerminalSubtypes = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					groupTerminalBlockSubtypes.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.4: MS Class Revisions
		if (line === 'A.4 MS Interface Header MIDIStreaming Class Revision') {
			inMsClassRevisions = true;
			continue;
		}
		if (inMsClassRevisions) {
			if (line.startsWith('A.5 ')) {
				inMsClassRevisions = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{4})$/);
				if (match) {
					msClassRevisions.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.5: Jack Types
		if (line === 'A.5 MS MIDI IN and OUT Jack types') {
			inJackTypes = true;
			continue;
		}
		if (inJackTypes) {
			if (line.startsWith('A.6 ')) {
				inJackTypes = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					jackTypes.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.6: Group Terminal Block Types
		if (line === 'A.6 Group Terminal Block Type') {
			inGroupTerminalBlockTypes = true;
			continue;
		}
		if (inGroupTerminalBlockTypes) {
			if (line.startsWith('A.7 ')) {
				inGroupTerminalBlockTypes = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					groupTerminalBlockTypes.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.7: Default MIDI Protocols
		if (line === 'A.7 Group Terminal Default MIDI Protocol') {
			inDefaultMidiProtocols = true;
			continue;
		}
		if (inDefaultMidiProtocols) {
			if (line.startsWith('A.8 ')) {
				inDefaultMidiProtocols = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					defaultMidiProtocols.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Appendix A.8: Group Terminal Numbers
		if (line === 'A.8 Group Terminal Number (Universal MIDI Packet Group)') {
			inGroupTerminalNumbers = true;
			continue;
		}
		if (inGroupTerminalNumbers) {
			if (line.startsWith('Appendix B')) {
				inGroupTerminalNumbers = false;
			} else {
				const match = line.match(/^(GROUP_\d+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					groupTerminalNumbers.push({ name: match[1], value: match[2] });
					continue;
				}
			}
		}

		// Revision History
		if (line === 'Revision History' && !inRevisionHistory) {
			inRevisionHistory = true;
			continue;
		}
		if (inRevisionHistory) {
			if (line.includes('Copyright') && line.includes('USB Implementers Forum')) {
				inRevisionHistory = false;
			} else {
				const match = line.match(/^(\d+\.\d+)\s+(.+)$/);
				if (match) {
					revisionHistory.push({
						revision: match[1],
						info: match[2]
					});
					continue;
				}
			}
		}
	}

	const result = {
		metadata: {
			title: 'USB Device Class Definition for MIDI Devices, Version 2.0',
			doc_id: 'USB-MIDI-2.0',
			protocol: 'midi2',
			version: '2.0',
			date: '2020-05-05'
		},
		ump_message_types: umpMessageTypes,
		conformance_words: conformanceWords,
		non_conformance_words: nonConformanceWords,
		version2_changes: version2Changes,
		descriptor_types: descriptorTypes,
		interface_descriptor_subtypes: interfaceDescriptorSubtypes,
		endpoint_descriptor_subtypes: endpointDescriptorSubtypes,
		group_terminal_block_subtypes: groupTerminalBlockSubtypes,
		ms_class_revisions: msClassRevisions,
		jack_types: jackTypes,
		group_terminal_block_types: groupTerminalBlockTypes,
		default_midi_protocols: defaultMidiProtocols,
		group_terminal_numbers: groupTerminalNumbers,
		revision_history: revisionHistory,
		summary: {
			ump_message_type_count: umpMessageTypes.length,
			conformance_word_count: conformanceWords.length,
			non_conformance_word_count: nonConformanceWords.length,
			version2_change_count: version2Changes.length,
			descriptor_type_count: descriptorTypes.length,
			interface_descriptor_subtype_count: interfaceDescriptorSubtypes.length,
			endpoint_descriptor_subtype_count: endpointDescriptorSubtypes.length,
			group_terminal_block_subtype_count: groupTerminalBlockSubtypes.length,
			ms_class_revision_count: msClassRevisions.length,
			jack_type_count: jackTypes.length,
			group_terminal_block_type_count: groupTerminalBlockTypes.length,
			default_midi_protocol_count: defaultMidiProtocols.length,
			group_terminal_number_count: groupTerminalNumbers.length,
			revision_history_count: revisionHistory.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'usb-midi-2-0.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
