import ColorEffect from './colorEffect.js';
import MirrorEffect from './mirrorEffect.js';
import SplitEffect from './splitEffect.js';
import OffsetEffect from './offsetEffect.js';
import GlitchEffect from './glitchEffect.js';
import StrobeEffect from './strobeEffect.js';

/**
 * Effect registry keyed by each module's own `type` field.
 * Adding a new effect only requires listing its module here —
 * the registry key comes from the effect itself.
 */
const effectRegistry = Object.fromEntries([ColorEffect, MirrorEffect, SplitEffect, OffsetEffect, GlitchEffect, StrobeEffect].map(effect => [effect.type, effect]));

export default effectRegistry;
