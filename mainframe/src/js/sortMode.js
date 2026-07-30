/** Clip-library sort mode keys. */
export const SORT_MODE = {
	name: 'name',
	clipId: 'clipId',
	role: 'role',
	frames: 'frames'
};

/** Sort mode choices for `<sort-choices>` dropdowns. */
export const SORT_MODE_CHOICES = [
	{ value: SORT_MODE.name, label: 'Name' },
	{ value: SORT_MODE.clipId, label: 'ID' },
	{ value: SORT_MODE.role, label: 'Role' },
	{ value: SORT_MODE.frames, label: 'Frames' }
];

/** Default clip-library sort mode. */
export const DEFAULT_SORT_MODE = SORT_MODE.name;
