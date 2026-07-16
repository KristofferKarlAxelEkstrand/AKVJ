import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformThreeDSoundControllers } from '../../lib/transformers/threeDSoundControllersTransformer.js';

describe('Three Dimensional Sound Controllers (RP-049) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/rp49public.md');
		result = await transformThreeDSoundControllers(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Three Dimensional Sound Controllers');
		expect(result.metadata.doc_id).toBe('RP-049');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('rp49public.md');
		expect(result.metadata.source_committee).toContain('Creative Technology');
		expect(result.metadata.source_committee).toContain('E-MU Systems');
	});

	it('should have a non-empty abstract', () => {
		expect(result.abstract).toContain('3D');
		expect(result.abstract).toContain('sound controllers');
	});

	it('should have a non-empty background', () => {
		expect(result.background).toContain('Three-dimensional sound');
		expect(result.background.length).toBeGreaterThan(100);
	});

	describe('General Parameter Format', () => {
		it('should have correct format', () => {
			expect(result.general_parameter_format).not.toBeNull();
			expect(result.general_parameter_format.status_byte).toBe('B<n>');
			expect(result.general_parameter_format.rpn_msb_cc).toBe(64);
			expect(result.general_parameter_format.data_entry_msb_cc).toBe(6);
			expect(result.general_parameter_format.data_entry_lsb_cc).toBe(26);
		});

		it('should have 2 general format descriptions', () => {
			expect(result.general_format_descriptions).toHaveLength(2);
			expect(result.general_format_descriptions[0].field).toBe('Data MSB');
			expect(result.general_format_descriptions[1].field).toBe('Data LSB');
		});
	});

	describe('Controllers', () => {
		it('should have 9 controllers', () => {
			expect(result.controllers).toHaveLength(9);
			expect(result.summary.controller_count).toBe(9);
		});

		it('should have 39 total parameter entries', () => {
			expect(result.summary.total_parameter_entries).toBe(39);
		});

		it('should parse Azimuth Angle (RPN LSB=0)', () => {
			const c = result.controllers.find(c => c.name === 'AZIMUTH ANGLE');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(0);
			expect(c.rpn_lsb_description).toBe('Azimuth Angle');
			expect(c.message_format.rpn_lsb_hex).toBe('00');
			expect(c.data_msb_description).toContain('Azimuth');
			expect(c.parameters).toHaveLength(4);
		});

		it('should have Azimuth Min <00/00> -180.00 degrees', () => {
			const c = result.controllers.find(c => c.name === 'AZIMUTH ANGLE');
			const min = c.parameters.find(p => p.type === 'Min');
			expect(min.midi_value).toBe('00/00');
			expect(min.real_world_value).toContain('-180.00');
			expect(min.real_world_value).toContain('degrees');
		});

		it('should have Azimuth Default <40/00> 0.00 degrees', () => {
			const c = result.controllers.find(c => c.name === 'AZIMUTH ANGLE');
			const def = c.parameters.find(p => p.type === 'Default');
			expect(def.midi_value).toBe('40/00');
			expect(def.real_world_value).toContain('0.00');
		});

		it('should parse Elevation Angle (RPN LSB=1)', () => {
			const c = result.controllers.find(c => c.name === 'ELEVATION ANGLE');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(1);
			expect(c.parameters).toHaveLength(4);
		});

		it('should parse Gain (RPN LSB=2) with Except parameter', () => {
			const c = result.controllers.find(c => c.name === 'GAIN');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(2);
			expect(c.parameters).toHaveLength(5);
			const except = c.parameters.find(p => p.type === 'Except');
			expect(except).toBeDefined();
			expect(except.midi_value).toBe('00/00');
			expect(except.real_world_value).toContain('dB');
		});

		it('should parse Distance Ratio (RPN LSB=3) with Except', () => {
			const c = result.controllers.find(c => c.name === 'DISTANCE RATIO');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(3);
			expect(c.parameters).toHaveLength(5);
			const except = c.parameters.find(p => p.type === 'Except');
			expect(except.midi_value).toBe('7F/7F');
			expect(except.real_world_value).toContain('1.00');
		});

		it('should parse Maximum Distance (RPN LSB=4)', () => {
			const c = result.controllers.find(c => c.name === 'MAXIMUM DISTANCE');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(4);
			expect(c.parameters).toHaveLength(5);
		});

		it('should parse Gain at Maximum Distance (RPN LSB=5)', () => {
			const c = result.controllers.find(c => c.name === 'GAIN AT MAXIMUM DISTANCE');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(5);
			expect(c.parameters).toHaveLength(4);
			const def = c.parameters.find(p => p.type === 'Default');
			expect(def.midi_value).toBe('51/0F');
			expect(def.real_world_value).toContain('60.00');
		});

		it('should parse Reference Distance Ratio (RPN LSB=6)', () => {
			const c = result.controllers.find(c => c.name === 'REFERENCE DISTANCE RATIO');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(6);
			expect(c.parameters).toHaveLength(4);
		});

		it('should parse Pan Spread Angle (RPN LSB=7)', () => {
			const c = result.controllers.find(c => c.name === 'PAN SPREAD ANGLE');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(7);
			expect(c.parameters).toHaveLength(4);
			const def = c.parameters.find(p => p.type === 'Default');
			expect(def.midi_value).toBe('4A/55');
			expect(def.real_world_value).toContain('30');
		});

		it('should parse Roll Angle (RPN LSB=8)', () => {
			const c = result.controllers.find(c => c.name === 'ROLL ANGLE');
			expect(c).toBeDefined();
			expect(c.rpn_lsb).toBe(8);
			expect(c.parameters).toHaveLength(4);
		});

		it('should have all controllers with message_format', () => {
			for (const c of result.controllers) {
				expect(c.message_format).not.toBeNull();
				expect(c.message_format.status_byte).toBe('B<n>');
			}
		});

		it('should have sequential RPN LSB values 0-8', () => {
			for (let i = 0; i < 9; i++) {
				expect(result.controllers[i].rpn_lsb).toBe(i);
			}
		});
	});

	describe('Technical Notes', () => {
		it('should have 2 technical notes', () => {
			expect(result.technical_notes).toHaveLength(2);
			expect(result.summary.technical_note_count).toBe(2);
		});

		it('should parse note 1 about stereo field', () => {
			const note = result.technical_notes.find(n => n.note_number === 1);
			expect(note).toBeDefined();
			expect(note.title).toContain('stereo field');
			expect(note.details.length).toBeGreaterThan(10);
		});

		it('should parse note 2 about distance-based attenuation', () => {
			const note = result.technical_notes.find(n => n.note_number === 2);
			expect(note).toBeDefined();
			expect(note.title).toContain('Distance-based attenuation');
			expect(note.details.length).toBeGreaterThan(10);
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.controller_count).toBe(9);
			expect(result.summary.total_parameter_entries).toBe(39);
			expect(result.summary.technical_note_count).toBe(2);
		});
	});
});
