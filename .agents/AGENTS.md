# .agents/

Agent-agnostic configuration following the [Agent Skills](https://agentskills.io) open standard and [AGENTS.md](https://agents.md) conventions.

## Layout

- `skills/` — Shared skills (committed). Each is a directory with `SKILL.md`.
- `skills-local/` — Private skills (gitignored).
- `scripts/` — Sync and validation scripts.

## Adding a Skill

1. Create `.agents/skills/<name>/SKILL.md` with `name` + `description` frontmatter
2. Run `.agents/scripts/link-skills.sh`
3. Commit the skill directory and the new symlink

## Installing Third-Party Skills

```bash
npx skills add <repo>@<skill-name> -y
```

## Rules

- Edit skills in `.agents/skills/`, never in `.claude/skills/` or `.cursor/skills/`
- The symlink script is the single source of truth for agent-native directories
- Run `link-skills.sh` after adding or removing skills
