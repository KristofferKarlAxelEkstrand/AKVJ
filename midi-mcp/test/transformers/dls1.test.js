import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformDls1 } from '../../lib/transformers/dls1Transformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('DLS 1.1 Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/dls1v11b.md');
		result = await transformDls1(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Downloadable Sounds Level 1 Specification');
		expect(result.metadata.doc_id).toBe('DLS-1');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('1.1b');
		expect(result.metadata.date).toBe('2004-09');
	});

	describe('Connection Blocks (Table 1)', () => {
		it('should have 29 entries', () => {
			expect(result.connection_blocks).toHaveLength(29);
			expect(result.summary.connection_block_count).toBe(29);
		});

		it('should parse Cid 1* as LFO Frequency in LFO Section', () => {
			const cb = result.connection_blocks.find(c => c.cid === '1*');
			expect(cb.section).toBe('LFO Section');
			expect(cb.articulator_name).toBe('LFO Frequency');
			expect(cb.source).toBe('SRC_NONE');
			expect(cb.control).toBe('SRC_NONE');
			expect(cb.destination).toBe('DST_LFO_FREQ');
			expect(cb.transform).toBe('TRN_NONE');
		});

		it('should parse Cid 7* as EG1 Attack Time in EG1 Section', () => {
			const cb = result.connection_blocks.find(c => c.cid === '7*');
			expect(cb.section).toBe('EG1 Section');
			expect(cb.articulator_name).toBe('EG1 Attack Time');
			expect(cb.destination).toBe('DST_EG1_ATTACKTIME');
		});

		it('should parse Cid 19* as Initial Pan in Miscellaneous Section', () => {
			const cb = result.connection_blocks.find(c => c.cid === '19*');
			expect(cb.section).toBe('Miscellaneous Section');
			expect(cb.articulator_name).toBe('Initial Pan');
			expect(cb.destination).toBe('DST_PAN');
		});

		it('should parse inferred connection Cid 20 as EG1 To Attenuation', () => {
			const cb = result.connection_blocks.find(c => c.cid === '20');
			expect(cb.section).toBe('Inferred');
			expect(cb.articulator_name).toBe('EG1 To Attenuation');
			expect(cb.source).toBe('SRC_EG1');
			expect(cb.destination).toBe('DST_ATTENUATION');
		});

		it('should parse inferred connection Cid 22 with CONCAVE transform', () => {
			const cb = result.connection_blocks.find(c => c.cid === '22');
			expect(cb.section).toBe('Inferred');
			expect(cb.transform).toBe('TRN_CONCAVE');
			expect(cb.source).toBe('SRC_KEYONVELOCITY');
		});

		it('should parse Cid 29 as RPN2 to Pitch', () => {
			const cb = result.connection_blocks.find(c => c.cid === '29');
			expect(cb.articulator_name).toBe('RPN2 to Pitch');
			expect(cb.source).toBe('SRC_RPN2');
			expect(cb.destination).toBe('DST_PITCH');
		});

		it('should have 6 LFO Section entries', () => {
			const lfo = result.connection_blocks.filter(c => c.section === 'LFO Section');
			expect(lfo).toHaveLength(6);
		});

		it('should have 6 EG1 Section entries', () => {
			const eg1 = result.connection_blocks.filter(c => c.section === 'EG1 Section');
			expect(eg1).toHaveLength(6);
		});

		it('should have 6 EG2 Section entries', () => {
			const eg2 = result.connection_blocks.filter(c => c.section === 'EG2 Section');
			expect(eg2).toHaveLength(6);
		});

		it('should have 1 Miscellaneous Section entry', () => {
			const misc = result.connection_blocks.filter(c => c.section === 'Miscellaneous Section');
			expect(misc).toHaveLength(1);
		});

		it('should have 10 Inferred entries', () => {
			const inferred = result.connection_blocks.filter(c => c.section === 'Inferred');
			expect(inferred).toHaveLength(10);
		});
	});

	describe('Articulator Defaults (Table 2)', () => {
		it('should have 20 entries', () => {
			expect(result.articulator_defaults).toHaveLength(20);
			expect(result.summary.articulator_default_count).toBe(20);
		});

		it('should parse LFO Frequency defaults', () => {
			const ad = result.articulator_defaults.find(a => a.articulator === 'LFO Frequency');
			expect(ad.section).toBe('LFO Section');
			expect(ad.default_value).toBe('5 Hz');
			expect(ad.min_value).toBe('0.1 Hz');
			expect(ad.max_value).toBe('10 Hz');
			expect(ad.units).toBe('32 bit pitch cents');
		});

		it('should parse EG1 Sustain Level defaults', () => {
			const ad = result.articulator_defaults.find(a => a.articulator === 'EG1 Sustain Level');
			expect(ad.default_value).toBe('100 %');
			expect(ad.units).toBe('0.1 % units');
		});

		it('should parse EG2 to Pitch defaults', () => {
			const ad = result.articulator_defaults.find(a => a.articulator === 'EG2 to Pitch');
			expect(ad.section).toBe('EG2 Section');
			expect(ad.max_value).toBe('1200 cents');
		});

		it('should parse Initial Pan defaults', () => {
			const ad = result.articulator_defaults.find(a => a.articulator === 'Initial Pan');
			expect(ad.section).toBe('Miscellaneous Section');
			expect(ad.min_value).toBe('-50%');
			expect(ad.max_value).toBe('50%');
		});

		it('should have 6 LFO Section entries', () => {
			const lfo = result.articulator_defaults.filter(a => a.section === 'LFO Section');
			expect(lfo).toHaveLength(6);
		});

		it('should have 6 EG1 Section entries', () => {
			const eg1 = result.articulator_defaults.filter(a => a.section === 'EG1 Section');
			expect(eg1).toHaveLength(6);
		});

		it('should have 7 EG2 Section entries', () => {
			const eg2 = result.articulator_defaults.filter(a => a.section === 'EG2 Section');
			expect(eg2).toHaveLength(7);
		});
	});

	describe('Example Parameters (Table 3)', () => {
		it('should have 8 entries', () => {
			expect(result.example_parameters).toHaveLength(8);
			expect(result.summary.example_parameter_count).toBe(8);
		});

		it('should parse CC1 as 25', () => {
			const p = result.example_parameters.find(p => p.parameter === 'CC1');
			expect(p.value).toBe('25');
		});

		it('should parse CC7 as 100', () => {
			const p = result.example_parameters.find(p => p.parameter === 'CC7');
			expect(p.value).toBe('100');
		});

		it('should parse Pitch Wheel as 365', () => {
			const p = result.example_parameters.find(p => p.parameter === 'Pitch Wheel');
			expect(p.value).toBe('365');
		});

		it('should parse Key On Velocity as 110', () => {
			const p = result.example_parameters.find(p => p.parameter === 'Key On Velocity');
			expect(p.value).toBe('110');
		});
	});

	describe('RIFF Definitions (Table 4)', () => {
		it('should have 11 entries', () => {
			expect(result.riff_definitions).toHaveLength(11);
			expect(result.summary.riff_definition_count).toBe(11);
		});

		it('should parse <colh-ck> definition', () => {
			const rd = result.riff_definitions.find(r => r.chunk === '<colh-ck>');
			expect(rd.definition).toContain('DLS collection header');
		});

		it('should parse <art1-ck> definition', () => {
			const rd = result.riff_definitions.find(r => r.chunk === '<art1-ck>');
			expect(rd.definition).toContain('level 1 articulator');
		});

		it('should parse <info_text-ck> definition', () => {
			const rd = result.riff_definitions.find(r => r.chunk === '<info_text-ck>');
			expect(rd.definition).toContain('text chunk within an <INFO-list>');
		});
	});

	describe('DLS System Messages', () => {
		it('should have 4 entries', () => {
			expect(result.dls_system_messages).toHaveLength(4);
			expect(result.summary.dls_system_message_count).toBe(4);
		});

		it('should parse Turn DLS Level 1 On message', () => {
			const msg = result.dls_system_messages.find(m => m.name === 'Turn DLS Level 1 On');
			expect(msg.message).toBe('F0 7E < device ID > 0A 01 F7');
			expect(msg.bytes).toHaveLength(5);
			expect(msg.bytes[0].byte).toBe('F0 7E');
			expect(msg.bytes[0].description).toBe('Universal Non-Real Time SysEx header');
		});

		it('should parse Turn DLS Level 1 Off message', () => {
			const msg = result.dls_system_messages.find(m => m.name === 'Turn DLS Level 1 Off');
			expect(msg.message).toContain('0A 02 F7');
		});

		it('should parse Turn DLS Level 1 Voice Allocation Off', () => {
			const msg = result.dls_system_messages.find(m => m.name === 'Turn DLS Level 1 Voice Allocation Off');
			expect(msg.message).toContain('0A 03 F7');
		});

		it('should parse Turn DLS Level 1 Voice Allocation On', () => {
			const msg = result.dls_system_messages.find(m => m.name === 'Turn DLS Level 1 Voice Allocation On');
			expect(msg.message).toContain('0A 04 F7');
		});

		it('should have sub-ID #1 = 0A for all messages', () => {
			result.dls_system_messages.forEach(msg => {
				const subId1 = msg.bytes.find(b => b.byte === '0A');
				expect(subId1).toBeDefined();
				expect(subId1.description).toContain('DLS Level 1 message');
			});
		});
	});

	describe('Connection Sources', () => {
		it('should have 14 entries', () => {
			expect(result.connection_sources).toHaveLength(14);
			expect(result.summary.connection_source_count).toBe(14);
		});

		it('should parse CONN_SRC_NONE as No Source', () => {
			const src = result.connection_sources.find(s => s.name === 'CONN_SRC_NONE');
			expect(src.description).toBe('No Source');
		});

		it('should parse CONN_SRC_LFO as Low Frequency Oscillator', () => {
			const src = result.connection_sources.find(s => s.name === 'CONN_SRC_LFO');
			expect(src.description).toBe('Low Frequency Oscillator');
		});

		it('should parse CONN_SRC_CC1 as Modulation Wheel', () => {
			const src = result.connection_sources.find(s => s.name === 'CONN_SRC_CC1');
			expect(src.description).toBe('Modulation Wheel');
		});

		it('should parse CONN_SRC_PITCHWHEEL as Pitch Wheel', () => {
			const src = result.connection_sources.find(s => s.name === 'CONN_SRC_PITCHWHEEL');
			expect(src.description).toBe('Pitch Wheel');
		});
	});

	describe('Connection Destinations', () => {
		it('should have 14 entries', () => {
			expect(result.connection_destinations).toHaveLength(14);
			expect(result.summary.connection_destination_count).toBe(14);
		});

		it('should parse CONN_DST_NONE as No Destination', () => {
			const dst = result.connection_destinations.find(d => d.name === 'CONN_DST_NONE');
			expect(dst.description).toBe('No Destination');
		});

		it('should parse CONN_DST_ATTENUATION as Attenuation', () => {
			const dst = result.connection_destinations.find(d => d.name === 'CONN_DST_ATTENUATION');
			expect(dst.description).toBe('Attenuation');
		});

		it('should parse CONN_DST_EG1_SUSTAINLEVEL as EG1 Sustain Level', () => {
			const dst = result.connection_destinations.find(d => d.name === 'CONN_DST_EG1_SUSTAINLEVEL');
			expect(dst.description).toBe('EG1 Sustain Level');
		});

		it('should parse CONN_DST_LFO_FREQUENCY as LFO Frequency', () => {
			const dst = result.connection_destinations.find(d => d.name === 'CONN_DST_LFO_FREQUENCY');
			expect(dst.description).toBe('LFO Frequency');
		});
	});

	describe('Connection Transforms', () => {
		it('should have 2 entries', () => {
			expect(result.connection_transforms).toHaveLength(2);
			expect(result.summary.connection_transform_count).toBe(2);
		});

		it('should parse CONN_TRN_NONE as No Transform', () => {
			const trn = result.connection_transforms.find(t => t.name === 'CONN_TRN_NONE');
			expect(trn.description).toBe('No Transform');
		});

		it('should parse CONN_TRN_CONCAVE as Concave Transform', () => {
			const trn = result.connection_transforms.find(t => t.name === 'CONN_TRN_CONCAVE');
			expect(trn.description).toBe('Concave Transform');
		});
	});

	describe('INFO Chunk IDs', () => {
		it('should have 17 entries', () => {
			expect(result.info_chunk_ids).toHaveLength(17);
			expect(result.summary.info_chunk_id_count).toBe(17);
		});

		it('should parse IARL as Archival Location', () => {
			const ic = result.info_chunk_ids.find(c => c.chunk_id === 'IARL');
			expect(ic.description).toContain('Archival Location');
		});

		it('should parse ICMT as Comments', () => {
			const ic = result.info_chunk_ids.find(c => c.chunk_id === 'ICMT');
			expect(ic.description).toContain('Comments');
		});

		it('should parse ICOP as Copyright', () => {
			const ic = result.info_chunk_ids.find(c => c.chunk_id === 'ICOP');
			expect(ic.description).toContain('Copyright');
		});

		it('should parse INAM as Name', () => {
			const ic = result.info_chunk_ids.find(c => c.chunk_id === 'INAM');
			expect(ic.description).toContain('Name');
		});

		it('should parse ITCH as Technician', () => {
			const ic = result.info_chunk_ids.find(c => c.chunk_id === 'ITCH');
			expect(ic.description).toContain('Technician');
		});
	});

	describe('Parameter Units (Appendix A)', () => {
		it('should have 5 entries', () => {
			expect(result.parameter_units).toHaveLength(5);
			expect(result.summary.parameter_unit_count).toBe(5);
		});

		it('should parse 32-bit Time Cents with formulas', () => {
			const pu = result.parameter_units.find(u => u.name === '32-bit Time Cents');
			expect(pu.formulas).toHaveLength(3);
			expect(pu.formulas[1]).toContain('tc = log2');
		});

		it('should parse 32-bit Relative Gain with formulas', () => {
			const pu = result.parameter_units.find(u => u.name === '32-bit Relative Gain');
			expect(pu.formulas).toHaveLength(3);
			expect(pu.formulas[1]).toContain('cb = log10');
		});

		it('should parse 0.1 % units', () => {
			const pu = result.parameter_units.find(u => u.name === '0.1 % units');
			expect(pu.formulas).toHaveLength(3);
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.connection_block_count).toBe(29);
			expect(s.articulator_default_count).toBe(20);
			expect(s.example_parameter_count).toBe(8);
			expect(s.riff_definition_count).toBe(11);
			expect(s.dls_system_message_count).toBe(4);
			expect(s.connection_source_count).toBe(14);
			expect(s.connection_destination_count).toBe(14);
			expect(s.connection_transform_count).toBe(2);
			expect(s.info_chunk_id_count).toBe(17);
			expect(s.parameter_unit_count).toBe(5);
		});
	});
});
