#!/bin/bash
# Team session lifecycle, shared by control-center and run-team.
# Source from a sibling of this file's parent: SCRIPT_DIR/lib/team-session.sh

session_name() { echo "${1}-agents"; }

is_running() { tmux has-session -t "$(session_name "$1")" 2>/dev/null; }

# Kill this workflow's message pollers.
#
# Agents start await-messages.js as a background task through their own
# harness, so a poller is not a child of its pane and `tmux kill-session`
# leaves it running. An orphan poller keeps rewriting
# health/heartbeats/<agent>.json with a live pid, which is how a stopped team
# went on reporting itself as up.
#
# Matched on the workflow argument, so stopping one team never touches another.
reap_pollers() {
	local workflow="$1" pattern pids
	pattern="await-messages\.js +${workflow}( |\$)"

	pids=$(pgrep -f "$pattern" 2>/dev/null) || return 0
	[ -z "$pids" ] && return 0

	# shellcheck disable=SC2086
	kill $pids 2>/dev/null
	sleep 1

	pids=$(pgrep -f "$pattern" 2>/dev/null) || return 0
	# shellcheck disable=SC2086
	[ -n "$pids" ] && kill -9 $pids 2>/dev/null
	return 0
}

# Stop a team: the session first, then the pollers it leaves behind.
stop_team() {
	tmux kill-session -t "$(session_name "$1")" 2>/dev/null
	reap_pollers "$1"
}
