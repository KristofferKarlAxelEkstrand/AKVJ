/**
 * ProjectCatalog — project resolution helper.
 *
 * Handles fetching the active project ID, projects index, and building
 * project-scoped URLs for key-map and clips catalog. Extracted from
 * ClipLoader so the loader can focus on clip loading, not project discovery.
 *
 * Stateless by design: the active project id lives in AppState, and callers
 * pass it in. This class never keeps a copy of it.
 */

import settings from '../core/settings.js';
import { SAFE_ID_PATTERN } from './clipMetadata.js';

class ProjectCatalog {
	/**
	 * Load and parse JSON from URL.
	 * @param {string} jsonUrl
	 * @returns {Promise<unknown>}
	 */
	async #loadJson(jsonUrl) {
		const fetchUrl = import.meta.env.DEV ? `${jsonUrl}?t=${performance.now()}` : jsonUrl;
		const response = await fetch(fetchUrl);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} for ${jsonUrl}`);
		}
		return response.json();
	}

	/**
	 * Fetch the active project ID from active-project.json.
	 * Falls back to null if the file is missing or invalid.
	 * @returns {Promise<string|null>}
	 */
	async fetchActiveProjectId() {
		try {
			const activeProject = await this.#loadJson(settings.performance.activeProjectUrl);
			if (activeProject && typeof activeProject.project === 'string' && SAFE_ID_PATTERN.test(activeProject.project)) {
				return activeProject.project;
			}
		} catch {
			// No active-project.json — fall back to legacy key-map
		}
		return null;
	}

	/**
	 * Fetch the projects index (list of all projects).
	 * @returns {Promise<Array<{id: string, name: string}>>}
	 */
	async fetchProjectsIndex() {
		try {
			const index = await this.#loadJson(settings.performance.projectsIndexUrl);
			if (Array.isArray(index)) {
				return index.filter(entry => entry && typeof entry.id === 'string' && SAFE_ID_PATTERN.test(entry.id));
			}
		} catch {
			// No projects index — return empty
		}
		return [];
	}

	/**
	 * Build the key-map URL for a specific project.
	 * @param {string} projectId
	 * @returns {string}
	 */
	buildProjectKeyMapUrl(projectId) {
		if (!SAFE_ID_PATTERN.test(projectId)) {
			throw new Error(`Invalid project ID: ${projectId}`);
		}
		return settings.performance.projectKeyMapUrlTemplate.replace('{projectId}', projectId);
	}

	/**
	 * Build the clips.json URL for a specific project.
	 * @param {string} projectId
	 * @returns {string}
	 */
	buildProjectClipsJsonUrl(projectId) {
		if (!SAFE_ID_PATTERN.test(projectId)) {
			throw new Error(`Invalid project ID: ${projectId}`);
		}
		return settings.performance.projectClipsJsonUrlTemplate.replace('{projectId}', projectId);
	}
}

export default ProjectCatalog;
