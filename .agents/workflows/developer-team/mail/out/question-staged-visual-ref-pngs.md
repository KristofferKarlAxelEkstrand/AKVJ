---
type: question
from: team-lead
created: 2026-07-20T17:22:00Z
---

# Two binary PNGs are staged in the git index — please confirm

Not staged by the team; they were already in the index when mainframe-developer picked up task 401
(mtime 16:40, before the 16:44 regeneration run, which produced byte-identical output).

Staged now:

- `mainframe/test/visual/__screenshots__/mainframe-mapping-table-chromium-linux.png`
- `mainframe/test/visual/__screenshots__/mainframe-mapping-table-empty-chromium-linux.png`

They are the correct refreshed refs for the `N mapping(s)` copy change — `npm run test:visual -w mainframe`
passes 7/7 against them. But agents never stage binaries, so the commit is yours to make or unstage.

No answer needed if you are happy to commit them; 401 is with QA either way.

---

**Overseer note (17:2x):** the staged set is larger than the two above. `git diff --cached`
also has four `akvj` visual refs staged:

- `akvj/test/visual/__screenshots__/grayscale-blend-chromatic-chromium-linux.png`
- `akvj/test/visual/__screenshots__/grayscale-blend-invert-chromium-linux.png`
- `akvj/test/visual/__screenshots__/grayscale-displacement-horizontal-chromium-linux.png`
- `akvj/test/visual/__screenshots__/grayscale-displacement-vertical-chromium-linux.png`

Not verified by me and not mentioned in the question — decide on all six, not two.
No agent will stage or unstage any of them.

---

**Team Lead (17:40):** the akvj four come from **task 368** (`tasks/done/368-akvj-visual-grayscale-effects.md`),
which added Chromium visual references for `grayscaleDisplacement` and `grayscaleBlend`. Its own
checklist ends "human commits binaries", so they are new refs awaiting exactly this decision — not
strays. Task 368 passed the machine gate; `npm run test:visual` passes against them.

All six are expected new/updated references. Both source tasks (368, 401) are archived. Nothing is
blocked on your answer — the refs only become durable once you commit them.

**Correction (18:20):** "six staged files" understates it. `git diff --cached --name-only` returns
~250 paths — the whole session's work is staged, including all `akvj/src/`, `mainframe/`, docs, and
the task-file moves into `tasks/done/`. No agent staged any of it; it was already that way. The six
PNGs are simply the only *binaries* in that set, which is why they got singled out.

Nothing here needs undoing — working tree and index agree, `npm run lint`, `npm run test`, and
`npm run test:visual` are all green against it. Flagging only so "commit the two PNGs" is not read
as a small, isolated commit.
