# Team Update: Clip ID collision strategy

Follow-up to `request-simple-clip-ids.md` — clarifying how to handle ID collisions.

## Summary

Start with a **4-character** letters+numbers ID. If a generated ID **collides** with an existing clip, just **generate a new one** and try again. If 4 characters can't produce a free ID (the space is exhausted or we keep colliding), **grow the length** — go to 5, then 6, then 7, etc., as needed.

## Action Needed

- Default ID length: **4** (letters + numbers).
- On collision: regenerate a new ID and re-check.
- If length 4 can't yield a unique ID, increase length to **5 → 6 → 7 …** until a free ID is found.
- Uniqueness must always be guaranteed before the ID is assigned.

## Notes

- Same behavior applies whether the ID is random or derived from the clip name (name-derived IDs also grow/regenerate on clash).
- Keep the growth open-ended (no hard cap) so ID generation never fails to find a free slot.
