import colorEffect from './colorEffect.js';
import mirrorEffect from './mirrorEffect.js';
import splitEffect from './splitEffect.js';
import offsetEffect from './offsetEffect.js';
import glitchEffect from './glitchEffect.js';
import strobeEffect from './strobeEffect.js';
import grayscaleDisplacementEffect from './grayscaleDisplacementEffect.js';
import grayscaleBlendEffect from './grayscaleBlendEffect.js';

/**
 * Effect registry keyed by each module's own `type` field.
 * Adding a new effect only requires listing its module here —
 * the registry key comes from the effect itself.
 */
const effectRegistry = Object.fromEntries([colorEffect, mirrorEffect, splitEffect, offsetEffect, glitchEffect, strobeEffect, grayscaleDisplacementEffect, grayscaleBlendEffect].map(effect => [effect.type, effect]));

export default effectRegistry;
