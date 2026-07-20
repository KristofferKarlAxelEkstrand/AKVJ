import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { WorkflowTree, message } from './utils/workflowTree.js';
import { splitFrontmatter, renderFrontmatter } from '../lib/frontmatter.js';
import { parseMessage, validateMessage, writeMessage, resolveOwner } from '../lib/message.js';

describe('frontmatter', () => {
	it('splits data from body', () => {
		const { data, body, hasFrontmatter } = splitFrontmatter('---\ntype: task\nfrom: team-lead\n---\n\nBody text.\n');

		expect(hasFrontmatter).toBe(true);
		expect(data).toEqual({ type: 'task', from: 'team-lead' });
		expect(body.trim()).toBe('Body text.');
	});

	it('treats a document without frontmatter as all body', () => {
		const { data, body, hasFrontmatter } = splitFrontmatter('# Just a heading\n');

		expect(hasFrontmatter).toBe(false);
		expect(data).toEqual({});
		expect(body).toContain('Just a heading');
	});

	it('reads inline and block lists', () => {
		expect(splitFrontmatter('---\npartials: [a, b, c]\n---\n').data.partials).toEqual(['a', 'b', 'c']);
		expect(splitFrontmatter('---\npartials:\n  - a\n  - b\n---\n').data.partials).toEqual(['a', 'b']);
	});

	it('strips quotes from scalars', () => {
		expect(splitFrontmatter('---\nreason: "in quotes"\n---\n').data.reason).toBe('in quotes');
	});

	it('round-trips through render', () => {
		const rendered = renderFrontmatter({ type: 'task', from: 'team-lead', partials: ['a', 'b'], empty: '' });

		expect(splitFrontmatter(`${rendered}\n\nbody\n`).data).toEqual({ type: 'task', from: 'team-lead', partials: ['a', 'b'] });
	});
});

describe('message', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
	});

	afterEach(() => {
		tree.cleanup();
	});

	it('parses a well-formed envelope', () => {
		const filePath = tree.write('slack/dev/[TASK]-1-x.md', message({ type: 'task', from: 'team-lead', to: 'dev', task: '12' }));

		expect(parseMessage(filePath)).toMatchObject({ type: 'task', from: 'team-lead', to: 'dev', task: '12' });
	});

	it('reports the fields the tooling depends on', () => {
		expect(validateMessage(parseMessage(tree.write('slack/dev/ok.md', message({ to: 'dev' }))))).toEqual([]);

		const noEnvelope = parseMessage(tree.write('slack/dev/bare.md', '# No envelope\n'));
		expect(validateMessage(noEnvelope)).toEqual(expect.arrayContaining([expect.stringContaining('type')]));

		const badType = parseMessage(tree.write('slack/dev/bad.md', '---\ntype: nonsense\nfrom: x\n---\n\nbody\n'));
		expect(validateMessage(badType)[0]).toContain('unknown type "nonsense"');
	});

	it('treats an unreadable file as invalid rather than throwing', () => {
		expect(parseMessage(tree.path('slack/dev/missing.md'))).toBeNull();
		expect(validateMessage(null)).toEqual(['file could not be read']);
	});

	it('writes an envelope that parses back', () => {
		const filePath = tree.path('slack/dev/[REPORT]-9-done.md');
		writeMessage(filePath, { type: 'report', from: 'akvj-developer', to: 'team-lead', task: 9 }, 'Shipped it.');

		expect(fs.readFileSync(filePath, 'utf8')).toMatch(/^---\ntype: report\n/);
		expect(parseMessage(filePath)).toMatchObject({ type: 'report', from: 'akvj-developer', to: 'team-lead', task: '9' });
		expect(parseMessage(filePath).body.trim()).toBe('Shipped it.');
	});

	it('passes through re: on answers', () => {
		const filePath = tree.path('slack/dev/[ANSWER]-yes.md');
		writeMessage(
			filePath,
			{ type: 'answer', from: 'mainframe-developer', to: 'akvj-developer', re: '[QUESTION]-thing.md' },
			'Yes.'
		);

		expect(parseMessage(filePath)).toMatchObject({ type: 'answer', re: '[QUESTION]-thing.md' });
		expect(fs.readFileSync(filePath, 'utf8')).toContain('re: [QUESTION]-thing.md');
	});

	it('resolves the owner from the envelope, then the folder, then the team lead', () => {
		const addressed = parseMessage(tree.write('slack/qa-reviewer/a.md', message({ to: 'qa-reviewer' })));
		expect(resolveOwner(addressed)).toBe('qa-reviewer');

		// A file in someone's mailbox is theirs even if the envelope omits `to`.
		const byFolder = parseMessage(tree.write('slack/nitpicker/b.md', message({ type: 'nit', from: 'overseer' })));
		expect(resolveOwner(byFolder)).toBe('nitpicker');

		// Untriaged mail belongs to the Team Lead.
		const untriaged = parseMessage(tree.write('mail/in/c.md', message({ type: 'feature', from: 'human' })));
		expect(resolveOwner(untriaged)).toBe('team-lead');

		// Broadcast channel is not a single owner.
		const broadcast = parseMessage(tree.write('slack/all/d.md', message({ type: 'prompt-updated', from: 'overseer' })));
		expect(resolveOwner(broadcast)).toBe('team-lead');
	});
});
