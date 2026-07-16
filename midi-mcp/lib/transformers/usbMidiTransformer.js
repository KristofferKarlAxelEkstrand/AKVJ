import fs from 'node:fs/promises';
import path from 'node:path';

export async function transformUsbMidi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const cinClassifications = [];
	const parsedEventExamples = [];
	const elementCapabilities = [];
	const interfaceDescriptorSubtypes = [];
	const endpointDescriptorSubtypes = [];
	const jackTypes = [];
	const controlSelectors = [];
	const glossary = [];
	const revisionHistory = [];

	let inCinTable = false;
	let inParsedEventsTable = false;
	let inElementCaps = false;
	let inInterfaceSubtypes = false;
	let inEndpointSubtypes = false;
	let inJackTypes = false;
	let inControlSelectors = false;
	let inGlossary = false;
	let inRevisionHistory = false;

	let parsedEventDesc = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('Release 1.0')) {
			continue;
		}

		// CIN Classifications (Table 4-1)
		if (line === 'Table 4-1: Code Index Number Classifications') {
			inCinTable = true;
			continue;
		}
		if (inCinTable) {
			if (line.startsWith('Note1:') || line.startsWith('Note2:') || line.startsWith('The following table')) {
				inCinTable = false;
			} else {
				const match = line.match(/^(0x[0-9A-Fa-f])\s+(\d(?:,\s*\d)?\s+or\s+\d|\d(?:,\s*\d)?|\d)\s+(.+)$/);
				if (match) {
					cinClassifications.push({
						cin: match[1],
						midi_x_size: match[2].trim(),
						description: match[3]
					});
					continue;
				}
			}
		}

		// Parsed Event Examples (Table 4-2)
		if (line === 'Table 4-2: Examples of Parsed MIDI Events in 32-bit USB-MIDI Event Packets') {
			inParsedEventsTable = true;
			continue;
		}
		if (inParsedEventsTable) {
			if (line.startsWith('5 Operational Model')) {
				inParsedEventsTable = false;
			} else if (line === 'Description MIDI_ver. 1.0 Event Packet') {
				continue;
			} else {
				// Check for "Special case:" single-line entries (contain p[hex] data token)
				if (line.startsWith('Special case:') && line.match(/\sp[0-9A-Fa-f]\s/)) {
					const tokens = line.split(/\s+/);
					if (tokens.length >= 6) {
						const pktTokens = tokens.slice(-4);
						const pkt = pktTokens.join(' ');
						const midiEnd = tokens.length - 4;
						let midiStart = midiEnd;
						for (let j = midiEnd - 1; j >= 0; j--) {
							if (tokens[j].match(/^[0-9A-Fa-f]{2}$/) || tokens[j].match(/^[0-9A-Fa-f][a-z]$/) || tokens[j].match(/^[a-z]{2}$/)) {
								midiStart = j;
							} else {
								break;
							}
						}
						if (midiStart < midiEnd) {
							const midi = tokens.slice(midiStart, midiEnd).join(' ');
							const desc = tokens.slice(0, midiStart).join(' ');
							parsedEventExamples.push({ description: desc, midi_event: midi, event_packet: pkt });
							continue;
						}
					}
				}
				// Multi-line SysEx entries: description spans multiple lines, then data lines
				if (line.startsWith('SysEx message') || (line.startsWith('Special case:') && !line.match(/\sp[0-9A-Fa-f]\s/))) {
					parsedEventDesc = line;
					continue;
				}
				// Continuation of multi-line description
				if (parsedEventDesc && (line.startsWith('Start of SysEx:') || line.startsWith('CIN=0x'))) {
					parsedEventDesc += ' ' + line;
					continue;
				}
				// Data line for multi-line SysEx entry: contains midi + packet(s)
				if (parsedEventDesc && line.match(/^[0-9A-Fa-f]{2}\s/)) {
					// Split on first p[hex] token to separate midi from packet
					const pSplit = line.match(/^(.+?)\s+(p[0-9A-Fa-f]\s.+)$/);
					if (pSplit) {
						const midiEvent = pSplit[1].trim();
						const packetParts = [pSplit[2].trim()];
						// Read next line for second packet if it starts with p[hex]
						if (i + 1 < lines.length) {
							const nextLine = lines[i + 1].trim();
							if (nextLine.match(/^p[0-9A-Fa-f]\s/)) {
								packetParts.push(nextLine);
								i++;
							}
						}
						parsedEventExamples.push({
							description: parsedEventDesc.trim(),
							midi_event: midiEvent,
							event_packet: packetParts.join(' + ')
						});
						parsedEventDesc = null;
					}
					continue;
				}
				// Single-line entries: split by tokens, packet = last 4, midi = preceding byte-like tokens
				const tokens = line.split(/\s+/);
				if (tokens.length >= 6) {
					const pktTokens = tokens.slice(-4);
					const pkt = pktTokens.join(' ');
					const midiEnd = tokens.length - 4;
					let midiStart = midiEnd;
					for (let j = midiEnd - 1; j >= 0; j--) {
						if (tokens[j].match(/^[0-9A-Fa-f]{2}$/) || tokens[j].match(/^[0-9A-Fa-f][a-z]$/) || tokens[j].match(/^[a-z]{2}$/)) {
							midiStart = j;
						} else {
							break;
						}
					}
					if (midiStart < midiEnd) {
						const midi = tokens.slice(midiStart, midiEnd).join(' ');
						const desc = tokens.slice(0, midiStart).join(' ');
						parsedEventExamples.push({ description: desc, midi_event: midi, event_packet: pkt });
						continue;
					}
				}
			}
		}

		// Element Capabilities (D0-D12)
		if (line.startsWith('D0: CUSTOM UNDEFINED')) {
			inElementCaps = true;
		}
		if (inElementCaps) {
			if (line.startsWith('iElement represents')) {
				inElementCaps = false;
			} else {
				const match = line.match(/^D(\d+):\s+(.+)$/);
				if (match) {
					elementCapabilities.push({
						bit: parseInt(match[1], 10),
						name: match[2]
					});
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
					interfaceDescriptorSubtypes.push({
						name: match[1],
						value: match[2]
					});
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
					endpointDescriptorSubtypes.push({
						name: match[1],
						value: match[2]
					});
					continue;
				}
			}
		}

		// Appendix A.3: Jack Types
		if (line === 'A.3 MS MIDI IN and OUT Jack types') {
			inJackTypes = true;
			continue;
		}
		if (inJackTypes) {
			if (line.startsWith('A.4 ')) {
				inJackTypes = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					jackTypes.push({
						name: match[1],
						value: match[2]
					});
					continue;
				}
			}
		}

		// Appendix A.5.1: Control Selectors
		if (line === 'A.5.1 Endpoint Control Selectors') {
			inControlSelectors = true;
			continue;
		}
		if (inControlSelectors) {
			if (line.startsWith('Appendix B')) {
				inControlSelectors = false;
			} else {
				const match = line.match(/^(\S+)\s+(0x[0-9A-Fa-f]{2})$/);
				if (match) {
					controlSelectors.push({
						name: match[1],
						value: match[2]
					});
					continue;
				}
			}
		}

		// Glossary (Section 8)
		if (line === '8 Glossary') {
			inGlossary = true;
			continue;
		}
		if (inGlossary) {
			if (line.startsWith('Appendix A')) {
				inGlossary = false;
			} else {
				const match = line.match(/^8\.(\d+)\s+(.+)$/);
				if (match) {
					glossary.push({
						section: parseInt(match[1], 10),
						term: match[2]
					});
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
				const match = line.match(/^(\d+\.\d+[a-z]?)\s+(.+)$/);
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
			title: 'USB Device Class Definition for MIDI Devices',
			doc_id: 'USB-MIDI-1.0',
			protocol: 'midi1',
			version: '1.0',
			date: '1999-11-01'
		},
		cin_classifications: cinClassifications,
		parsed_event_examples: parsedEventExamples,
		element_capabilities: elementCapabilities,
		interface_descriptor_subtypes: interfaceDescriptorSubtypes,
		endpoint_descriptor_subtypes: endpointDescriptorSubtypes,
		jack_types: jackTypes,
		control_selectors: controlSelectors,
		glossary: glossary,
		revision_history: revisionHistory,
		summary: {
			cin_classification_count: cinClassifications.length,
			parsed_event_example_count: parsedEventExamples.length,
			element_capability_count: elementCapabilities.length,
			interface_descriptor_subtype_count: interfaceDescriptorSubtypes.length,
			endpoint_descriptor_subtype_count: endpointDescriptorSubtypes.length,
			jack_type_count: jackTypes.length,
			control_selector_count: controlSelectors.length,
			glossary_count: glossary.length,
			revision_history_count: revisionHistory.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'usb-midi-1-0.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
