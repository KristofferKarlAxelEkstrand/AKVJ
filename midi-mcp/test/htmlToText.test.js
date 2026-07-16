import { describe, expect, test } from 'vitest';
import { htmlTitle, htmlToText } from '../lib/htmlToText.js';

describe('htmlToText', () => {
	test('preserves heading hierarchy as markdown', () => {
		const text = htmlToText('<h1>MIDI Spec</h1><h2>Messages</h2><p>Body text.</p>');
		expect(text).toContain('# MIDI Spec');
		expect(text).toContain('## Messages');
		expect(text).toContain('Body text.');
	});

	test('drops script, style, and nav content', () => {
		const text = htmlToText('<nav>Menu</nav><script>evil()</script><style>.a{}</style><p>Keep me</p>');
		expect(text).not.toContain('Menu');
		expect(text).not.toContain('evil');
		expect(text).not.toContain('.a{}');
		expect(text).toContain('Keep me');
	});

	test('decodes entities', () => {
		const text = htmlToText('<p>Note&nbsp;On &amp; Note&#32;Off &#x2014; &lt;3</p>');
		expect(text).toContain('Note On & Note Off — <3');
	});

	test('renders list items and table rows', () => {
		const text = htmlToText('<ul><li>First</li><li>Second</li></ul><table><tr><th>CC</th><th>Name</th></tr><tr><td>64</td><td>Sustain</td></tr></table>');
		expect(text).toContain('- First');
		expect(text).toContain('- Second');
		expect(text).toContain('CC | Name');
		expect(text).toContain('64 | Sustain');
	});

	test('keeps pre blocks fenced', () => {
		const text = htmlToText('<pre>F0 7E 7F 06 01 F7</pre>');
		expect(text).toContain('```\nF0 7E 7F 06 01 F7\n```');
	});

	test('strips WordPress/UIkit page chrome by class, id, and role', () => {
		const html = ['<a href="#main">Skip to main content</a>', '<div class="uk-navbar-container"><ul><li class="menu-item">Home</li><li class="menu-item">Specs</li></ul></div>', '<div role="banner">Site banner</div>', '<div id="cookie-notice">We use cookies</div>', '<div class="tm-sidebar">Related links</div>', '<main><h1>SysEx ID Table</h1><table><tr><td>0x41</td><td>Roland</td></tr></table></main>', '<div role="contentinfo">Copyright footer</div>'].join('');
		const text = htmlToText(html);
		expect(text).toContain('# SysEx ID Table');
		expect(text).toContain('0x41 | Roland');
		expect(text).not.toContain('Skip to main content');
		expect(text).not.toContain('Home');
		expect(text).not.toContain('Site banner');
		expect(text).not.toContain('cookies');
		expect(text).not.toContain('Related links');
		expect(text).not.toContain('Copyright footer');
	});

	test('keeps content whose class merely resembles chrome words', () => {
		const text = htmlToText('<p class="navigation-history-of-midi">MIDI navigation history essay.</p><p class="menupatch">Menu patch content.</p>');
		expect(text).toContain('MIDI navigation history essay.');
		expect(text).toContain('Menu patch content.');
	});

	test('collapses repeated blank lines', () => {
		const text = htmlToText('<div><p>a</p></div><div><div><p>b</p></div></div>');
		expect(text).not.toMatch(/\n{3,}/);
	});
});

describe('htmlTitle', () => {
	test('prefers the title tag', () => {
		expect(htmlTitle('<html><head><title>SysEx ID Table</title></head><body><h1>Other</h1></body></html>')).toBe('SysEx ID Table');
	});

	test('falls back to first h1', () => {
		expect(htmlTitle('<body><h1>Summary of MIDI Messages</h1></body>')).toBe('Summary of MIDI Messages');
	});

	test('returns undefined when neither exists', () => {
		expect(htmlTitle('<body><p>nothing</p></body>')).toBeUndefined();
	});
});
