# AKVJ Project Specification

This document describes how AKVJ should work. AI agents should read this to understand the intended behavior when implementing features.

---

## Application Purpose

AKVJ is a live performance visual tool for musicians and VJs. It displays animated visuals in response to MIDI input, creating a real-time visual experience synchronized with music.

---

## Core Behavior

### MIDI Input → Visual Output

1. **Note On**: When a MIDI note is pressed, immediately display the corresponding animation
2. **Note Off**: When a MIDI note is released, stop the animation (behavior depends on animation settings)
3. **Velocity**: Higher velocity may select a different animation variant or intensity

### Layer System

- **16 layers** (MIDI channels 0-15)
- Channel 0 = background (rendered first)
- Channel 15 = foreground (rendered last)
- Layers composite on top of each other
- Multiple notes can be active simultaneously on different channels

### Animation Playback

- Animations are sprite-based (PNG strips)
- Each animation can have custom frame rates per frame
- Animations can loop or play once
- Retrigger behavior is configurable per animation

---

## Visual Design

### Canvas

- Resolution: 240x135 pixels (16:9 aspect ratio)
- Pixel-perfect rendering (no anti-aliasing)
- Black background by default
- Scales to fit viewport while maintaining aspect ratio

### Aesthetic

- Pixel art style
- Sharp edges, no smoothing
- High contrast visuals work best for live performance

---

## Performance Requirements

### Targets

- **60fps** at all times
- **<20ms** MIDI-to-visual latency
- Smooth playback with multiple simultaneous animations

### Constraints

- No heavy computations in the render loop
- Preload all animation assets
- Efficient memory usage (clean up unused resources)

---

## Future Features

Use this section to describe features you want to add. AI can reference this when implementing.

### Planned

- [ ] ...describe feature idea here...
- [ ] ...another feature...

### Ideas (not yet decided)

- ...brainstorm ideas here...

---

## User Experience

### Target Users

- Musicians performing live
- VJs at events
- Visual artists

### Usage Context

- Live performance (reliability is critical)
- Dark environments (high contrast visuals)
- MIDI controller input (keyboard, pad controller, DAW)

---

## Technical Decisions

Document important decisions here so AI understands the reasoning.

### Why Vanilla JavaScript?

- Minimal dependencies = fewer things to break
- Direct control over performance
- No framework overhead in render loop

### Why Custom Elements?

- Native browser API
- Encapsulates the component
- Works without build step if needed

### Why 240x135 Resolution?

- 16:9 aspect ratio
- Pixel art aesthetic
- Scales well to any display size

---

## Notes

Add any additional notes, reminders, or context here that would help AI understand your vision.
