import { describe, it, expect, beforeAll } from 'vitest';
import { transformRtpMidi } from '../../lib/transformers/rtpMidiTransformer.js';
import path from 'node:path';

const markdownPath = path.resolve('data/rfc6295-rtp-midi.md');
let result;

beforeAll(async () => {
	result = await transformRtpMidi(markdownPath);
});

describe('RTP-MIDI Transformer Metadata', () => {
	it('should parse metadata correctly', () => {
		expect(result.metadata.title).toBe('RTP Payload Format for MIDI (RTP-MIDI)');
		expect(result.metadata.doc_id).toBe('RFC6295');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('6295');
		expect(result.metadata.date).toBe('2011-06');
		expect(result.metadata.source).toBe('https://www.ietf.org/rfc/rfc6295.txt');
	});
});

describe('RTP-MIDI Packet Figures', () => {
	it('should parse 10 packet figures', () => {
		expect(result.packet_figures).toHaveLength(10);
	});

	it('should parse Figure 1 - Packet Format', () => {
		const fig = result.packet_figures.find(f => f.figure_id === 'Figure 1');
		expect(fig).toBeDefined();
		expect(fig.title).toBe('Packet Format');
		expect(fig.fields).toContain('V');
		expect(fig.fields).toContain('M');
		expect(fig.fields).toContain('PT');
		expect(fig.fields).toContain('SSRC');
	});

	it('should parse Figure 2 - MIDI Command Section', () => {
		const fig = result.packet_figures.find(f => f.figure_id === 'Figure 2');
		expect(fig).toBeDefined();
		expect(fig.title).toBe('MIDI Command Section');
		expect(fig.fields).toContain('B');
		expect(fig.fields).toContain('J');
		expect(fig.fields).toContain('Z');
		expect(fig.fields).toContain('P');
		expect(fig.fields).toContain('LEN');
	});

	it('should parse Figure 5 - Command Segmentation Status Octets', () => {
		const fig = result.packet_figures.find(f => f.figure_id === 'Figure 5');
		expect(fig).toBeDefined();
		expect(fig.title).toBe('Command Segmentation Status Octets');
		expect(fig.fields).toContain('F0');
		expect(fig.fields).toContain('F7');
	});

	it('should parse Figure 8 - Recovery Journal Header', () => {
		const fig = result.packet_figures.find(f => f.figure_id === 'Figure 8');
		expect(fig).toBeDefined();
		expect(fig.title).toBe('Recovery Journal Header');
		expect(fig.fields).toContain('S');
		expect(fig.fields).toContain('Y');
		expect(fig.fields).toContain('A');
		expect(fig.fields).toContain('H');
		expect(fig.fields).toContain('TOTCHAN');
	});

	it('should parse Figure 9 - Channel Journal Format', () => {
		const fig = result.packet_figures.find(f => f.figure_id === 'Figure 9');
		expect(fig).toBeDefined();
		expect(fig.title).toBe('Channel Journal Format');
		expect(fig.fields).toContain('CHAN');
		expect(fig.fields).toContain('LENGTH');
	});

	it('should parse Figure 10 - System Journal Format', () => {
		const fig = result.packet_figures.find(f => f.figure_id === 'Figure 10');
		expect(fig).toBeDefined();
		expect(fig.title).toBe('System Journal Format');
		expect(fig.fields).toContain('D');
		expect(fig.fields).toContain('V');
		expect(fig.fields).toContain('Q');
		expect(fig.fields).toContain('F');
		expect(fig.fields).toContain('X');
		expect(fig.fields).toContain('LENGTH');
	});
});

describe('RTP-MIDI Channel Chapters (Appendix A)', () => {
	it('should parse 8 channel chapters', () => {
		expect(result.channel_chapters).toHaveLength(8);
	});

	it('should parse Chapter P - MIDI Program Change', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'P');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Program Change');
		expect(ch.appendix).toBe('A');
		expect(ch.section_number).toBe('2');
		expect(ch.figure_id).toMatch(/Figure A\.2\./);
		expect(ch.fields).toContain('S');
		expect(ch.fields).toContain('PROGRAM');
		expect(ch.fields).toContain('BANK-MSB');
	});

	it('should parse Chapter C - MIDI Control Change', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'C');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Control Change');
		expect(ch.fields).toContain('LEN');
		expect(ch.fields).toContain('NUMBER');
	});

	it('should parse Chapter M - MIDI Parameter System', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'M');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Parameter System');
		expect(ch.fields.length).toBeGreaterThan(5);
	});

	it('should parse Chapter W - MIDI Pitch Wheel', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'W');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Pitch Wheel');
		expect(ch.fields).toContain('FIRST');
		expect(ch.fields).toContain('SECOND');
	});

	it('should parse Chapter N - MIDI NoteOff and NoteOn', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'N');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI NoteOff and NoteOn');
		expect(ch.fields).toContain('LEN');
		expect(ch.fields).toContain('NOTENUM');
		expect(ch.fields).toContain('VELOCITY');
	});

	it('should parse Chapter E - MIDI Note Command Extras', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'E');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Note Command Extras');
		expect(ch.fields.length).toBeGreaterThan(0);
	});

	it('should parse Chapter T - MIDI Channel Aftertouch', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'T');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Channel Aftertouch');
		expect(ch.fields.length).toBeGreaterThan(0);
	});

	it('should parse Chapter A - MIDI Poly Aftertouch', () => {
		const ch = result.channel_chapters.find(c => c.chapter_letter === 'A');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Poly Aftertouch');
		expect(ch.fields.length).toBeGreaterThan(0);
	});
});

describe('RTP-MIDI System Chapters (Appendix B)', () => {
	it('should parse 5 system chapters', () => {
		expect(result.system_chapters).toHaveLength(5);
	});

	it('should parse Chapter D - Simple System Commands', () => {
		const ch = result.system_chapters.find(c => c.chapter_letter === 'D');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('Simple System Commands');
		expect(ch.appendix).toBe('B');
		expect(ch.section_number).toBe('1');
		expect(ch.fields).toContain('S');
		expect(ch.fields).toContain('B');
		expect(ch.fields).toContain('COUNT');
	});

	it('should parse Chapter V - Active Sense Command', () => {
		const ch = result.system_chapters.find(c => c.chapter_letter === 'V');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('Active Sense Command');
		expect(ch.fields.length).toBeGreaterThan(0);
	});

	it('should parse Chapter Q - Sequencer State Commands', () => {
		const ch = result.system_chapters.find(c => c.chapter_letter === 'Q');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('Sequencer State Commands');
		expect(ch.fields.length).toBeGreaterThan(0);
	});

	it('should parse Chapter F - MIDI Time Code Tape Position', () => {
		const ch = result.system_chapters.find(c => c.chapter_letter === 'F');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('MIDI Time Code Tape Position');
		expect(ch.fields.length).toBeGreaterThan(0);
	});

	it('should parse Chapter X - System Exclusive', () => {
		const ch = result.system_chapters.find(c => c.chapter_letter === 'X');
		expect(ch).toBeDefined();
		expect(ch.name).toBe('System Exclusive');
		expect(ch.fields).toContain('S');
		expect(ch.fields).toContain('TCOUNT');
		expect(ch.fields).toContain('COUNT');
	});
});

describe('RTP-MIDI Configuration Parameters', () => {
	it('should parse 28 configuration parameters', () => {
		expect(result.configuration_parameters).toHaveLength(28);
	});

	it('should parse tsmode with allowed values', () => {
		const param = result.configuration_parameters.find(p => p.name === 'tsmode');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.3');
		expect(param.allowed_values).toContain('comex');
		expect(param.allowed_values).toContain('async');
		expect(param.allowed_values).toContain('buffer');
	});

	it('should parse j_sec with allowed values', () => {
		const param = result.configuration_parameters.find(p => p.name === 'j_sec');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.2');
		expect(param.allowed_values).toContain('none');
		expect(param.allowed_values).toContain('recj');
	});

	it('should parse j_update with allowed values', () => {
		const param = result.configuration_parameters.find(p => p.name === 'j_update');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.2');
		expect(param.allowed_values).toContain('anchor');
		expect(param.allowed_values).toContain('closed-loop');
	});

	it('should parse octpos with allowed values', () => {
		const param = result.configuration_parameters.find(p => p.name === 'octpos');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.3');
		expect(param.allowed_values).toContain('first');
		expect(param.allowed_values).toContain('last');
	});

	it('should parse multimode with allowed values', () => {
		const param = result.configuration_parameters.find(p => p.name === 'multimode');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.6');
		expect(param.allowed_values).toContain('all');
		expect(param.allowed_values).toContain('one');
	});

	it('should parse render with allowed values', () => {
		const param = result.configuration_parameters.find(p => p.name === 'render');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.6');
		expect(param.allowed_values).toContain('synthetic');
		expect(param.allowed_values).toContain('api');
		expect(param.allowed_values).toContain('null');
	});

	it('should parse guardtime with C.4 section ref', () => {
		const param = result.configuration_parameters.find(p => p.name === 'guardtime');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.4');
	});

	it('should parse rtp_ptime with C.4 section ref', () => {
		const param = result.configuration_parameters.find(p => p.name === 'rtp_ptime');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.4');
	});

	it('should parse rtp_maxptime with C.4 section ref', () => {
		const param = result.configuration_parameters.find(p => p.name === 'rtp_maxptime');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.4');
	});

	it('should parse cm_unused with C.1 section ref', () => {
		const param = result.configuration_parameters.find(p => p.name === 'cm_unused');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.1');
	});

	it('should parse cm_used with C.1 section ref', () => {
		const param = result.configuration_parameters.find(p => p.name === 'cm_used');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.1');
	});

	it('should parse musicport with C.5 section ref', () => {
		const param = result.configuration_parameters.find(p => p.name === 'musicport');
		expect(param).toBeDefined();
		expect(param.section_ref).toBe('Appendix C.5');
	});

	it('should parse rate as required parameter', () => {
		const param = result.configuration_parameters.find(p => p.name === 'rate');
		expect(param).toBeDefined();
	});
});

describe('RTP-MIDI Media Type Registrations', () => {
	it('should parse 3 media type registrations', () => {
		expect(result.media_type_registrations).toHaveLength(3);
	});

	it('should parse audio/rtp-midi registration', () => {
		const reg = result.media_type_registrations.find(r => r.subtype === 'rtp-midi');
		expect(reg).toBeDefined();
		expect(reg.media_type).toBe('audio');
		expect(reg.section).toBe('11.1');
		expect(reg.required_parameters).toHaveLength(1);
		expect(reg.required_parameters[0].name).toBe('rate');
		expect(reg.optional_parameters.length).toBeGreaterThanOrEqual(27);
	});

	it('should parse audio/mpeg4-generic registration', () => {
		const reg = result.media_type_registrations.find(r => r.subtype === 'mpeg4-generic');
		expect(reg).toBeDefined();
		expect(reg.media_type).toBe('audio');
		expect(reg.section).toBe('11.2');
	});

	it('should parse audio/asc registration', () => {
		const reg = result.media_type_registrations.find(r => r.subtype === 'asc');
		expect(reg).toBeDefined();
		expect(reg.media_type).toBe('audio');
		expect(reg.section).toBe('11.3');
	});

	it('should include ch_anchor in rtp-midi optional parameters', () => {
		const reg = result.media_type_registrations.find(r => r.subtype === 'rtp-midi');
		const param = reg.optional_parameters.find(p => p.name === 'ch_anchor');
		expect(param).toBeDefined();
	});

	it('should include j_sec in rtp-midi optional parameters', () => {
		const reg = result.media_type_registrations.find(r => r.subtype === 'rtp-midi');
		const param = reg.optional_parameters.find(p => p.name === 'j_sec');
		expect(param).toBeDefined();
	});
});

describe('RTP-MIDI ABNF Definitions', () => {
	it('should parse ABNF definitions', () => {
		expect(result.abnf_definitions.length).toBeGreaterThan(20);
	});

	it('should parse fmtp definition', () => {
		const def = result.abnf_definitions.find(d => d.parameter === 'fmtp');
		expect(def).toBeDefined();
		expect(def.syntax).toContain('a=fmtp');
	});

	it('should parse command-type definition', () => {
		const def = result.abnf_definitions.find(d => d.parameter === 'command-type');
		expect(def).toBeDefined();
		expect(def.syntax).toContain('[A]');
		expect(def.syntax).toContain('[B]');
	});

	it('should parse chapter-list definition', () => {
		const def = result.abnf_definitions.find(d => d.parameter === 'chapter-list');
		expect(def).toBeDefined();
		expect(def.syntax).toContain('[A]');
		expect(def.syntax).toContain('[D]');
	});

	it('should parse cm_unused ABNF with C.1 ref', () => {
		const def = result.abnf_definitions.find(d => d.parameter === 'cm_unused');
		expect(def).toBeDefined();
		expect(def.section_ref).toBe('Appendix C.1');
	});

	it('should parse guardtime ABNF with C.4 ref', () => {
		const def = result.abnf_definitions.find(d => d.parameter === 'guardtime');
		expect(def).toBeDefined();
		expect(def.section_ref).toBe('Appendix C.4');
	});
});

describe('RTP-MIDI Summary', () => {
	it('should have correct summary counts', () => {
		expect(result.summary.packet_figure_count).toBe(10);
		expect(result.summary.channel_chapter_count).toBe(8);
		expect(result.summary.system_chapter_count).toBe(5);
		expect(result.summary.configuration_parameter_count).toBe(28);
		expect(result.summary.media_type_registration_count).toBe(3);
		expect(result.summary.abnf_definition_count).toBeGreaterThan(20);
	});
});
