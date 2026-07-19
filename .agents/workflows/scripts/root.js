import path from 'node:path';

// Scripts live at .agents/workflows/scripts/ — three levels below the repo root.
export const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');

export const DEFAULT_WORKFLOW = 'developer-team';
