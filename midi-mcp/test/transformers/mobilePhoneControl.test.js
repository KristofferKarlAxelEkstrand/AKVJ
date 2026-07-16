import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformMobilePhoneControl } from '../../lib/transformers/mobilePhoneControlTransformer.js';

describe('Mobile Phone Control Message (RP-046) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/rp46public.md');
		result = await transformMobilePhoneControl(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Mobile Phone Control Message Specification');
		expect(result.metadata.doc_id).toBe('RP-046');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('rp46public.md');
	});

	describe('Message Format', () => {
		it('should have correct header', () => {
			expect(result.message_format.header).toBe('F0 7F <phone ID> 0C 00');
			expect(result.message_format.sub_id_1).toBe('0C');
			expect(result.message_format.sub_id_2).toBe('00');
		});

		it('should have 9 fields', () => {
			expect(result.message_format.fields).toHaveLength(9);
		});

		it('should list F0 as System Exclusive Start', () => {
			expect(result.message_format.fields[0].name).toBe('F0');
			expect(result.message_format.fields[0].description).toBe('System Exclusive Start');
		});

		it('should list 0C as Sub-ID#1', () => {
			const field = result.message_format.fields.find(f => f.name === '0C');
			expect(field.description).toContain('Mobile Phone Control');
		});
	});

	describe('Device Class Definitions', () => {
		it('should have 8 entries', () => {
			expect(result.device_class_definitions).toHaveLength(8);
			expect(result.summary.device_class_count).toBe(8);
		});

		it('should parse class 0 as Reserved', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '0');
			expect(entry.meaning).toContain('Reserved');
		});

		it('should parse class 1 as Manufacturer-Specific', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '1');
			expect(entry.meaning).toContain('Manufacturer-Specific');
			expect(entry.notes.length).toBeGreaterThan(0);
		});

		it('should parse class 2 as Vibrator', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '2');
			expect(entry.meaning).toBe('Vibrator');
			expect(entry.notes.some(n => n.includes('ring vibrator'))).toBe(true);
		});

		it('should parse class 3 as LED', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '3');
			expect(entry.meaning).toBe('LED');
		});

		it('should parse class 4 as Display', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '4');
			expect(entry.meaning).toBe('Display');
		});

		it('should parse class 5 as Keypad', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '5');
			expect(entry.meaning).toBe('Keypad');
		});

		it('should parse class 6-126 as Reserved', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '6-126');
			expect(entry.meaning).toContain('Reserved');
		});

		it('should parse class 127 as call all', () => {
			const entry = result.device_class_definitions.find(d => d.class_id === '127');
			expect(entry.meaning).toContain('call all');
		});
	});

	describe('Device Index Definitions', () => {
		it('should have 2 entries', () => {
			expect(result.device_index_definitions).toHaveLength(2);
			expect(result.summary.device_index_count).toBe(2);
		});

		it('should parse 0-126 as valid common deviceIndex', () => {
			const entry = result.device_index_definitions.find(d => d.index_range === '0-126');
			expect(entry.meaning).toContain('Valid common deviceIndex');
			expect(entry.notes.some(n => n.includes('primary instance'))).toBe(true);
		});

		it('should parse 127 as call all', () => {
			const entry = result.device_index_definitions.find(d => d.index_range === '127');
			expect(entry.meaning).toContain('call all');
		});
	});

	describe('CmdID Definitions', () => {
		it('should have 9 entries', () => {
			expect(result.cmd_id_definitions).toHaveLength(9);
			expect(result.summary.cmd_id_count).toBe(9);
		});

		it('should parse cmd 0 as Reserved', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '0');
			expect(entry.meaning).toContain('Reserved');
		});

		it('should parse cmd 1 as Manufacturer-Specific', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '1');
			expect(entry.meaning).toContain('Manufacturer-Specific');
		});

		it('should parse cmd 2 as Reset with no data bytes and 3 behaviors', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '2');
			expect(entry.meaning).toBe('Reset');
			expect(entry.data_bytes).toBe('No data bytes');
			expect(entry.device_behaviors).toHaveLength(3);
		});

		it('should parse cmd 2 Vibrator behavior', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '2');
			const vibBehavior = entry.device_behaviors.find(b => b.device_class.includes('Vibrator'));
			expect(vibBehavior).toBeDefined();
			expect(vibBehavior.behavior).toContain('Turn vibrator off');
		});

		it('should parse cmd 3 as On', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '3');
			expect(entry.meaning).toBe('On');
			expect(entry.data_bytes).toBe('No data bytes');
		});

		it('should parse cmd 4 as Off', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '4');
			expect(entry.meaning).toBe('Off');
		});

		it('should parse cmd 5 as Follow MIDI Channels with variable data bytes', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '5');
			expect(entry.meaning).toBe('Follow MIDI Channels');
			expect(entry.data_bytes).toContain('Variable number of data bytes');
		});

		it('should parse cmd 6 as Set Color RGB with 3 data bytes', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '6');
			expect(entry.meaning).toBe('Set Color RGB');
			expect(entry.data_bytes).toContain('3 data bytes');
			expect(entry.data_bytes).toContain('R, G, B');
		});

		it('should parse cmd 7 as Set Level with 1 data byte', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '7');
			expect(entry.meaning).toBe('Set Level');
			expect(entry.data_bytes).toContain('1 data byte');
			expect(entry.data_bytes).toContain('Level');
		});

		it('should parse cmd 8-127 as Reserved', () => {
			const entry = result.cmd_id_definitions.find(c => c.cmd_id === '8-127');
			expect(entry.meaning).toContain('Reserved');
		});
	});

	describe('Example Messages', () => {
		it('should have 5 examples', () => {
			expect(result.example_messages).toHaveLength(5);
			expect(result.summary.example_message_count).toBe(5);
		});

		it('should parse example 1 as Reset All Available Devices', () => {
			const ex = result.example_messages.find(e => e.example_number === 1);
			expect(ex.title).toContain('Reset All Available Devices');
			expect(ex.bytes).toHaveLength(3);
			expect(ex.bytes[0].bytes).toBe('F0 7F <phone ID> 0C 00');
			expect(ex.bytes[0].description).toContain('Universal Sys Ex header');
			expect(ex.bytes[2].bytes).toBe('02');
			expect(ex.bytes[2].description).toContain('Reset');
		});

		it('should parse example 2 as Turn Phone Ring Vibrator On', () => {
			const ex = result.example_messages.find(e => e.example_number === 2);
			expect(ex.title).toContain('Turn Phone Ring Vibrator On');
			expect(ex.bytes).toHaveLength(3);
			expect(ex.bytes[1].bytes).toBe('02 00');
			expect(ex.bytes[1].description).toContain('Vibrator');
		});

		it('should parse example 3 as Turn Phone Ring Vibrator Off', () => {
			const ex = result.example_messages.find(e => e.example_number === 3);
			expect(ex.title).toContain('Turn Phone Ring Vibrator Off');
			expect(ex.bytes).toHaveLength(3);
			expect(ex.bytes[2].bytes).toBe('04');
			expect(ex.bytes[2].description).toContain('Off');
		});

		it('should parse example 4 as Set LED #4 Color to Purple', () => {
			const ex = result.example_messages.find(e => e.example_number === 4);
			expect(ex.title).toContain('Set LED #4 Color to Purple');
			expect(ex.bytes).toHaveLength(3);
			expect(ex.bytes[2].bytes).toBe('06 7F 00 7F');
			expect(ex.bytes[2].description).toContain('Set Color RGB');
		});

		it('should parse example 5 as Make LED #4 Follow MIDI Channels', () => {
			const ex = result.example_messages.find(e => e.example_number === 5);
			expect(ex.title).toContain('Follow MIDI Channels');
			expect(ex.bytes).toHaveLength(5);
			expect(ex.bytes[2].bytes).toBe('05');
			expect(ex.bytes[2].description).toContain('Follow MIDI Channels');
		});
	});

	describe('Player Behavior Requirements', () => {
		it('should have 6 entries', () => {
			expect(result.player_behavior_requirements).toHaveLength(6);
			expect(result.summary.player_behavior_requirement_count).toBe(6);
		});

		it('should parse 4.1 as Vibrator and LED Control', () => {
			const entry = result.player_behavior_requirements.find(p => p.section.startsWith('4.1.'));
			expect(entry.section).toContain('Vibrator and LED Control');
		});

		it('should parse 4.1.1 with reference counting details', () => {
			const entry = result.player_behavior_requirements.find(p => p.section.includes('4.1.1'));
			expect(entry.section).toContain('Reference Counting');
			expect(entry.details.length).toBeGreaterThan(0);
			expect(entry.details.some(d => d.includes('reference count'))).toBe(true);
		});

		it('should parse 4.2 as Message Execution Order in SMFs', () => {
			const entry = result.player_behavior_requirements.find(p => p.section.startsWith('4.2'));
			expect(entry.section).toContain('Message Execution Order');
		});

		it('should parse 4.3 as Exclusive Ownership', () => {
			const entry = result.player_behavior_requirements.find(p => p.section.startsWith('4.3'));
			expect(entry.section).toContain('Exclusive Ownership');
		});

		it('should parse 4.4 as Minimum On and Off Times', () => {
			const entry = result.player_behavior_requirements.find(p => p.section.startsWith('4.4'));
			expect(entry.section).toContain('Minimum On and Off Times');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.device_class_count).toBe(8);
			expect(result.summary.device_index_count).toBe(2);
			expect(result.summary.cmd_id_count).toBe(9);
			expect(result.summary.example_message_count).toBe(5);
			expect(result.summary.player_behavior_requirement_count).toBe(6);
		});
	});
});
