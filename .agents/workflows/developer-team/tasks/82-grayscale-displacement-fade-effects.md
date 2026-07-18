---
status: backlog
assignee: none
priority: low
---

# Task 82: Grayscale-Driven Displacement / Fade Effects (Feature Idea)

## Severity: Low (Feature idea — not urgent, user said "test the basics first")

## Context
User fleshed out the "monochrome clips as effect base" idea with two concrete concepts:

1. **Grayscale-driven pixel displacement**: A grayscale source image acts as a per-pixel displacement map — 50% gray (128) = no shift, values above/below 128 shift pixels left/right proportionally. Similar to existing `offsetEffect.js` and `glitchEffect.js`.

2. **Grayscale-driven soft fade/blend**: Grayscale values control a smooth blend/opacity, as opposed to existing hard-cut effects. Could reuse existing multi-bit mask blend math from `Compositor.js#mixMultiBit`.

## Existing Infrastructure
- `Compositor.js`'s `#mixMultiBit` already treats mask pixel values as grayscale for 2/4/8-bit depths
- Effect modules follow `apply(imageData, effect, timestamp, effectContext)` pattern
- `akvj/src/js/visuals/effects/` has offset, glitch, and other per-pixel effects

## Aesthetic Direction (from user, 2026-07-17 follow-up)
User wants these effects to be **lo-fi and crude**, not smooth/polished — explicitly pointed at the demo scene as inspiration and invited the team to research it. Well-known demo-scene techniques that map naturally onto "grayscale/luminance drives per-pixel behavior" and fit a crude/lo-fi aesthetic (worth a look when this gets picked up, not exhaustive):
- **Plasma effects** — classic sine-wave-sum luminance fields, often just used directly as a color/displacement source
- **Tunnel effects** — polar-coordinate remapping driven by a source texture's brightness
- **Palette cycling / color cycling** — animating a color lookup table over a static grayscale/indexed image instead of redrawing pixels (very cheap, very lo-fi-looking)
- **Bump mapping (2D raster version)** — luminance treated as a heightmap to fake pseudo-3D lighting/displacement
- **Raster bars / sine scrollers** — simple per-row or per-column sinusoidal displacement, easy to make "crude" on purpose by using low-res or stepped (non-interpolated) sine tables

User's own words: "I want them to be a bit lofi, and crude, and I suspect there are some really well-known things used in the demo scene... talk about it and research about it, we can definitely work on it going forward." No further input needed right now — they're comfortable with the team exploring and coming back with ideas.

**Follow-up broadcast (2026-07-17, `team-update-amiga-demo-scene-inspiration.md`)** narrowed this to specifically the **Amiga demo scene** (late-80s/90s) — this is exactly where the techniques above originate. A couple more Amiga-specific staples worth knowing about if this gets picked up, on top of the list above:
- **Rotozoomer** — a source texture simultaneously rotated and scaled per-frame; a grayscale/luminance version could drive per-pixel intensity of the rotation/zoom rather than color.
- **Copper bars** — smooth per-scanline color gradients (originally an Amiga hardware trick); the *look* (banded, horizontal gradient bars) is easy to reproduce in canvas without needing the original hardware mechanism, and could be another grayscale-driven variant (row luminance → color).
Guidance from the update: "borrow concepts in a thoughtful way, rather than copy them directly."

## Status
Needs proper design discussion before implementation. Filed for when clip-format and MIDI-clock hardening work is further along. User explicitly said to test the basics first.

## Dependencies
- Conceptually related to bitmask/mixer system (`MaskManager.js`, `Compositor.js`)
- Related to effect module pattern (`akvj/src/js/visuals/effects/`)
- Should be sequenced after user has tested the current clip format + MIDI clock work
