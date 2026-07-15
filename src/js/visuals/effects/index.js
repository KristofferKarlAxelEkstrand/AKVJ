import ColorEffect from './ColorEffect.js';
import MirrorEffect from './MirrorEffect.js';
import SplitEffect from './SplitEffect.js';
import OffsetEffect from './OffsetEffect.js';
import GlitchEffect from './GlitchEffect.js';
import StrobeEffect from './StrobeEffect.js';

/**
 * Effect registry keyed by each module's own `type` field.
 * Adding a new effect only requires listing its module here —
 * the registry key comes from the effect itself.
 */
const effectRegistry = Object.fromEntries([ColorEffect, MirrorEffect, SplitEffect, OffsetEffect, GlitchEffect, StrobeEffect].map(effect => [effect.type, effect]));

export default effectRegistry;
