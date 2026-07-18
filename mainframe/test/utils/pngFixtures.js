/** Canonical 1×1 PNG (transparent) as base64 — sharp/libpng compatible. */
export const PNG_1x1_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==';

/** Canonical 1×1 PNG buffer. */
export const PNG_1x1 = Buffer.from(PNG_1x1_BASE64, 'base64');
