// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/ProjectChooser.js';

describe('ProjectChooser', () => {
	/** @type {import('../src/js/ProjectChooser.js').ProjectChooser} */
	let element;

	beforeEach(() => {
		element = document.createElement('project-chooser');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('renders active project indicator and select options', () => {
		element.projects = [
			{ id: 'default', name: 'Default' },
			{ id: 'gig-show', name: 'Gig Show' }
		];
		element.activeProjectId = 'gig-show';

		expect(element.querySelector('.project-chooser-active-id').textContent).toBe('Gig Show (gig-show)');
		const select = element.querySelector('select');
		expect(select.value).toBe('gig-show');
		expect(select.options.length).toBe(2);
	});

	test('changing select dispatches projectactivate', () => {
		element.projects = [
			{ id: 'default', name: 'Default' },
			{ id: 'gig-show', name: 'Gig Show' }
		];
		element.activeProjectId = 'default';

		let detail = null;
		element.addEventListener('projectactivate', event => {
			detail = event.detail;
		});

		const select = element.querySelector('select');
		select.value = 'gig-show';
		select.dispatchEvent(new Event('change'));

		expect(detail).toEqual({ projectId: 'gig-show' });
	});

	test('create button dispatches projectcreate with copyFrom', () => {
		element.projects = [{ id: 'default', name: 'Default' }];

		let detail = null;
		element.addEventListener('projectcreate', event => {
			detail = event.detail;
		});

		const nameInput = element.querySelector('.project-chooser-name');
		nameInput.value = 'Night Set';
		element.querySelector('.project-chooser-create button').click();

		expect(detail).toEqual({ name: 'Night Set', copyFrom: 'default' });
	});

	test('create with copy unchecked passes null copyFrom', () => {
		element.projects = [{ id: 'default', name: 'Default' }];

		let detail = null;
		element.addEventListener('projectcreate', event => {
			detail = event.detail;
		});

		element.querySelector('.project-chooser-copy input').checked = false;
		element.querySelector('.project-chooser-name').value = 'Blank';
		element.querySelector('.project-chooser-create button').click();

		expect(detail).toEqual({ name: 'Blank', copyFrom: null });
	});

	test('rename and delete dispatch events for active project', () => {
		element.projects = [
			{ id: 'default', name: 'Default' },
			{ id: 'gig-show', name: 'Gig Show' }
		];
		element.activeProjectId = 'gig-show';

		let renameDetail = null;
		let deleteDetail = null;
		element.addEventListener('projectrename', event => {
			renameDetail = event.detail;
		});
		element.addEventListener('projectdelete', event => {
			deleteDetail = event.detail;
		});

		const renameInput = element.querySelector('.project-chooser-rename');
		renameInput.value = 'Festival';
		element.querySelectorAll('.project-chooser-edit button')[0].click();
		element.querySelector('.project-chooser-delete').click();

		expect(renameDetail).toEqual({ projectId: 'gig-show', name: 'Festival' });
		expect(deleteDetail).toEqual({ projectId: 'gig-show' });
	});
});
