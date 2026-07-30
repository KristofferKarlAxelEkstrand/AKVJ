# Agent Health System: Smart Restart + Inspector Agent

## Status: Complete (2026-07-20) — both parts shipped, one of them twice

- **Part 1 (Enhanced Monitor)** shipped as `.agents/workflows/scripts/detect-stalled-work.js`,
  which routes a nudge to the agent named in an item's own frontmatter rather than blanket-restarting
  the Team Lead and Overseer. The monitor also gained pid-aware liveness, so a zombie poller can no
  longer make a dead agent look alive, plus flap escalation that stops restarting an agent that will
  not stay up and asks the human instead.
- **Part 2 (Health Inspector)** shipped as an agent, ran for a day, and was then **retired**: its
  whole job was reading JSON and subtracting timestamps, which `.agents/workflows/scripts/health-report.js`
  now does every monitor pass for free. The config survives with `"enabled": false`.
- Beyond the original scope: `health/uptime.log`, `health/alerts/`, a Team Health banner on the
  dashboard, and `npm run agents:status`.

The design below is kept as the record of what was intended. Do not build from it.

## Overview

Two-part system to keep agents productive:

1. **Enhanced Monitor** — Auto-restart agents when work sits idle 10+ minutes
2. **Health Inspector** — Fresh agent that audits team health every 45 min and reports

---

## Part 1: Enhanced Monitor (Smart Work-Detection Restart)

**Location:** `.agents/workflows/scripts/run-team` (extend existing monitor loop)

### Logic

Every 30 seconds, check for stalled work:

```
For each file in .agents/workflows/developer-team/mail/in/:
  If file age > 10 minutes AND
     No corresponding task in working-on/ for this agent:
    - Trigger restart of the assigned agent
    - Log: "Restarting {agent} — mail stalled 10+ min: {filename}"

For each file in .agents/workflows/developer-team/tasks/todo/:
  If file age > 10 minutes AND
     No agent has it in working-on/:
    - Restart the agent type it's assigned to (parse [TAG]-agent-name from filename)
    - Log: "Restarting {agent} — task stalled 10+ min: {filename}"
```

### Implementation Details

- Read file modification time: `fs.statSync(file).mtime`
- Calculate age: `Date.now() - mtime.getTime()`
- Threshold: `10 * 60 * 1000` ms (10 minutes)
- Respect existing `RESTART_COOLDOWN_SECONDS` (120s) — don't spam restarts
- Write restart request: create file in `health/restart-requests/{agent}.json`

### Success Criteria

- Stalled mail triggers restart (verify in monitor logs)
- Stalled tasks trigger restart
- Cooldown prevents restart spam
- No false positives (agent actively working = no restart)

---

## Part 2: Health Inspector Agent

**New role:** Spawns fresh every 45 min, audits team, reports, exits.

### Config

**File:** `.agents/workflows/developer-team/co-workers/health-inspector.prompt.json`

```json
{
  "display": "Health Inspector",
  "model": "SWE-1.7 Max",
  "prompt": "[See prompt.md below]",
  "wait_script": "node .agents/workflows/scripts/await-messages.js developer-team health-inspector",
  "random_tasks": ["Audit team health"],
  "sweep": "health audit",
  "min_wait_minutes": 40,
  "max_wait_minutes": 50,
  "mission_chance": 1.0,
  "cli": "devin",
  "enabled": true,
  "permission_mode": "yolo"
}
```

**Key:** Random wake every 40–50 min; 100% mission chance (always runs health audit on wake).

### Prompt

**File:** `.agents/workflows/developer-team/co-workers/health-inspector.prompt.md`

```markdown
# Health Inspector Workflow

You are the Health Inspector. Your job: audit the team's health every ~45 minutes and report findings.

## Your Audit Checklist

1. **Heartbeats** — Check `.agents/workflows/developer-team/health/heartbeats/`
   - List all agents and last heartbeat time
   - Flag any stale (>300s old)
   - Report: "Agent: {heartbeat age}s ago"

2. **Work Status** — Check mail, tasks, awaiting status
   - Count pending mail in `mail/in/`
   - Count stalled tasks in `tasks/todo/`
   - Read `health/awaiting/` — what is each agent waiting on?
   - Report: "{agent} waiting on {subject}"

3. **Restart Requests** — Check `health/restart-requests/`
   - List any pending restart requests
   - Report: "{agent} restart requested: {reason}"

4. **Stalled Work Detection** — Check file ages
   - Mail in `mail/in/` > 10 min old?
   - Tasks in `tasks/todo/` > 10 min old?
   - Flag for team lead if pattern detected

## Report Format

Write a health snapshot to `mail/out/[HEALTH-REPORT]-{timestamp}.md`:

```
# Health Report — {timestamp}

## Heartbeats (Last 5 min)
- team-lead: 15s ago ✓
- akvj-developer: 42s ago ✓
- qa-reviewer: stale (487s ago) ⚠️

## Work in Flight
- team-lead: 2 pending mail
- akvj-developer: waiting on npm-install approval
- qa-reviewer: (no activity)

## Restart Requests
- None pending

## Stalled Work
- mail/in/[TASK]-xyz.md — 12 min old, not picked up
- tasks/todo/[NIT]-abc.md — 8 min old (acceptable)

## Recommended Action
Restart qa-reviewer (heartbeat stale)
```

## Exit After Audit

After writing the report, exit gracefully. The system will spawn you fresh on the next sweep.
```

### Placement

- Enable it in the team config (add to co-workers list)
- It will spawn fresh every 40–50 min
- Runs audit, writes report, exits
- No state accumulation (always fresh start)

---

## Integration

### Monitor Changes (run-team)

1. Add work-detection loop (every 30s)
2. Check mail/tasks age against 10-min threshold
3. Trigger restart if stalled (respect cooldown)
4. Log all restarts with reason

### Inspector Changes (new agent)

1. Create `health-inspector.prompt.json` + `.prompt.md`
2. Add to agent list in run-team startup
3. Inspector spawns on random wake (40–50 min)
4. Runs audit, writes health report, exits

---

## Success Criteria

✅ **Stalled work triggers restart**
- Mail in `/mail/in/` > 10 min → agent restarts
- Task in `/tasks/todo/` > 10 min → agent restarts
- Cooldown prevents spam (no more than 1 restart per 120s per agent)

✅ **Health visibility**
- Health reports written to `mail/out/` every 45 min
- Reports show heartbeat status, work in flight, awaiting info
- Human can see team health at a glance

✅ **Fresh inspector**
- Inspector spawns, audits, reports, exits
- No accumulated state
- Next spawn is clean slate

---

## Future Extensions

- Slack integration: post health reports to a channel
- Thresholds configurable per agent (e.g., Quartermaster gets 30-min grace)
- Automated remediation: restart + escalate to Team Lead if pattern repeats
- Historical tracking: archive health reports for trend analysis
