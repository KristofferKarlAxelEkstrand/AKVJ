# Team Update: "Set scale for all" global control

Follow-up to `request-per-image-scale-and-placement.md`.

## Summary

Besides per-image scale, the editor should have a **global "set scale for all"** control — one
input that applies the same scale to **every** imported image at once — working just like the
global **"set all frames" timing (ms)** input.

## Action Needed

- Add a global scale input that applies its value to **all** images/frames.
- When any **individual** image's scale is changed, **grey out / disable** the global scale input
  (scales are now mixed) — same behavior as the global frame-timing input
  (`request-global-frame-timing-input.md`).
- Decide + document the reset path back to uniform scale so the global input re-enables.

## Notes

- Mirror the exact UX pattern from the frame-timing "set all" input for consistency.
- Still bake scale/placement into the image on save — this is editing-only state, not `meta.json`
  (per `request-per-image-scale-and-placement.md`).
- Open question (same as timing): when greyed out, show a "mixed" state or the last uniform value?
