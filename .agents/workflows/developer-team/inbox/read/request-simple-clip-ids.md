# Team Update: Simplify clip IDs + derive from clip name

## Summary

Clip IDs should be **short and simple**: a 4-character combo of letters and numbers (e.g. `a1b2`, `9xk3`). The generator must guarantee the ID does **not clash** with any existing clip before assigning it.

When the user provides a **clip name**, use that to derive the ID (slug/normalize the name) instead of a random combo — still keeping it collision-free. The editor/uploader should reflect the ID **in real time** as the user types or changes settings.

## Impact

- Current IDs are longer/less human-friendly than needed.
- Authors currently don't see the final ID form as they work, so the ID feels disconnected from the clip they're creating.

## Action Needed

- **ID format:** 4 characters, letters + numbers combo.
- **Uniqueness:** check against existing clips and regenerate/adjust on any clash before assigning.
- **Name-derived IDs:** if the user enters a clip name, derive the ID from it (normalized/slugged, truncated/hashed to the 4-char shape), still collision-checked.
- **Real-time update:** show and update the ID live in the editor / uploader as the name or inputs change — no save required to see it.

## Notes

- Keep IDs immutable after first create (rename stays out of scope per the edit-clip spec).
- Consider how a 4-char space handles collisions at scale — define the retry/fallback behavior in the task (e.g. regenerate, or append/replace a char) so uniqueness is guaranteed.
- Relevant surface: the shared clip editor / uploader (`/clip/edit`) — see `.agents/workflows/developer-team/spec/feature-edit-clip.md`.
