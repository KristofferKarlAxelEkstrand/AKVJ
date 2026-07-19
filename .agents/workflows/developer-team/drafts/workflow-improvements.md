# Workflow Refactor Plan

**Goal:** Cleaner folder semantics — group communication under `mail/`, give tasks explicit kanban states.

---

## 1. Mail: inbox/outbox → mail/in + mail/out

**Current:**
```
inbox/
  read/         ← processed messages (staged before deletion)
outbox/         ← human decision queue
```

**Proposed:**
```
mail/
  in/           ← incoming requests (replaces inbox/)
  out/          ← human decision queue (replaces outbox/)
```

**Why it's better:**
- Groups both communication directions under one folder.
- `mail/` is more obviously a comms channel, not an agent's personal inbox.
- `in/` and `out/` are cleaner names with less ambiguity.

**What happens to `inbox/read/`?**  
The Golden Hygiene Rule already says: delete messages after acting. The `read/` subfolder exists as a soft-delete buffer. Two options:
- **Keep as `mail/in/read/`** — same behavior, clearer parent path.
- **Drop it entirely** — enforce hard-delete on process. Simpler, but loses the audit trail.

Recommendation: keep `mail/in/read/` for now, drop later when the team proves hygiene is consistent.

---

## 2. Tasks: flat done/ → todo/ + working-on/ + done/

**Current:**
```
tasks/
  done/         ← 260+ completed task files
```
(No explicit backlog or in-progress state — tasks live in agent memory or team-dashboard.md)

**Proposed:**
```
tasks/
  todo/         ← filed, not yet picked up
  working-on/   ← actively in progress (one task per developer at a time)
  done/         ← completed and QA-approved
```

**Why it's better:**
- Makes task state visible on disk, not just in the dashboard markdown.
- Agents can poll `tasks/todo/` for work instead of relying on team-lead routing.
- `working-on/` makes concurrency issues visible — if two tasks are there for the same developer, something is wrong.
- Dashboard generation becomes simpler: scan three folders, no status parsing.

**Lifecycle:**
```
Team Lead files task  →  tasks/todo/NNN-name.md
Developer picks up    →  mv todo/ → working-on/
Developer reports done →  stays in working-on/ until QA approves
QA approves           →  mv working-on/ → done/
```

---

## 3. Epics alignment

Epics already have `drafts/`, `todo/`, `done/`. The proposed task structure mirrors this intentionally. Once tasks adopt the same pattern, the two systems are consistent.

No change needed to epics structure.

---

## 4. Files that need updating

| File | What changes |
|------|-------------|
| `WORKFLOW.md` | Update all `inbox/`, `outbox/` references to `mail/in/`, `mail/out/` |
| `spec/collaboration-protocol.md` | Same path updates + task lifecycle section |
| `slack/general/team-guidelines.md` | Any inbox/outbox mentions |
| All 8 co-worker prompts (`.prompt.md` + `.prompt.json`) | Inbox/outbox path refs + task pickup logic |
| `README.md` | Path updates |
| Dashboard generation logic (if scripted) | Scan `tasks/todo/`, `working-on/`, `done/` |

---

## 5. What stays the same

- `slack/` structure — agent-specific personal mailboxes, not the same concern as `mail/`
- `memory/` — unchanged
- `spec/` — content unchanged, just path references in prose
- `epics/` — already has the right shape
- `drafts/` — human scratchpad, unchanged
- `.temp/` — polling state, unchanged

---

## 6. Migration steps

1. Create `mail/in/` and `mail/out/`, copy current `inbox/` and `outbox/` contents.
2. Create `tasks/todo/`, `tasks/working-on/`.
3. Move current active tasks (if any in working state) to `tasks/working-on/`.
4. Update all prose and prompt files (see table above).
5. Delete old `inbox/` and `outbox/` directories.
6. Announce change via `[PROMPT-UPDATED]` to all agents so they reload.

---

## 7. Open questions

- **Hard-delete vs `mail/in/read/`?** If agents are disciplined, `read/` is noise. Decide before migrating.
- **`working-on/` ownership** — should the filename encode which agent owns it? e.g. `NNN-name--akvj-developer.md`? Adds clarity, adds overhead.
- **Dashboard script** — does one exist or is it hand-maintained? If scripted, the task folder change is a code change too.
