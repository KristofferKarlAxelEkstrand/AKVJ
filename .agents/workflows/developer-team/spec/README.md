---
id: readme
title: Spec Index
status: approved
owner: human
maintainer: overseer
approved: 2026-07-20
verified: 2026-07-20
---

# Specs

A spec describes **how AKVJ works today**. It is the truth the team builds from and reviews
against — not a proposal, not a plan, not a record of what someone intended six weeks ago.

If the code and an approved spec disagree, that is a defect in one of them. Nobody quietly
picks a winner: the developer files a `blocked` message, QA rejects the task, and the human
decides which one changes.

## Index

| Spec | Status | What it covers |
| --- | --- | --- |
| [goal.md](goal.md) | draft | The akvj/mainframe split, projects, and real-world usage context |
| [aesthetics.md](aesthetics.md) | draft | Lo-fi pixel output vs. minimal mainframe UI |
| [clip-format.md](clip-format.md) | draft | `meta.json` / `clips.json` / `key-map.json` fields and rendering |
| [clip-timing-sync.md](clip-timing-sync.md) | draft | Free (FPS) timing, beat sync, MIDI clock behaviour |
| [clip-editor.md](clip-editor.md) | draft | The mainframe clip editor: create, edit, import, save |
| [mapping.md](mapping.md) | draft | Piano roll, velocity regions, and MIDI mapping edits |
| [process/collaboration-protocol.md](process/collaboration-protocol.md) | approved | How the agent team collaborates |
| [process/routine-maintenance.md](process/routine-maintenance.md) | approved | Workflow hygiene and idle cleanup |

Code standards live in the repo-root `AGENTS.md`. That file is not a spec — it describes how
code is written, not what the product does.

## Status

| Status | Meaning |
| --- | --- |
| `draft` | Written, not yet blessed. Informative, but nothing is bound by it. Tasks may not cite it. |
| `approved` | The human signed it off. Binding: work is built and reviewed against it. |
| `superseded` | Replaced. Lives in `archive/superseded-specs/` with a `superseded_by` pointer. |

**Only the human flips `draft` → `approved`.** That is the whole point of the gate: a spec
becomes binding because a person read it and agreed, not because an agent wrote it confidently.

## Frontmatter

Every spec carries:

```yaml
---
id: clip-timing-sync      # matches the filename
title: Clip Timing & Sync
status: draft             # draft | approved | superseded
owner: human              # who approves it
maintainer: overseer      # who may correct facts in it
approved:                 # date the human approved; empty while draft
verified: 2026-07-20      # date the content was last checked against the code
---
```

`check-specs.js` validates all of this. Run it after touching anything in here:

```bash
node .agents/workflows/scripts/check-specs.js developer-team
```

## Writing rules

1. **Present tense, current behaviour.** "Beat sync resolves to `syncBeats` at load." Never
   "we will", "the proposal is", "this builds on".
2. **Unbuilt ideas are not specs.** They belong in `epics/drafts/`. A spec may end with a short
   `## Not built yet` section naming what is deferred and where the idea lives — a pointer, not
   a design.
3. **Verify before you write.** Every claim is checked against the code, and `verified:` is
   bumped to that date. A spec nobody has re-read against the source is a rumour with frontmatter.
4. **One domain, one spec.** If two files describe the same thing, merge them. The reason this
   system exists is that four documents once described BPM sync and three of them were wrong.
5. **End with `## Changelog`** — date, one line, who.

## Who may write here

- **The human** owns `spec/`: creates specs, approves them, decides intent.
- **The Overseer** may correct a *fact* in an approved spec when shipped behaviour has moved past
  it — log it in the spec's changelog, bump `verified:`, and notify the team per the prompt-drift
  rule in `process/collaboration-protocol.md`. Intent changes are never a correction: those go to
  `mail/out/` as a question.
- **Every other agent** proposes in `epics/drafts/` and raises questions in `mail/out/`. They do
  not create or restructure files in `spec/`.

## Changelog

- 2026-07-20 — Spec system introduced: frontmatter, status gate, one spec per domain. Six product
  specs replaced eight overlapping proposal documents (moved to `archive/superseded-specs/`).
