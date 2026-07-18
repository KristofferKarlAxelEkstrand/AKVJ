import '../scss/ProjectChooser.scss';

/**
 * ProjectChooser — select active project, create, rename, delete.
 *
 * @fires ProjectChooser#projectactivate - `{ detail: { projectId } }`
 * @fires ProjectChooser#projectcreate - `{ detail: { name, copyFrom } }`
 * @fires ProjectChooser#projectrename - `{ detail: { projectId, name } }`
 * @fires ProjectChooser#projectdelete - `{ detail: { projectId } }`
 */
class ProjectChooser extends HTMLElement {
	/** @type {Array<{id: string, name: string}>} */
	#projects = [];
	#activeProjectId = 'default';
	#select = null;
	#activeLabel = null;
	#nameInput = null;
	#copyFromCheckbox = null;
	#renameInput = null;

	/**
	 * @param {Array<{id: string, name: string}>} projects
	 */
	set projects(projects) {
		this.#projects = Array.isArray(projects) ? projects : [];
		this.#renderOptions();
	}

	get projects() {
		return this.#projects;
	}

	/**
	 * @param {string} projectId
	 */
	set activeProjectId(projectId) {
		this.#activeProjectId = projectId || 'default';
		if (this.#select) {
			this.#select.value = this.#activeProjectId;
		}
		this.#updateActiveLabel();
		if (this.#renameInput) {
			const active = this.#projects.find(project => project.id === this.#activeProjectId);
			this.#renameInput.value = active?.name || this.#activeProjectId;
		}
	}

	get activeProjectId() {
		return this.#activeProjectId;
	}

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
		this.#select = null;
		this.#activeLabel = null;
		this.#nameInput = null;
		this.#copyFromCheckbox = null;
		this.#renameInput = null;
	}

	#render() {
		this.replaceChildren();

		const activeRow = document.createElement('div');
		activeRow.className = 'project-chooser-active';
		const activeTitle = document.createElement('span');
		activeTitle.className = 'project-chooser-active-title';
		activeTitle.textContent = 'Active project';
		this.#activeLabel = document.createElement('strong');
		this.#activeLabel.className = 'project-chooser-active-id';
		activeRow.append(activeTitle, this.#activeLabel);

		const selectLabel = document.createElement('label');
		selectLabel.className = 'project-chooser-field';
		selectLabel.append('Switch project');
		this.#select = document.createElement('select');
		this.#select.className = 'project-chooser-select';
		this.#select.setAttribute('aria-label', 'Select project');
		this.#select.addEventListener('change', () => {
			this.dispatchEvent(
				new CustomEvent('projectactivate', {
					bubbles: true,
					detail: { projectId: this.#select.value }
				})
			);
		});
		selectLabel.append(this.#select);

		const createForm = document.createElement('div');
		createForm.className = 'project-chooser-create';
		const createTitle = document.createElement('h3');
		createTitle.textContent = 'Create project';
		this.#nameInput = document.createElement('input');
		this.#nameInput.type = 'text';
		this.#nameInput.placeholder = 'Project name';
		this.#nameInput.className = 'project-chooser-name';
		this.#nameInput.setAttribute('aria-label', 'New project name');

		const copyLabel = document.createElement('label');
		copyLabel.className = 'project-chooser-copy';
		this.#copyFromCheckbox = document.createElement('input');
		this.#copyFromCheckbox.type = 'checkbox';
		this.#copyFromCheckbox.checked = true;
		copyLabel.append(this.#copyFromCheckbox, ' Copy key-map from default');

		const createButton = document.createElement('button');
		createButton.type = 'button';
		createButton.textContent = 'Create';
		createButton.addEventListener('click', () => {
			const name = this.#nameInput.value.trim();
			if (!name) {
				return;
			}
			this.dispatchEvent(
				new CustomEvent('projectcreate', {
					bubbles: true,
					detail: {
						name,
						copyFrom: this.#copyFromCheckbox.checked ? 'default' : null
					}
				})
			);
		});
		createForm.append(createTitle, this.#nameInput, copyLabel, createButton);

		const editForm = document.createElement('div');
		editForm.className = 'project-chooser-edit';
		const editTitle = document.createElement('h3');
		editTitle.textContent = 'Edit selected';
		this.#renameInput = document.createElement('input');
		this.#renameInput.type = 'text';
		this.#renameInput.className = 'project-chooser-rename';
		this.#renameInput.setAttribute('aria-label', 'Rename project');
		const renameButton = document.createElement('button');
		renameButton.type = 'button';
		renameButton.textContent = 'Rename';
		renameButton.addEventListener('click', () => {
			const name = this.#renameInput.value.trim();
			if (!name) {
				return;
			}
			this.dispatchEvent(
				new CustomEvent('projectrename', {
					bubbles: true,
					detail: { projectId: this.#activeProjectId, name }
				})
			);
		});
		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.className = 'project-chooser-delete';
		deleteButton.textContent = 'Delete';
		deleteButton.addEventListener('click', () => {
			this.dispatchEvent(
				new CustomEvent('projectdelete', {
					bubbles: true,
					detail: { projectId: this.#activeProjectId }
				})
			);
		});
		const mappingHint = document.createElement('p');
		mappingHint.className = 'project-chooser-hint';
		mappingHint.textContent = 'Edit the active project key-map on the Mapping page.';
		editForm.append(editTitle, this.#renameInput, renameButton, deleteButton, mappingHint);

		this.append(activeRow, selectLabel, createForm, editForm);
		this.#renderOptions();
		this.#updateActiveLabel();
	}

	#renderOptions() {
		if (!this.#select) {
			return;
		}
		this.#select.replaceChildren();
		for (const project of this.#projects) {
			const option = document.createElement('option');
			option.value = project.id;
			option.textContent = `${project.name} (${project.id})`;
			if (project.id === this.#activeProjectId) {
				option.selected = true;
			}
			this.#select.append(option);
		}
		if (this.#projects.length === 0) {
			const option = document.createElement('option');
			option.value = 'default';
			option.textContent = 'default';
			this.#select.append(option);
		}
	}

	#updateActiveLabel() {
		if (!this.#activeLabel) {
			return;
		}
		const active = this.#projects.find(project => project.id === this.#activeProjectId);
		this.#activeLabel.textContent = active ? `${active.name} (${active.id})` : this.#activeProjectId;
	}
}

customElements.define('project-chooser', ProjectChooser);

export { ProjectChooser };
