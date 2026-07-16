/**
 * HTML → markdown-ish text conversion for spec documents.
 *
 * Preserves the heading hierarchy (h1–h6 → #–######) so extracted HTML specs
 * keep a citeable section structure, strips non-content elements, and keeps
 * table rows readable as pipe-separated lines.
 */

import { parse } from 'node-html-parser';

const SKIPPED_TAGS = new Set(['script', 'style', 'noscript', 'template', 'iframe', 'svg', 'canvas', 'nav', 'aside', 'form', 'button', 'input', 'select', 'label']);

const BLOCK_TAGS = new Set(['p', 'div', 'section', 'article', 'main', 'header', 'footer', 'blockquote', 'figure', 'figcaption', 'ul', 'ol', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'address', 'details', 'summary']);

const HEADING_LEVELS = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

/**
 * Page-chrome detection: WordPress/UIkit menus, navbars, breadcrumbs, cookie
 * banners, and skip-links are noise in an extracted spec — drop the element.
 */
const CHROME_CLASS_PATTERN = /(^|[\s-])(menu-item|menu|navbar|nav|breadcrumbs?|sidebar|cookie|banner|skip-link|social|share|search|dropdown|logo|offcanvas|totop|pagination|widget|comment)(?=$|[\s_-])/i;

const CHROME_ROLE_PATTERN = /^(navigation|banner|contentinfo|search|complementary)$/i;

const SKIP_LINK_PATTERN = /^skip to (main )?content$/i;

function isChromeElement(node) {
	const role = node.getAttribute?.('role');
	if (role && CHROME_ROLE_PATTERN.test(role)) {
		return true;
	}
	const classAndId = `${node.getAttribute?.('class') ?? ''} ${node.getAttribute?.('id') ?? ''}`;
	return CHROME_CLASS_PATTERN.test(classAndId);
}

/**
 * Convert an HTML document (or fragment) to clean markdown-ish text.
 *
 * @param {string} html
 * @returns {string}
 */
export function htmlToText(html) {
	const root = parse(String(html ?? ''), { blockTextElements: { script: false, style: false, noscript: false, pre: true } });
	const body = root.querySelector('body') ?? root;
	const output = renderNode(body);
	return collapseBlankLines(output).trim();
}

/**
 * Extract the document title from HTML (<title> or first <h1>).
 *
 * @param {string} html
 * @returns {string|undefined}
 */
export function htmlTitle(html) {
	const root = parse(String(html ?? ''));
	const title = root.querySelector('title')?.text?.trim();
	if (title) {
		return normalizeInline(title);
	}
	const h1 = root.querySelector('h1')?.text?.trim();
	return h1 ? normalizeInline(h1) : undefined;
}

function renderNode(node) {
	// Text node
	if (node.nodeType === 3) {
		return decodeEntities(node.rawText).replace(/\s+/g, ' ');
	}
	if (node.nodeType !== 1 && !node.childNodes) {
		return '';
	}
	const tag = node.rawTagName?.toLowerCase() ?? '';
	if (SKIPPED_TAGS.has(tag)) {
		return '';
	}
	if (isChromeElement(node)) {
		return '';
	}
	if (tag === 'a' && SKIP_LINK_PATTERN.test(node.text?.trim() ?? '')) {
		return '';
	}
	if (tag in HEADING_LEVELS) {
		const text = normalizeInline(renderChildren(node));
		return text ? `\n\n${'#'.repeat(HEADING_LEVELS[tag])} ${text}\n\n` : '';
	}
	if (tag === 'br') {
		return '\n';
	}
	if (tag === 'hr') {
		return '\n\n---\n\n';
	}
	if (tag === 'li') {
		const text = normalizeInline(renderChildren(node));
		return text ? `\n- ${text}` : '';
	}
	if (tag === 'tr') {
		const cells = node.childNodes.filter(child => ['td', 'th'].includes(child.rawTagName?.toLowerCase())).map(cell => normalizeInline(renderChildren(cell)));
		return cells.length > 0 ? `\n${cells.join(' | ')}` : '';
	}
	if (tag === 'pre') {
		const text = decodeEntities(node.text ?? node.rawText ?? '').trimEnd();
		return text ? `\n\n\`\`\`\n${text}\n\`\`\`\n\n` : '';
	}
	if (BLOCK_TAGS.has(tag)) {
		const text = renderChildren(node);
		return text.trim() ? `\n\n${text.trim()}\n\n` : '';
	}
	return renderChildren(node);
}

function renderChildren(node) {
	let output = '';
	for (const child of node.childNodes ?? []) {
		output += renderNode(child);
	}
	return output;
}

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', copy: '©', reg: '®', trade: '™', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', deg: '°', plusmn: '±', times: '×', micro: 'µ' };

function decodeEntities(text) {
	return String(text ?? '')
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
		.replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function normalizeInline(text) {
	return text.replace(/\s+/g, ' ').trim();
}

function collapseBlankLines(text) {
	return text
		.split('\n')
		.map(line => line.trimEnd())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n');
}
