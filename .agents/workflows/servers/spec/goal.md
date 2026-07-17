# Overarching Goal: The Server Split & Vision

The goal of this project is to maintain a strict architectural split between two highly decoupled realms: `akvj` and `mainframe`.

## AKVJ: The Live Visualizer
- **Purpose**: A highly efficient pixel VJ setup used in live performances as a backdrop or lighting.
- **Triggered by MIDI**: It runs on a computer that receives MIDI via WebMIDI from a sequencer or DAW to create live, synced visualizations that follow what the performer does.
- **Performance**: It must be extremely efficient, run flawlessly, and completely lock to a 60fps render loop with zero heavy dependencies.
- **No UI**: It should have essentially no user interface. It is meant to run fullscreen (toggled via space and double click) and do nothing but perform its visualization duties.

## Mainframe: The Backoffice
- **Purpose**: A user-friendly backoffice dashboard where you set up, edit, and map all the clips for the live visualizer.
- **User Experience**: It must be easy to use, intuitive, and not overly complex.
- **Clip Management**: The place to import images, resize them to needed dimensions, optimize them, and save sprite maps as PNGs.
- **Mapping**: Used to define trigger zones for clips and configure how MIDI interacts with the visuals.

## The Bridge
The only allowed communication between the two realms is the shared `clips/` directory and its metadata JSON files. They must never share javascript module imports.
