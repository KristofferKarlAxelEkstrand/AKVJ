import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa24 } from '../../lib/transformers/ca24Transformer.js';

describe('CA-024 Global Parameter Control Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca24-global-parameter-control-sysex-message.md');
		result = await transformCa24(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Global Parameter Control');
		expect(result.metadata.doc_id).toBe('CA-024');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('ca24-global-parameter-control-sysex-message.md');
	});

	describe('Message format byte fields', () => {
		it('should have 7 byte fields', () => {
			expect(result.message_format.byte_fields).toHaveLength(7);
			expect(result.summary.byte_field_count).toBe(7);
		});

		it('should parse sw (Slot Path Length)', () => {
			const field = result.message_format.byte_fields.find(f => f.code === 'sw');
			expect(field).toBeDefined();
			expect(field.description).toContain('Slot Path Length');
			expect(field.description).toContain('2-byte entries');
		});

		it('should parse pw (Parameter ID Width)', () => {
			const field = result.message_format.byte_fields.find(f => f.code === 'pw');
			expect(field).toBeDefined();
			expect(field.description).toContain('Parameter ID Width');
		});

		it('should parse vw (Value Width)', () => {
			const field = result.message_format.byte_fields.find(f => f.code === 'vw');
			expect(field).toBeDefined();
			expect(field.description).toContain('Value Width');
		});

		it('should parse sh (Slot Number MSB)', () => {
			const field = result.message_format.byte_fields.find(f => f.code === 'sh');
			expect(field).toBeDefined();
			expect(field.description).toContain('Slot Number MSB');
		});

		it('should parse sl (Slot Number LSB)', () => {
			const field = result.message_format.byte_fields.find(f => f.code === 'sl');
			expect(field).toBeDefined();
			expect(field.description).toContain('Slot Number LSB');
		});

		it('should parse pp (Parameter ID)', () => {
			const field = result.message_format.byte_fields.find(f => f.code === 'pp');
			expect(field).toBeDefined();
			expect(field.description).toContain('Parameter ID');
		});

		it('should parse vv (Parameter Value)', () => {
			const field = result.message_format.byte_fields.find(f => f.code === 'vv');
			expect(field).toBeDefined();
			expect(field.description).toContain('Parameter Value');
		});
	});

	describe('Example message fields', () => {
		it('should have 11 example fields', () => {
			expect(result.example.fields).toHaveLength(11);
			expect(result.summary.example_field_count).toBe(11);
		});

		it('should start with <device ID> field', () => {
			expect(result.example.fields[0].hex).toBe('<device ID>');
			expect(result.example.fields[0].description).toContain('ID of Target Device');
		});

		it('should have Slot Path Length = 2', () => {
			const field = result.example.fields.find(f => f.hex === '02' && f.description.includes('Slot Path Length'));
			expect(field).toBeDefined();
		});

		it('should have Parameter ID Width = 1', () => {
			const field = result.example.fields.find(f => f.hex === '01' && f.description.includes('Parameter ID Width'));
			expect(field).toBeDefined();
		});

		it('should have Value Width = 2', () => {
			const field = result.example.fields.find(f => f.hex === '02' && f.description.includes('Value Width'));
			expect(field).toBeDefined();
		});

		it('should have Slot Path 1 MSB = 1 (Main mix)', () => {
			const field = result.example.fields.find(f => f.hex === '01' && f.description.includes('Slot Path 1 MSB'));
			expect(field).toBeDefined();
			expect(field.description).toContain('Main mix');
		});

		it('should have Slot Path 1 LSB = 47H (channel 71)', () => {
			const field = result.example.fields.find(f => f.hex === '47' && f.description.includes('Slot Path 1 LSB'));
			expect(field).toBeDefined();
			expect(field.description).toContain('47H');
		});

		it('should have Slot Path 2 MSB = 2 (Insert effects)', () => {
			const field = result.example.fields.find(f => f.hex === '02' && f.description.includes('Slot Path 2 MSB'));
			expect(field).toBeDefined();
			expect(field.description).toContain('Insert effects');
		});

		it('should have Slot Path 2 LSB = 3 (Insert effect 3)', () => {
			const field = result.example.fields.find(f => f.hex === '03' && f.description.includes('Slot Path 2 LSB'));
			expect(field).toBeDefined();
			expect(field.description).toContain('Insert effect 3');
		});

		it('should have Parameter = 4', () => {
			const field = result.example.fields.find(f => f.hex === '04' && f.description.includes('Parameter to be controlled'));
			expect(field).toBeDefined();
		});

		it('should have VL (Value LSB)', () => {
			const field = result.example.fields.find(f => f.hex === 'VL');
			expect(field).toBeDefined();
			expect(field.description).toContain('Value LSB');
		});

		it('should have VH (Value MSB)', () => {
			const field = result.example.fields.find(f => f.hex === 'VH');
			expect(field).toBeDefined();
			expect(field.description).toContain('Value MSB');
		});
	});

	describe('GM2 Reverb types', () => {
		it('should have 6 reverb types', () => {
			expect(result.gm2_reverb.types).toHaveLength(6);
			expect(result.summary.reverb_type_count).toBe(6);
		});

		it('should parse type 0 Small Room', () => {
			const type = result.gm2_reverb.types.find(t => t.type_id === 0);
			expect(type).toBeDefined();
			expect(type.name).toBe('Small Room');
		});

		it('should parse type 1 Medium Room', () => {
			const type = result.gm2_reverb.types.find(t => t.type_id === 1);
			expect(type).toBeDefined();
			expect(type.name).toBe('Medium Room');
		});

		it('should parse type 2 Large Room', () => {
			const type = result.gm2_reverb.types.find(t => t.type_id === 2);
			expect(type).toBeDefined();
			expect(type.name).toBe('Large Room');
		});

		it('should parse type 3 Medium Hall', () => {
			const type = result.gm2_reverb.types.find(t => t.type_id === 3);
			expect(type).toBeDefined();
			expect(type.name).toBe('Medium Hall');
		});

		it('should parse type 4 Large Hall', () => {
			const type = result.gm2_reverb.types.find(t => t.type_id === 4);
			expect(type).toBeDefined();
			expect(type.name).toBe('Large Hall');
		});

		it('should parse type 8 Plate', () => {
			const type = result.gm2_reverb.types.find(t => t.type_id === 8);
			expect(type).toBeDefined();
			expect(type.name).toBe('Plate');
		});
	});

	describe('GM2 Reverb time defaults', () => {
		it('should have 6 time defaults', () => {
			expect(result.gm2_reverb.time_defaults).toHaveLength(6);
			expect(result.summary.reverb_time_default_count).toBe(6);
		});

		it('should parse type 0 -> 44 (1.1s)', () => {
			const td = result.gm2_reverb.time_defaults.find(d => d.reverb_type === 0);
			expect(td).toBeDefined();
			expect(td.value).toBe(44);
			expect(td.time).toBe('1.1s');
		});

		it('should parse type 4 -> 64 (1.8s)', () => {
			const td = result.gm2_reverb.time_defaults.find(d => d.reverb_type === 4);
			expect(td).toBeDefined();
			expect(td.value).toBe(64);
			expect(td.time).toBe('1.8s');
		});

		it('should parse type 8 -> 50 (1.3s)', () => {
			const td = result.gm2_reverb.time_defaults.find(d => d.reverb_type === 8);
			expect(td).toBeDefined();
			expect(td.value).toBe(50);
			expect(td.time).toBe('1.3s');
		});
	});

	describe('GM2 Chorus types', () => {
		it('should have 6 chorus types', () => {
			expect(result.gm2_chorus.types).toHaveLength(6);
			expect(result.summary.chorus_type_count).toBe(6);
		});

		it('should parse type 0 Chorus 1 with correct parameters', () => {
			const type = result.gm2_chorus.types.find(t => t.type_id === 0);
			expect(type).toBeDefined();
			expect(type.name).toBe('Chorus 1');
			expect(type.feedback.value).toBe(0);
			expect(type.feedback.display).toBe('0%');
			expect(type.mod_rate.value).toBe(3);
			expect(type.mod_depth.value).toBe(5);
			expect(type.rev_send.value).toBe(0);
		});

		it('should parse type 4 FB Chorus', () => {
			const type = result.gm2_chorus.types.find(t => t.type_id === 4);
			expect(type).toBeDefined();
			expect(type.name).toBe('FB Chorus');
			expect(type.feedback.value).toBe(64);
		});

		it('should parse type 5 Flanger', () => {
			const type = result.gm2_chorus.types.find(t => t.type_id === 5);
			expect(type).toBeDefined();
			expect(type.name).toBe('Flanger');
			expect(type.feedback.value).toBe(112);
		});
	});

	describe('GM2 Chorus parameter definitions', () => {
		it('should have 4 parameter definitions', () => {
			expect(result.gm2_chorus.param_definitions).toHaveLength(4);
			expect(result.summary.chorus_param_def_count).toBe(4);
		});

		it('should parse pp=1 Mod Rate with formula', () => {
			const param = result.gm2_chorus.param_definitions.find(p => p.param_id === 1);
			expect(param).toBeDefined();
			expect(param.name).toBe('Mod Rate');
			expect(param.formula).toBe('mr = val * 0.122');
			expect(param.description).toContain('modulation frequency');
		});

		it('should parse pp=2 Mod Depth with formula', () => {
			const param = result.gm2_chorus.param_definitions.find(p => p.param_id === 2);
			expect(param).toBeDefined();
			expect(param.name).toBe('Mod Depth');
			expect(param.formula).toBe('md = (val + 1) / 3.2');
		});

		it('should parse pp=3 Feedback with formula', () => {
			const param = result.gm2_chorus.param_definitions.find(p => p.param_id === 3);
			expect(param).toBeDefined();
			expect(param.name).toBe('Feedback');
			expect(param.formula).toBe('fb = val * 0.763');
		});

		it('should parse pp=4 Send to Reverb with formula', () => {
			const param = result.gm2_chorus.param_definitions.find(p => p.param_id === 4);
			expect(param).toBeDefined();
			expect(param.name).toBe('Send to Reverb');
			expect(param.formula).toBe('ctr = val * 0.787');
		});
	});

	describe('Data integrity', () => {
		it('should have all byte fields with valid codes', () => {
			for (const field of result.message_format.byte_fields) {
				expect(field.code).toMatch(/^[a-z]{2}$/);
				expect(field.description).toBeTruthy();
			}
		});

		it('should have all example fields with hex and description', () => {
			for (const field of result.example.fields) {
				expect(field.hex).toBeTruthy();
				expect(field.description).toBeTruthy();
			}
		});

		it('should have all reverb types with type_id and name', () => {
			for (const type of result.gm2_reverb.types) {
				expect(type.type_id).toBeTypeOf('number');
				expect(type.name).toBeTruthy();
			}
		});

		it('should have all chorus types with 4 parameters', () => {
			for (const type of result.gm2_chorus.types) {
				expect(type.feedback).toBeDefined();
				expect(type.mod_rate).toBeDefined();
				expect(type.mod_depth).toBeDefined();
				expect(type.rev_send).toBeDefined();
			}
		});

		it('should have all param definitions with formula and description', () => {
			for (const param of result.gm2_chorus.param_definitions) {
				expect(param.param_id).toBeTypeOf('number');
				expect(param.name).toBeTruthy();
				expect(param.formula).toBeTruthy();
				expect(param.description).toBeTruthy();
			}
		});
	});
});
