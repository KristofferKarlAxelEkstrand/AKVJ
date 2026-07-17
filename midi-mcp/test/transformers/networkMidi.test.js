import { describe, it, expect, beforeAll } from 'vitest';
import { transformNetworkMidi } from '../../lib/transformers/networkMidiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/m2-124-um-v1-0-1-network-midi-2-0-udp.md');

let result;

beforeAll(async () => {
	result = await transformNetworkMidi(MARKDOWN_PATH);
});

describe('Network MIDI 2.0 (UDP) Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('User Datagram Protocol');
			expect(result.metadata.doc_id).toBe('M2-124-UM');
			expect(result.metadata.version).toBe('1.0.1');
			expect(result.metadata.protocol).toBe('midi2');
			expect(result.metadata.pages).toBe(56);
		});
	});

	describe('Version History', () => {
		it('should have 2 version history entries', () => {
			expect(result.version_history).toHaveLength(2);
		});

		it('should parse initial release', () => {
			const entry = result.version_history[0];
			expect(entry.date).toBe('2024-11-20');
			expect(entry.version).toBe('1.0');
			expect(entry.changes).toContain('Initial release');
		});

		it('should parse 1.0.1 release', () => {
			const entry = result.version_history[1];
			expect(entry.date).toBe('2025-12-01');
			expect(entry.version).toBe('1.0.1');
			expect(entry.changes).toContain('Clarifications');
		});
	});

	describe('Definitions', () => {
		it('should have definitions', () => {
			expect(result.definitions.length).toBeGreaterThan(20);
		});

		it('should parse AMEI', () => {
			const entry = result.definitions.find(e => e.term === 'AMEI');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('Association of Musical Electronics Industry');
		});

		it('should parse UMP', () => {
			const entry = result.definitions.find(e => e.term === 'UMP');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('Universal MIDI Packet');
		});

		it('should parse Session', () => {
			const entry = result.definitions.find(e => e.term === 'Session');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('Client connecting to a Host');
		});

		it('should parse CryptoNonce', () => {
			const entry = result.definitions.find(e => e.term === 'CryptoNonce');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('cryptographic nonce');
		});
	});

	describe('Conformance Words', () => {
		it('should have 7 conformance words', () => {
			expect(result.conformance_words).toHaveLength(7);
		});

		it('should parse shall as required', () => {
			const entry = result.conformance_words.find(e => e.word === 'shall');
			expect(entry).toBeDefined();
			expect(entry.category).toBe('required');
			expect(entry.reserved_for).toContain('requirement');
		});

		it('should parse must as descriptive', () => {
			const entry = result.conformance_words.find(e => e.word === 'must');
			expect(entry).toBeDefined();
			expect(entry.category).toBe('descriptive');
			expect(entry.reserved_for).toContain('unavoidability');
		});

		it('should parse might as descriptive', () => {
			const entry = result.conformance_words.find(e => e.word === 'might');
			expect(entry).toBeDefined();
			expect(entry.category).toBe('descriptive');
			expect(entry.reserved_for).toContain('possibility');
		});
	});

	describe('Normative References', () => {
		it('should have 14 references', () => {
			expect(result.normative_references).toHaveLength(14);
		});

		it('should parse [RFC768]', () => {
			const entry = result.normative_references.find(e => e.reference === '[RFC768]');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('User Datagram Protocol');
		});

		it('should parse [MA06]', () => {
			const entry = result.normative_references.find(e => e.reference === '[MA06]');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Universal MIDI Packet');
		});

		it('should parse [RFC6763]', () => {
			const entry = result.normative_references.find(e => e.reference === '[RFC6763]');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('DNS-Based Service Discovery');
		});
	});

	describe('DNS Records', () => {
		it('should have PTR fields', () => {
			expect(result.dns_records.ptr.length).toBeGreaterThanOrEqual(2);
		});

		it('should parse PTR Service Type', () => {
			const entry = result.dns_records.ptr.find(e => e.field === 'Service Type');
			expect(entry).toBeDefined();
			expect(entry.value).toContain('_midi2._udp.local');
		});

		it('should have SRV fields', () => {
			expect(result.dns_records.srv.length).toBeGreaterThanOrEqual(3);
		});

		it('should parse SRV Port', () => {
			const entry = result.dns_records.srv.find(e => e.field === 'Port');
			expect(entry).toBeDefined();
		});

		it('should have TXT fields', () => {
			expect(result.dns_records.txt.length).toBeGreaterThanOrEqual(2);
		});

		it('should parse TXT UMPEndpointName', () => {
			const entry = result.dns_records.txt.find(e => e.field === 'UMPEndpointName');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('UMP Endpoint Name');
		});

		it('should parse TXT ProductInstanceId', () => {
			const entry = result.dns_records.txt.find(e => e.field === 'ProductInstanceId');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('unique Id');
		});
	});

	describe('Signature', () => {
		it('should have correct signature value', () => {
			expect(result.signature.value).toBe('0x4D494449');
			expect(result.signature.ascii).toBe('MIDI');
			expect(result.signature.size_bytes).toBe(4);
		});

		it('should have a description', () => {
			expect(result.signature.description).toContain('UDP packets');
		});
	});

	describe('Command Packet Header', () => {
		it('should have 3 fields', () => {
			expect(result.command_packet_header.fields).toHaveLength(3);
		});

		it('should parse Command Code', () => {
			const entry = result.command_packet_header.fields.find(e => e.field === 'Command Code');
			expect(entry).toBeDefined();
			expect(entry.size_bytes).toBe(1);
		});

		it('should parse Command Payload Length', () => {
			const entry = result.command_packet_header.fields.find(e => e.field === 'Command Payload Length');
			expect(entry).toBeDefined();
			expect(entry.size_bytes).toBe(1);
		});

		it('should parse Command Specific Data', () => {
			const entry = result.command_packet_header.fields.find(e => e.field === 'Command Specific Data');
			expect(entry).toBeDefined();
			expect(entry.size_bytes).toBe(2);
		});
	});

	describe('Commands', () => {
		it('should have 17 commands', () => {
			expect(result.commands).toHaveLength(17);
		});

		it('should parse UMP Data command (0xFF)', () => {
			const entry = result.commands.find(e => e.code === '0xFF');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('UMP Data');
		});

		it('should parse Invitation command (0x01)', () => {
			const entry = result.commands.find(e => e.code === '0x01');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Invitation');
		});

		it('should parse Bye command (0xF0)', () => {
			const entry = result.commands.find(e => e.code === '0xF0');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Bye');
		});

		it('should parse NAK command (0x8F)', () => {
			const entry = result.commands.find(e => e.code === '0x8F');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('NAK');
		});

		it('should parse Session Reset command (0x82)', () => {
			const entry = result.commands.find(e => e.code === '0x82');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Session Reset');
		});
	});

	describe('Session States', () => {
		it('should have 6 session states', () => {
			expect(result.session_states).toHaveLength(6);
		});

		it('should parse Idle state', () => {
			const entry = result.session_states.find(e => e.state === 'Idle');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Device may be aware');
		});

		it('should parse Established Session state', () => {
			const entry = result.session_states.find(e => e.state === 'Established Session');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Invitation accepted');
		});

		it('should parse Pending Bye state', () => {
			const entry = result.session_states.find(e => e.state === 'Pending Bye');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Bye');
		});
	});

	describe('Commands Per Session State', () => {
		it('should have 7 state entries', () => {
			expect(result.commands_per_session_state).toHaveLength(7);
		});

		it('should parse Every State commands', () => {
			const entry = result.commands_per_session_state.find(e => e.state === 'Every State');
			expect(entry).toBeDefined();
			expect(entry.valid_commands).toContain('NAK');
			expect(entry.valid_commands).toContain('Ping');
			expect(entry.valid_commands).toContain('Bye');
		});

		it('should parse Established Session commands', () => {
			const entry = result.commands_per_session_state.find(e => e.state === 'Established Session');
			expect(entry).toBeDefined();
			expect(entry.valid_commands).toContain('UMP Data');
			expect(entry.valid_commands).toContain('Retransmit Request');
		});

		it('should parse Idle commands', () => {
			const entry = result.commands_per_session_state.find(e => e.state === 'Idle');
			expect(entry).toBeDefined();
			expect(entry.valid_commands).toContain('Invitation');
		});
	});

	describe('NAK Reasons', () => {
		it('should have 5 NAK reasons', () => {
			expect(result.nak_reasons).toHaveLength(5);
		});

		it('should parse 0x00 Other', () => {
			const entry = result.nak_reasons.find(e => e.code === '0x00');
			expect(entry).toBeDefined();
			expect(entry.reason).toBe('Other');
		});

		it('should parse 0x01 Command Not Supported', () => {
			const entry = result.nak_reasons.find(e => e.code === '0x01');
			expect(entry).toBeDefined();
			expect(entry.reason).toBe('Command Not Supported');
		});

		it('should parse 0x20 Bad Ping Reply', () => {
			const entry = result.nak_reasons.find(e => e.code === '0x20');
			expect(entry).toBeDefined();
			expect(entry.reason).toBe('Bad Ping Reply');
		});
	});

	describe('Bye Reasons', () => {
		it('should have 18 bye reasons (including 3 category headers)', () => {
			expect(result.bye_reasons).toHaveLength(18);
		});

		it('should parse 0x00 Unknown or Undefined', () => {
			const entry = result.bye_reasons.find(e => e.code === '0x00');
			expect(entry).toBeDefined();
			expect(entry.reason).toBe('Unknown or Undefined');
		});

		it('should parse 0x80 Invitation Canceled', () => {
			const entry = result.bye_reasons.find(e => e.code === '0x80');
			expect(entry).toBeDefined();
			expect(entry.reason).toBe('Invitation Canceled');
		});

		it('should have category headers', () => {
			const headers = result.bye_reasons.filter(e => e.description === 'category header');
			expect(headers).toHaveLength(3);
		});
	});

	describe('Error Reasons', () => {
		it('should have 2 error reasons', () => {
			expect(result.error_reasons).toHaveLength(2);
		});

		it('should parse 0x00 Unknown', () => {
			const entry = result.error_reasons.find(e => e.code === '0x00');
			expect(entry).toBeDefined();
			expect(entry.reason).toBe('Unknown');
		});

		it('should parse 0x01 Transmit buffer', () => {
			const entry = result.error_reasons.find(e => e.code === '0x01');
			expect(entry).toBeDefined();
			expect(entry.reason).toContain('Transmit buffer');
		});
	});

	describe('Authentication States', () => {
		it('should have auth state entries', () => {
			expect(result.authentication_states.length).toBeGreaterThanOrEqual(4);
		});

		it('should parse 0x00 First authentication request', () => {
			const entry = result.authentication_states.find(e => e.code === '0x00');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('First authentication');
		});
	});

	describe('Command Tables', () => {
		it('should have 18 command tables', () => {
			expect(Object.keys(result.command_tables)).toHaveLength(18);
		});

		it('should parse Table 10 (Invitation)', () => {
			const table = result.command_tables.table_10;
			expect(table).toBeDefined();
			expect(table.name).toContain('Invitation');
			expect(table.fields.length).toBeGreaterThan(0);
		});

		it('should parse Table 29 (UMP Data)', () => {
			const table = result.command_tables.table_29;
			expect(table).toBeDefined();
			expect(table.name).toContain('UMP Data');
			expect(table.fields.length).toBeGreaterThan(0);
		});

		it('should have Command Code field in Table 10', () => {
			const table = result.command_tables.table_10;
			const codeField = table.fields.find(f => f.field === 'Command Code');
			expect(codeField).toBeDefined();
			expect(codeField.values).toBe('0x01');
		});

		it('should have Command Code field in Table 29', () => {
			const table = result.command_tables.table_29;
			const codeField = table.fields.find(f => f.field === 'Command Code');
			expect(codeField).toBeDefined();
			expect(codeField.values).toBe('0xFF');
		});

		it('should have CryptoNonce field in Table 14', () => {
			const table = result.command_tables.table_14;
			const nonceField = table.fields.find(f => f.field === 'CryptoNonce');
			expect(nonceField).toBeDefined();
			expect(String(nonceField.size_bytes)).toBe('16');
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.version_history_count).toBe(2);
			expect(result.summary.definition_count).toBeGreaterThan(20);
			expect(result.summary.conformance_word_count).toBe(7);
			expect(result.summary.normative_reference_count).toBe(14);
			expect(result.summary.command_count).toBe(17);
			expect(result.summary.session_state_count).toBe(6);
			expect(result.summary.command_table_count).toBe(18);
			expect(result.summary.nak_reason_count).toBe(5);
			expect(result.summary.bye_reason_count).toBe(18);
			expect(result.summary.error_reason_count).toBe(2);
		});
	});
});
