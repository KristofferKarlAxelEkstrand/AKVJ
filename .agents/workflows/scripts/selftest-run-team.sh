#!/bin/bash
# selftest-run-team.sh — behavioural checks for the parts of run-team that bash owns.
#
# These three cases were all live defects: `"enabled": false` silently started
# the agent anyway (jq's `//` substitutes the default for `false` as well as for
# null), and the health monitor restarted agents mid-task because a heartbeat is
# only written while an agent sleeps, so "busy" and "dead" looked identical.
#
# Everything runs against a throwaway workflow tree and a stub CLI, so no real
# agent is ever launched. Usage: bash selftest-run-team.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="selftest-agents"
WORKFLOW="selftest"

PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; echo "      $2"; FAIL=$((FAIL + 1)); }

for tool in jq tmux; do
    command -v "$tool" >/dev/null || { echo "Skipping: $tool is not installed."; exit 0; }
done

TMP_ROOT="$(mktemp -d)"
cleanup() {
    tmux kill-session -t "$SESSION" 2>/dev/null
    rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

# A workflow tree laid out exactly where run-team expects it, relative to a copy
# of the scripts directory (run-team derives the repo root from its own path).
SCRIPTS="$TMP_ROOT/.agents/workflows/scripts"
WF="$TMP_ROOT/.agents/workflows/$WORKFLOW"
mkdir -p "$SCRIPTS" "$WF"/{co-workers,health/heartbeats,health/restart-requests,health/awaiting,mail/in,tasks/todo,tasks/working-on,.temp}
cp "$SCRIPT_DIR"/run-team "$SCRIPT_DIR"/*.js "$SCRIPTS/"
cp -r "$SCRIPT_DIR/lib" "$SCRIPTS/" 2>/dev/null
cp "$SCRIPT_DIR/cli-models.json" "$SCRIPTS/"
# generate-prompt.js (and friends) need ESM; Node walks up from the script for package.json.
printf '{"type":"module"}\n' > "$TMP_ROOT/package.json"

# Stub CLI: observable, launches nothing real.
mkdir -p "$TMP_ROOT/bin"
cat > "$TMP_ROOT/bin/claude" <<'STUB'
#!/bin/bash
echo "[stub] launched"
sleep 300
STUB
chmod +x "$TMP_ROOT/bin/claude"
export PATH="$TMP_ROOT/bin:$PATH"

agent_config() {
    printf '{"display":"%s","cli":"claude","wait_script":"sleep 300"%s}' "$1" "${2:-}" > "$WF/co-workers/$1.prompt.json"
    printf '# %s\n\nRole body.\n' "$1" > "$WF/co-workers/$1.prompt.md"
}

echo "run-team self-test"
echo ""

# ---------------------------------------------------------------------------
echo "enabled flag"
# ---------------------------------------------------------------------------
agent_config "alpha"
agent_config "beta" ',"enabled":false'

DISCOVERED="$(cd "$TMP_ROOT" && bash -c '
    source <(sed -n "/^read_json()/,/^}/p;/^discover_agents()/,/^}/p" '"$SCRIPTS"'/run-team)
    WORKFLOWS_DIR="'"$TMP_ROOT"'/.agents/workflows"
    discover_agents '"$WORKFLOW"' 2>/dev/null
')"

if echo "$DISCOVERED" | grep -qx "alpha"; then
    pass "an enabled agent is discovered"
else
    fail "an enabled agent is discovered" "got: $DISCOVERED"
fi

if echo "$DISCOVERED" | grep -qx "beta"; then
    fail "\"enabled\": false skips the agent" "beta was discovered anyway: $DISCOVERED"
else
    pass "\"enabled\": false skips the agent"
fi

# ---------------------------------------------------------------------------
echo ""
echo "monitor: busy vs dead"
# ---------------------------------------------------------------------------
rm -f "$WF/co-workers/beta.prompt.json" "$WF/co-workers/beta.prompt.md"
agent_config "busy"
agent_config "dead"

tmux kill-session -t "$SESSION" 2>/dev/null
tmux new-session -d -s "$SESSION" -n agents
tmux split-window -h -t "$SESSION:agents"
sleep 0.5
# Pane 0 holds a running process (a working agent); pane 1 sits at a bare shell.
tmux send-keys -t "$SESSION:agents.0" "sleep 600" C-m
sleep 1

for pane in 0:busy 1:dead; do
    index="${pane%%:*}"; name="${pane##*:}"
    pane_id=$(tmux display-message -p -t "$SESSION:agents.$index" '#{pane_id}')
    jq -n --arg id "$pane_id" --arg a "$name" --argjson i "$index" \
        '{agent:$a,pane_id:$id,pane_index:$i,cli:"claude"}' > "$WF/health/$name-pane.json"
    echo '{"ts":1}' > "$WF/health/heartbeats/$name.json"
done

# Stale enough to trip the check, far short of the hung threshold.
touch -d '8 minutes ago' "$WF/health/heartbeats/busy.json" "$WF/health/heartbeats/dead.json"

MONITOR_OUT="$(cd "$TMP_ROOT" && timeout 25 bash "$SCRIPTS/run-team" --monitor "$WORKFLOW" 2>&1)"

if echo "$MONITOR_OUT" | grep -q "Agent busy heartbeat stale.*CLI is running"; then
    pass "a stale heartbeat with a live CLI is left alone"
else
    fail "a stale heartbeat with a live CLI is left alone" "$(echo "$MONITOR_OUT" | grep -i busy | head -2)"
fi

if echo "$MONITOR_OUT" | grep -qE "Agent dead .*no CLI in its pane \(confirmed\)\. Restarting"; then
    pass "a stale heartbeat with no CLI is restarted"
else
    fail "a stale heartbeat with no CLI is restarted" "$(echo "$MONITOR_OUT" | grep -i dead | head -2)"
fi

if echo "$MONITOR_OUT" | grep -q "confirming next pass"; then
    pass "a dead-looking pane is confirmed before being restarted"
else
    fail "a dead-looking pane is confirmed before being restarted" "no confirmation step in output"
fi

# ---------------------------------------------------------------------------
echo ""
echo "monitor: restart requests"
# ---------------------------------------------------------------------------
touch "$WF/health/heartbeats/busy.json" "$WF/health/heartbeats/dead.json"
echo '{"reason":"stuck"}' > "$WF/health/restart-requests/busy.json"

REQUEST_OUT="$(cd "$TMP_ROOT" && timeout 15 bash "$SCRIPTS/run-team" --monitor "$WORKFLOW" 2>&1)"

if echo "$REQUEST_OUT" | grep -q "Found restart request for: busy"; then
    pass "a restart request is honoured"
else
    fail "a restart request is honoured" "$(echo "$REQUEST_OUT" | head -3)"
fi

if [ -f "$WF/health/restart-requests/busy.json" ]; then
    fail "an honoured request is consumed" "the request file is still there"
else
    pass "an honoured request is consumed"
fi

# ---------------------------------------------------------------------------
echo ""
echo "shell quoting (apostrophe injection)"
# ---------------------------------------------------------------------------
# Source only the quoting helpers — do not execute run-team's top-level side effects.
eval "$(sed -n \
    -e '/^HUNG_AGENT_SECONDS=/p' \
    -e '/^ONESHOT_MIN_LOOP_SECONDS=/p' \
    -e '/^shell_quote()/,/^}/p' \
    -e '/^cli_permission_args()/,/^}/p' \
    -e '/^cli_turn_command()/,/^}/p' \
    -e '/^oneshot_loop_command()/,/^}/p' \
    "$SCRIPTS/run-team")"

PWNED="$TMP_ROOT/quote-injection-pwned"
rm -f "$PWNED"
# Classic single-quote breakout: closes '%s', runs touch, reopens a dangling quote.
EVIL_MODEL="x'; touch ${PWNED}; echo '"
EVIL_PATH="$TMP_ROOT/prompt'file.txt"
: > "$EVIL_PATH"

# model_args is a pre-quoted fragment (printf %q). Inserted unquoted into bash -c
# so the pane-style parse happens: breakout would run touch before probe runs.
printf -v model_args -- '--model %q' "$EVIL_MODEL"
bash -c "probe() { printf '%s\n' \"\$2\" > \"$TMP_ROOT/model-argv.txt\"; }; probe $model_args" 2>/dev/null || true

if [ -f "$PWNED" ]; then
    fail "model apostrophes cannot break out of --model quoting" "payload executed (created $PWNED)"
else
    pass "model apostrophes cannot break out of --model quoting"
fi

if [ -f "$TMP_ROOT/model-argv.txt" ] && [ "$(cat "$TMP_ROOT/model-argv.txt")" = "$EVIL_MODEL" ]; then
    pass "quoted --model round-trips the original value"
else
    fail "quoted --model round-trips the original value" \
        "got: $(cat "$TMP_ROOT/model-argv.txt" 2>/dev/null || echo missing)"
fi

rm -f "$PWNED"
# Same breakout pattern through cli_turn_command's full string. Strip the binary
# invocation down to `true` so we only exercise shell parsing of the quoted args
# and the redirect target (never start the stub CLI).
TURN=$(cli_turn_command claude "$TMP_ROOT/bin/claude" "$EVIL_MODEL" "$EVIL_PATH" bypassPermissions)
BIN_Q=$(printf '%q' "$TMP_ROOT/bin/claude")
PARSE_ONLY=${TURN/#$BIN_Q/true}
bash -c "$PARSE_ONLY" 2>/dev/null || true

if [ -f "$PWNED" ]; then
    fail "cli_turn_command keeps apostrophes in model/path inert" "payload executed (created $PWNED)"
else
    pass "cli_turn_command keeps apostrophes in model/path inert"
fi

# Path with an apostrophe must still be openable via the quoted redirect/cat form.
if bash -c "cat $(printf '%q' "$EVIL_PATH")" >/dev/null 2>&1; then
    pass "prompt path with an apostrophe is readable when %q-quoted"
else
    fail "prompt path with an apostrophe is readable when %q-quoted" "cat failed for $EVIL_PATH"
fi

rm -f "$PWNED"
PERM_ARGS=$(cli_permission_args claude "bypass'; touch ${PWNED}; echo '")
bash -c "true $PERM_ARGS" 2>/dev/null || true
if [ -f "$PWNED" ]; then
    fail "permission_mode apostrophes cannot break out of quoting" "payload executed"
else
    pass "permission_mode apostrophes cannot break out of quoting"
fi

# ---------------------------------------------------------------------------
echo ""
echo "oneshot loop floor (no hot-spin on instant CLI exit)"
# ---------------------------------------------------------------------------
LOOP=$(oneshot_loop_command "true" "true" 2)
if printf '%s\n' "$LOOP" | grep -Fq '_loop_start=' \
    && printf '%s\n' "$LOOP" | grep -Fq 'sleep $(( 2 - _loop_elapsed ))'; then
    pass "oneshot_loop_command embeds the floor sleep"
else
    fail "oneshot_loop_command embeds the floor sleep" "got: $LOOP"
fi

# One iteration of a fast turn+wait must still take ~floor seconds, not spin.
START=$(date +%s)
bash -c "${LOOP/while true/for _i in 1}"
ELAPSED=$(( $(date +%s) - START ))
if [ "$ELAPSED" -ge 2 ]; then
    pass "fast turn+wait is paced by the floor (${ELAPSED}s >= 2s)"
else
    fail "fast turn+wait is paced by the floor" "elapsed ${ELAPSED}s (< 2s) — loop still hot-spins"
fi

if [ -n "${ONESHOT_MIN_LOOP_SECONDS:-}" ] && [ "$ONESHOT_MIN_LOOP_SECONDS" -ge 10 ]; then
    pass "ONESHOT_MIN_LOOP_SECONDS default is at least 10s ($ONESHOT_MIN_LOOP_SECONDS)"
else
    fail "ONESHOT_MIN_LOOP_SECONDS default is at least 10s" "got: ${ONESHOT_MIN_LOOP_SECONDS:-unset}"
fi

# ---------------------------------------------------------------------------
echo ""
echo "cli_turn_command: prompt handoff + antigravity timeout"
# ---------------------------------------------------------------------------
HANDOFF_PROMPT="$TMP_ROOT/handoff-prompt.txt"
printf 'prompt body\n' > "$HANDOFF_PROMPT"
HANDOFF_BIN="$TMP_ROOT/bin/claude"

CLAUDE_TURN=$(cli_turn_command claude "$HANDOFF_BIN" "sonnet" "$HANDOFF_PROMPT" bypassPermissions)
if [[ "$CLAUDE_TURN" == *" < "* ]] \
    && [[ "$CLAUDE_TURN" != *"--prompt"* ]] \
    && [[ "$CLAUDE_TURN" != *"--print"* ]]; then
    pass "claude hands the prompt via stdin redirect"
else
    fail "claude hands the prompt via stdin redirect" "got: $CLAUDE_TURN"
fi

COPILOT_TURN=$(cli_turn_command copilot "$HANDOFF_BIN" "" "$HANDOFF_PROMPT" allow-all-tools)
if [[ "$COPILOT_TURN" == *'--prompt "$(cat '* ]] \
    && [[ "$COPILOT_TURN" != *" < "* ]] \
    && [[ "$COPILOT_TURN" != *"--print "* ]]; then
    pass "copilot hands the prompt via --prompt \"\$(cat …)\""
else
    fail "copilot hands the prompt via --prompt \"\$(cat …)\"" "got: $COPILOT_TURN"
fi

AGY_TURN=$(cli_turn_command antigravity "$HANDOFF_BIN" "" "$HANDOFF_PROMPT" dangerously-skip-permissions)
if [[ "$AGY_TURN" == *"--print-timeout ${HUNG_AGENT_SECONDS}s"* ]]; then
    pass "antigravity --print-timeout matches HUNG_AGENT_SECONDS ($HUNG_AGENT_SECONDS)"
else
    fail "antigravity --print-timeout matches HUNG_AGENT_SECONDS ($HUNG_AGENT_SECONDS)" "got: $AGY_TURN"
fi

if [[ "$AGY_TURN" == *'--print "$(cat '* ]] && [[ "$AGY_TURN" != *" < "* ]]; then
    pass "antigravity hands the prompt via --print \"\$(cat …)\""
else
    fail "antigravity hands the prompt via --print \"\$(cat …)\"" "got: $AGY_TURN"
fi

# Prove the unexpanded $(cat …) actually feeds the prompt text as an argv value
# once the pane shell expands it (copilot/antigravity path).
cat > "$TMP_ROOT/bin/argdump" <<'STUB'
#!/bin/bash
printf '%s\0' "$@" > "${ARGDUMP_OUT:?}"
STUB
chmod +x "$TMP_ROOT/bin/argdump"
ARGDUMP_OUT="$TMP_ROOT/argdump.out"
export ARGDUMP_OUT
rm -f "$ARGDUMP_OUT"
DUMP_TURN=$(cli_turn_command copilot "$TMP_ROOT/bin/argdump" "" "$HANDOFF_PROMPT" allow-all-tools)
bash -c "$DUMP_TURN"
DUMPED=$(tr '\0' '\n' < "$ARGDUMP_OUT")
if echo "$DUMPED" | grep -qx "prompt body"; then
    pass "copilot \$(cat …) expands to the prompt file contents as an argument"
else
    fail "copilot \$(cat …) expands to the prompt file contents as an argument" "argv dump: $DUMPED"
fi

# ---------------------------------------------------------------------------
echo ""
echo "validate_all_agents (pre-flight before tmux)"
# ---------------------------------------------------------------------------
# run-team exits 1 before creating a session when pre-flight fails. Success
# paths reach tmux attach — drive those with timeout and assert on output.
tmux kill-session -t "$SESSION" 2>/dev/null || true

run_validate() {
    # Only the stub claude is visible — system-installed copilot/agy would
    # make the "missing binary" case a false pass on developer machines.
    # Keep /usr/local/bin so `node` (generate-prompt) still resolves.
    (cd "$TMP_ROOT" && PATH="$TMP_ROOT/bin:/usr/local/bin:/usr/bin:/bin" bash "$SCRIPTS/run-team" "$WORKFLOW" 2>&1)
}

reset_agents() {
    rm -f "$WF/co-workers"/*.prompt.json "$WF/co-workers"/*.prompt.md
}

reset_agents
agent_config "broken" ',"cli":"not-a-cli"'
tmux kill-session -t "$SESSION" 2>/dev/null || true
VALIDATE_OUT=$(run_validate)
VALIDATE_RC=$?
if [ "$VALIDATE_RC" -ne 0 ] \
    && echo "$VALIDATE_OUT" | grep -q "Pre-flight check failed" \
    && echo "$VALIDATE_OUT" | grep -q "cli must be one of" \
    && ! tmux has-session -t "$SESSION" 2>/dev/null; then
    pass "unsupported cli aborts before tmux"
else
    fail "unsupported cli aborts before tmux" "rc=$VALIDATE_RC out=$(echo "$VALIDATE_OUT" | tail -5)"
fi

reset_agents
agent_config "orphan" ',"cli":"copilot"'
tmux kill-session -t "$SESSION" 2>/dev/null || true
# Hide a real copilot install so this asserts the missing-binary path, not attach.
ORPHAN_PATH="$PATH"
if command -v copilot >/dev/null 2>&1; then
    COPILOT_DIR=$(dirname "$(command -v copilot)")
    ORPHAN_PATH=$(printf '%s' "$PATH" | tr ':' '\n' | grep -vxF "$COPILOT_DIR" | paste -sd:)
fi
VALIDATE_OUT=$(cd "$TMP_ROOT" && PATH="$ORPHAN_PATH" bash "$SCRIPTS/run-team" "$WORKFLOW" 2>&1)
VALIDATE_RC=$?
if [ "$VALIDATE_RC" -ne 0 ] \
    && echo "$VALIDATE_OUT" | grep -q "binary was not found" \
    && ! tmux has-session -t "$SESSION" 2>/dev/null; then
    pass "missing CLI binary aborts before tmux"
else
    fail "missing CLI binary aborts before tmux" "rc=$VALIDATE_RC out=$(echo "$VALIDATE_OUT" | tail -5)"
fi

tmux kill-session -t "$SESSION" 2>/dev/null || true
reset_agents
agent_config "badperm" ',"permission_mode":"not-a-mode"'
VALIDATE_OUT=$(run_validate)
VALIDATE_RC=$?
if [ "$VALIDATE_RC" -ne 0 ] \
    && echo "$VALIDATE_OUT" | grep -q "unknown permission_mode" \
    && ! tmux has-session -t "$SESSION" 2>/dev/null; then
    pass "invalid permission_mode aborts before tmux"
else
    fail "invalid permission_mode aborts before tmux" "rc=$VALIDATE_RC out=$(echo "$VALIDATE_OUT" | tail -5)"
fi

# Copy-paste leftover: Devin model on a non-Devin CLI must fail pre-flight.
# Stub a copilot binary so the failure is the model check, not "binary missing".
cat > "$TMP_ROOT/bin/copilot" <<'STUB'
#!/bin/bash
echo "[stub copilot] launched"
sleep 300
STUB
chmod +x "$TMP_ROOT/bin/copilot"
tmux kill-session -t "$SESSION" 2>/dev/null || true
reset_agents
agent_config "mismatch" ',"cli":"copilot","model":"SWE-1.7 Max","permission_mode":"allow-all-tools"'
VALIDATE_OUT=$(run_validate)
VALIDATE_RC=$?
if [ "$VALIDATE_RC" -ne 0 ] \
    && echo "$VALIDATE_OUT" | grep -q "belongs to cli=devin" \
    && ! tmux has-session -t "$SESSION" 2>/dev/null; then
    pass "cross-CLI model leftover aborts before tmux"
else
    fail "cross-CLI model leftover aborts before tmux" "rc=$VALIDATE_RC out=$(echo "$VALIDATE_OUT" | tail -8)"
fi
rm -f "$TMP_ROOT/bin/copilot"

# A disabled agent with a broken cli must not fail pre-flight; a valid peer starts.
reset_agents
agent_config "ok"
agent_config "skip-me" ',"enabled":false,"cli":"not-a-cli"'
tmux kill-session -t "$SESSION" 2>/dev/null || true
VALIDATE_OUT=$(cd "$TMP_ROOT" && PATH="$TMP_ROOT/bin:/usr/local/bin:/usr/bin:/bin" timeout 8 bash "$SCRIPTS/run-team" "$WORKFLOW" 2>&1) || true
if echo "$VALIDATE_OUT" | grep -q "Starting workflow: $WORKFLOW" \
    && ! echo "$VALIDATE_OUT" | grep -q "Pre-flight check failed" \
    && tmux has-session -t "$SESSION" 2>/dev/null; then
    pass "disabled broken agent is skipped; valid peer starts"
else
    fail "disabled broken agent is skipped; valid peer starts" \
        "$(echo "$VALIDATE_OUT" | grep -E 'Pre-flight|Starting|Error|not found' | head -8)"
fi
tmux kill-session -t "$SESSION" 2>/dev/null || true

# ---------------------------------------------------------------------------
# control-center without a terminal
#
# `read -t 0` is a poll, and bash reports EOF as "input available". So on a pipe
# or /dev/null the poll in drain_stdin succeeded forever while the consuming
# read returned nothing, and the function never came back — a hard hang, at 100%
# CPU. The redraw loop had the same root cause: `read -t 5` returns instantly at
# EOF, so a non-interactive run span ~200k times in 3 seconds.
#
# Neither was reachable from a terminal, which is why both survived every
# interactive test anyone ran. An agent or a cron invoking this script is the
# case that finds them, so the checks below run it exactly that way.
# ---------------------------------------------------------------------------

echo ""
echo "control-center (non-interactive)"

CC="$SCRIPT_DIR/control-center"

CC_OUT=$(timeout 5 bash "$CC" </dev/null 2>&1)
CC_RC=$?
if [ "$CC_RC" -ne 124 ] && [ "$CC_RC" -ne 0 ] && echo "$CC_OUT" | grep -q "needs an interactive terminal"; then
    pass "control-center exits instead of spinning when stdin is not a tty"
else
    fail "control-center exits instead of spinning when stdin is not a tty" \
        "rc=$CC_RC (124 = hung) out=$(echo "$CC_OUT" | head -3)"
fi

# drain_stdin on its own, in every shape that used to hang it.
sed -n '/^drain_stdin()/,/^}/p' "$CC" > "$TMP_ROOT/drain.sh"
DRAIN_FAILURES=""
timeout 3 bash -c "source '$TMP_ROOT/drain.sh'; drain_stdin" </dev/null || DRAIN_FAILURES="$DRAIN_FAILURES /dev/null"
: | timeout 3 bash -c "source '$TMP_ROOT/drain.sh'; drain_stdin" || DRAIN_FAILURES="$DRAIN_FAILURES empty-pipe"
printf 'junk\n' | timeout 3 bash -c "source '$TMP_ROOT/drain.sh'; drain_stdin" || DRAIN_FAILURES="$DRAIN_FAILURES pipe-with-data"
if [ -z "$DRAIN_FAILURES" ]; then
    pass "drain_stdin returns at EOF instead of looping forever"
else
    fail "drain_stdin returns at EOF instead of looping forever" "hung or errored on:$DRAIN_FAILURES"
fi

# ---------------------------------------------------------------------------
# Stopping a team has to take its pollers with it.
#
# Agents start await-messages.js as a background task of their own harness, so
# the poller is not a child of its pane and survives `tmux kill-session`. It
# then keeps rewriting health/heartbeats/<agent>.json with a live pid, and every
# pid-based reader reports the stopped team as up.
# ---------------------------------------------------------------------------

echo ""
echo "stop_team: pollers"

# shellcheck disable=SC1091
source "$SCRIPTS/lib/team-session.sh"

# Real pollers, one per team: the second is the negative control that must
# survive stopping the first.
for team in "$WORKFLOW" "${WORKFLOW}-other"; do
    mkdir -p "$TMP_ROOT/.agents/workflows/$team"/{slack/ghost,health/heartbeats}
    (cd "$TMP_ROOT" && node "$SCRIPTS/await-messages.js" "$team" ghost >/dev/null 2>&1) &
done
sleep 1

tmux kill-session -t "$SESSION" 2>/dev/null
tmux new-session -d -s "$SESSION" -n agents
stop_team "$WORKFLOW"

if pgrep -f "await-messages\.js +${WORKFLOW}( |$)" >/dev/null 2>&1; then
    fail "stop_team reaps the workflow's pollers" "a poller for $WORKFLOW is still running"
else
    pass "stop_team reaps the workflow's pollers"
fi

if pgrep -f "await-messages\.js +${WORKFLOW}-other( |$)" >/dev/null 2>&1; then
    pass "another team's pollers are left alone"
else
    fail "another team's pollers are left alone" "the ${WORKFLOW}-other poller was killed too"
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
    fail "stop_team kills the session" "session $SESSION is still up"
else
    pass "stop_team kills the session"
fi

pkill -f "await-messages\.js +${WORKFLOW}-other( |$)" 2>/dev/null

# ---------------------------------------------------------------------------
echo ""
echo "--ensure starts detached (no attach)"
# ---------------------------------------------------------------------------
tmux kill-session -t "$SESSION" 2>/dev/null || true
reset_agents
agent_config "alpha"
ENSURE_OUT=$(cd "$TMP_ROOT" && PATH="$TMP_ROOT/bin:/usr/local/bin:/usr/bin:/bin" \
    timeout 15 bash "$SCRIPTS/run-team" --ensure "$WORKFLOW" 2>&1)
ENSURE_RC=$?
if [ "$ENSURE_RC" -eq 0 ] \
    && echo "$ENSURE_OUT" | grep -q "Started detached" \
    && tmux has-session -t "$SESSION" 2>/dev/null; then
    pass "--ensure starts the session without attaching"
else
    fail "--ensure starts the session without attaching" "rc=$ENSURE_RC out=$(echo "$ENSURE_OUT" | tail -8)"
fi
# Idempotent when already running
ENSURE_AGAIN=$(cd "$TMP_ROOT" && PATH="$TMP_ROOT/bin:/usr/local/bin:/usr/bin:/bin" \
    bash "$SCRIPTS/run-team" --ensure "$WORKFLOW" 2>&1)
ENSURE_AGAIN_RC=$?
if [ "$ENSURE_AGAIN_RC" -eq 0 ] && [ -z "$(echo "$ENSURE_AGAIN" | tr -d '[:space:]')" ]; then
    pass "--ensure is silent when the session already exists"
else
    # Empty stdout is ideal; a short "already running" message is also fine as long as rc=0
    if [ "$ENSURE_AGAIN_RC" -eq 0 ]; then
        pass "--ensure is silent when the session already exists"
    else
        fail "--ensure is silent when the session already exists" "rc=$ENSURE_AGAIN_RC out=$ENSURE_AGAIN"
    fi
fi
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo ""
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
