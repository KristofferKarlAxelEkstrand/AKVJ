import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformMidiOverIeee1394 } from '../../lib/transformers/midiOverIeee1394Transformer.js';

describe('MIDI over IEEE-1394 (RP-027) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/rp27v10-spec.md');
		result = await transformMidiOverIeee1394(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI over IEEE-1394 (FireWire) Specification');
		expect(result.metadata.doc_id).toBe('RP-027');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('rp27v10-spec.md');
	});

	describe('AM824 Labels', () => {
		it('should have 4 entries', () => {
			expect(result.am824_labels).toHaveLength(4);
			expect(result.summary.am824_label_count).toBe(4);
		});

		it('should parse 80H as No Data', () => {
			const entry = result.am824_labels.find(l => l.label === '80H');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('No Data');
		});

		it('should parse 81H as 1 byte', () => {
			const entry = result.am824_labels.find(l => l.label === '81H');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('1 byte');
		});

		it('should parse 82H as 2 bytes', () => {
			const entry = result.am824_labels.find(l => l.label === '82H');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('2 bytes');
		});

		it('should parse 83H as 3 bytes', () => {
			const entry = result.am824_labels.find(l => l.label === '83H');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('3 bytes');
		});
	});

	describe('SYT Intervals', () => {
		it('should have 3 entries', () => {
			expect(result.syt_intervals).toHaveLength(3);
			expect(result.summary.syt_interval_count).toBe(3);
		});

		it('should parse 32kHz/44.1kHz/48kHz with SYT_INTERVAL 8', () => {
			const entry = result.syt_intervals[0];
			expect(entry.sampling_frequencies).toContain('32kHz');
			expect(entry.syt_interval).toBe(8);
		});

		it('should parse 96kHz with SYT_INTERVAL 16', () => {
			const entry = result.syt_intervals.find(s => s.sampling_frequencies.includes('96 kHz'));
			expect(entry).toBeDefined();
			expect(entry.syt_interval).toBe(16);
		});

		it('should parse 192kHz with SYT_INTERVAL 32', () => {
			const entry = result.syt_intervals.find(s => s.sampling_frequencies.includes('192 kHz'));
			expect(entry).toBeDefined();
			expect(entry.syt_interval).toBe(32);
		});
	});

	describe('CIP Header Fields', () => {
		it('should have 7 entries', () => {
			expect(result.cip_header_fields).toHaveLength(7);
			expect(result.summary.cip_header_field_count).toBe(7);
		});

		it('should parse SID field', () => {
			const entry = result.cip_header_fields.find(f => f.field === 'SID');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Source ID');
		});

		it('should parse DBC field', () => {
			const entry = result.cip_header_fields.find(f => f.field === 'DBC');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Data Block Count');
		});

		it('should parse SYT field', () => {
			const entry = result.cip_header_fields.find(f => f.field === 'SYT');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Time stamp');
		});
	});

	describe('Unit Directory Entries', () => {
		it('should have 3 entries', () => {
			expect(result.unit_directory_entries).toHaveLength(3);
			expect(result.summary.unit_directory_entry_count).toBe(3);
		});

		it('should parse Specifier_ID', () => {
			const entry = result.unit_directory_entries.find(e => e.entry_name === 'Specifier_ID');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('00-01-F6');
		});

		it('should parse Version', () => {
			const entry = result.unit_directory_entries.find(e => e.entry_name === 'Version');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('01');
		});

		it('should parse Dependent_info', () => {
			const entry = result.unit_directory_entries.find(e => e.entry_name === 'Dependent_info');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('offset');
		});
	});

	describe('CSR-ROM Entries', () => {
		it('should have 12 entries', () => {
			expect(result.csr_rom_entries).toHaveLength(12);
			expect(result.summary.csr_rom_entry_count).toBe(12);
		});

		it('should parse Instance directory offset', () => {
			const entry = result.csr_rom_entries.find(e => e.entry.includes('Instance directory offset'));
			expect(entry).toBeDefined();
			expect(entry.value).toBe('D8 16');
		});

		it('should parse Specifier_ID (0001F6)', () => {
			const entry = result.csr_rom_entries.find(e => e.entry.includes('Specifier_ID (0001F6'));
			expect(entry).toBeDefined();
			expect(entry.value).toBe('12 16');
		});

		it('should parse MIDI register definition', () => {
			const entry = result.csr_rom_entries.find(e => e.entry === '00 00 16');
			expect(entry).toBeDefined();
			expect(entry.value).toContain('Total byte size');
		});
	});

	describe('MIDI Message Structure', () => {
		it('should have 4 entries', () => {
			expect(result.midi_message_structure).toHaveLength(4);
			expect(result.summary.midi_message_structure_count).toBe(4);
		});

		it('should parse One byte Message', () => {
			const entry = result.midi_message_structure.find(m => m.message_type === 'One byte Message');
			expect(entry).toBeDefined();
			expect(entry.structure).toBe('Status Byte');
		});

		it('should parse System Exclusive Message', () => {
			const entry = result.midi_message_structure.find(m => m.message_type === 'System Exclusive Message');
			expect(entry).toBeDefined();
			expect(entry.structure).toContain('EOX');
		});
	});

	describe('Timing Accuracy', () => {
		it('should have 4 entries', () => {
			expect(result.timing_accuracy).toHaveLength(4);
			expect(result.summary.timing_accuracy_count).toBe(4);
		});

		it('should parse 32 kHz timing', () => {
			const entry = result.timing_accuracy.find(t => t.sfc === '32 kHz');
			expect(entry).toBeDefined();
			expect(entry.syt_interval).toBe('250 microseconds');
			expect(entry.timing_accuracy).toBe('+/- 125 microseconds');
		});

		it('should parse 48 kHz timing', () => {
			const entry = result.timing_accuracy.find(t => t.sfc === '48 kHz');
			expect(entry).toBeDefined();
			expect(entry.timing_accuracy).toBe('+/- 83 microseconds');
		});
	});

	describe('Bandwidth Formulas', () => {
		it('should have 3 entries', () => {
			expect(result.bandwidth_formulas).toHaveLength(3);
			expect(result.summary.bandwidth_formula_count).toBe(3);
		});

		it('should parse 81H formula with 8-bit width', () => {
			const entry = result.bandwidth_formulas.find(f => f.label === '81H');
			expect(entry).toBeDefined();
			expect(entry.bit_width).toBe(8);
		});

		it('should parse 82H formula with 16-bit width', () => {
			const entry = result.bandwidth_formulas.find(f => f.label === '82H');
			expect(entry).toBeDefined();
			expect(entry.bit_width).toBe(16);
		});

		it('should parse 83H formula with 24-bit width', () => {
			const entry = result.bandwidth_formulas.find(f => f.label === '83H');
			expect(entry).toBeDefined();
			expect(entry.bit_width).toBe(24);
		});
	});

	describe('Transmission Modes', () => {
		it('should have 3 modes', () => {
			expect(result.transmission_modes).toHaveLength(3);
			expect(result.summary.transmission_mode_count).toBe(3);
		});

		it('should parse MIDI1.0-SPEED with labels 80H and 81H', () => {
			const mode = result.transmission_modes.find(m => m.mode_number === 2);
			expect(mode).toBeDefined();
			expect(mode.mode_name).toContain('SPEED');
			expect(mode.labels_allowed).toContain('80H');
			expect(mode.labels_allowed).toContain('81H');
			expect(mode.labels_allowed).toHaveLength(2);
		});

		it('should parse MIDI1.0-2X-SPEED with labels 80H, 81H, 82H', () => {
			const mode = result.transmission_modes.find(m => m.mode_number === 3);
			expect(mode).toBeDefined();
			expect(mode.labels_allowed).toHaveLength(3);
			expect(mode.labels_allowed).toContain('82H');
		});

		it('should parse MIDI1.0-3X-SPEED with labels 80H, 81H, 82H, 83H', () => {
			const mode = result.transmission_modes.find(m => m.mode_number === 4);
			expect(mode).toBeDefined();
			expect(mode.labels_allowed).toHaveLength(4);
			expect(mode.labels_allowed).toContain('83H');
		});
	});

	describe('Terminology', () => {
		it('should have entries', () => {
			expect(result.terminology.length).toBeGreaterThan(5);
			expect(result.summary.terminology_count).toBeGreaterThan(5);
		});

		it('should parse CIP term', () => {
			const entry = result.terminology.find(t => t.term === 'CIP');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('Common Isochronous Packet');
		});

		it('should parse Cluster term', () => {
			const entry = result.terminology.find(t => t.term === 'Cluster');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('ordered collection of events');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.am824_label_count).toBe(4);
			expect(result.summary.syt_interval_count).toBe(3);
			expect(result.summary.cip_header_field_count).toBe(7);
			expect(result.summary.unit_directory_entry_count).toBe(3);
			expect(result.summary.csr_rom_entry_count).toBe(12);
			expect(result.summary.midi_message_structure_count).toBe(4);
			expect(result.summary.timing_accuracy_count).toBe(4);
			expect(result.summary.bandwidth_formula_count).toBe(3);
			expect(result.summary.transmission_mode_count).toBe(3);
		});
	});
});
