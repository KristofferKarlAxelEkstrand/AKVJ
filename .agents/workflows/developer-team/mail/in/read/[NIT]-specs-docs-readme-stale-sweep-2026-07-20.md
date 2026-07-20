# [NIT] README.md is stale relative to AGENTS.md / repo structure

Area: `specs/docs` (README.md cross-checked against `AGENTS.md` and actual repo)

README.md has drifted from the canonical project layout and MIDI/clip schema terminology in `AGENTS.md` and `clip-schema.md`. It is the first thing a newcomer reads, so stale names and paths create real friction.

## Checklist (copy-paste actionable)

- [ ] `README.md` lines 15-16: "Channels 14-16: Reserved" → split to "Channel 14: Project selection" and "Channels 15-16: Reserved".
  - **Why:** `AGENTS.md` MIDI Mapping table assigns channel 14 to project selection; README omits it.
  - **Suggested text:**
    ```markdown
    - Channel 14: Project selection (note → project switch, latched)
    - Channels 15-16: Reserved
    ```

- [ ] `README.md` lines 92-98: clip directory tree uses `clips/{clipId}/` and `akvj/src/public/clips/`.
  - **Why:** repo uses `projects/{projectId}/clips/{clipId}/`; build pipeline copies to `akvj/src/public/projects/{projectId}/clips/`.
  - **Suggested tree:**
    ```text
    projects/{projectId}/clips/{clipId}/
    ├── meta.json
    └── sprite.png
    projects/{projectId}/key-map.json
    akvj/src/public/projects/{projectId}/clips/
    ```

- [ ] `README.md` lines 121-130 and 134-138: example `meta.json` and properties list use legacy `numberOfFrames` and boolean `loop`.
  - **Why:** `AGENTS.md` / `clip-schema.md` define `frames` as canonical and `playback` as the enum (`once`/`loop`/`pingpong`/…); `numberOfFrames` is a legacy alias, `loop` is not the field name.
  - **Suggested example:**
    ```json
    {
        "frames": 64,
        "framesPerRow": 8,
        "playback": "loop",
        "retrigger": true,
        "frameRatesForFrames": { "0": 2, "32": 4 }
    }
    ```

- [ ] `README.md` lines 109-113 and 239-249: pipeline/scripts location points to `akvj/scripts/clips/`.
  - **Why:** the clip pipeline scripts live under `mainframe/scripts/clips/`; `akvj/scripts/clips/` does not exist.
  - **Suggested:** update the file-structure tree to show `mainframe/scripts/clips/` and the `npm run clips` description.

- [ ] `README.md` lines 158-163: velocity-variant table is oversimplified.
  - **Why:** `AGENTS.md` says velocity slots are defined per placement in `key-map.json` and selected by `findVelocityThreshold` in `akvj/src/js/utils/velocitySelection.js`; the two-row table implies a global hard-coded mapping.
  - **Suggested:** replace the table with a short paragraph pointing to `key-map.json` velocity slots and `velocitySelection.js`.

## Notes

- `code-standards.md`, `clip-schema.md`, and `collaboration-protocol.md` are consistent and clean; no new nits.
- `collaboration-protocol.md` prior `inbox/`/`outbox/` stale-reference nit appears resolved (only historical changelog mentions remain).
