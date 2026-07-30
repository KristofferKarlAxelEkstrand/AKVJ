/** Default when a clip's `meta.role` is omitted or empty — matches library chip "Clip". */
export const DEFAULT_CLIP_ROLE = 'clip';

/** Role filter choices for `<role-choices>` dropdowns. */
export const ROLE_FILTER_CHOICES = [
	{ value: '', label: 'All' },
	{ value: DEFAULT_CLIP_ROLE, label: 'Clip' },
	{ value: 'bitmask', label: 'Bitmask' }
];
