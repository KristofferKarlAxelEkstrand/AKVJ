#!/bin/bash
# Shared CLI helpers for control-center and run-team.
# Source from a sibling of this file's parent: SCRIPT_DIR/lib/cli-tools.sh
#
# Expects CLI_TOOLS_SCRIPT_DIR to be set to .../workflows/scripts (or derives it).

if [ -z "${CLI_TOOLS_SCRIPT_DIR:-}" ]; then
	CLI_TOOLS_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

CLI_MODELS_CATALOG="${CLI_MODELS_CATALOG:-$CLI_TOOLS_SCRIPT_DIR/cli-models.json}"

# Every CLI this repo knows how to detect, authenticate, and fetch models for.
#
# Wider than run-team's SUPPORTED_CLIS, which is the narrower "can host an
# unattended agent" set — knowing where a binary lives is not the same as
# knowing how to launch it with permissions pre-granted.
CLI_TOOLS_KNOWN=(claude devin copilot cursor antigravity)

# Product name → binary path. Cursor installs as cursor-agent; Antigravity as agy.
#
# The only copy. control-center and run-team each grew their own identical case
# statement, so adding a CLI meant editing three places and silently half-adding
# it if you missed one.
cli_tools_bin() {
	case "$1" in
		claude)      command -v claude 2>/dev/null ;;
		copilot)     command -v copilot 2>/dev/null ;;
		cursor)      command -v cursor-agent 2>/dev/null ;;
		antigravity) command -v agy 2>/dev/null ;;
		devin)       find ~/.devin-server/bin -name "devin" -type f 2>/dev/null | head -1 ;;
	esac
}

cli_tools_auth_command() {
	case "$1" in
		devin)       echo "devin auth login" ;;
		claude)      echo "claude auth login" ;;
		copilot)     echo "copilot login" ;;
		cursor)      echo "cursor-agent login" ;;
		antigravity) echo "agy" ;;
	esac
}

# ---------------------------------------------------------------------------
# How each CLI is installed.
#
# Also the only copy: run-team carried these as one-line error hints and
# control-center carried them again inside five hand-written installer blocks,
# so a changed install command went stale in whichever one you forgot.
# ---------------------------------------------------------------------------

# The command that installs it on Linux/macOS. Empty means there is nothing to
# run — see the note.
cli_tools_install_command() {
	case "$1" in
		claude)      echo "npm install -g @anthropic-ai/claude-code" ;;
		copilot)     echo "npm install -g @github/copilot" ;;
		cursor)      echo "curl https://cursor.com/install -fsS | bash" ;;
		antigravity) echo "curl -fsSL https://antigravity.google/cli/install.sh | bash" ;;
		devin)       echo "" ;;
	esac
}

# PowerShell equivalent, where it differs. Empty means the command above works
# on Windows too — npm does, the curl installers do not.
cli_tools_install_windows() {
	case "$1" in
		cursor)      echo "irm 'https://cursor.com/install?win32=true' | iex" ;;
		antigravity) echo "irm https://antigravity.google/cli/install.ps1 | iex" ;;
	esac
}

# What a command cannot say.
cli_tools_install_note() {
	case "$1" in
		devin)       echo "install it from https://app.devin.ai/settings/devin-cli" ;;
		copilot)     echo "needs Node 22+ and a GitHub Copilot subscription" ;;
	esac
}

# One line for an error message: what to run, or what to do when there is
# nothing to run.
cli_tools_install_hint() {
	local command
	command=$(cli_tools_install_command "$1")
	if [ -n "$command" ]; then
		printf '%s\n' "$command"
		return 0
	fi
	cli_tools_install_note "$1"
}

# One short status line for dashboards. Exit 0 = looks authenticated,
# 1 = not authenticated / unknown, 2 = not installed.
# Always disconnects child stdin so interactive CLIs cannot steal keypresses
# from control-center's read loop.
cli_tools_auth_status() {
	local cli="$1" bin
	bin=$(cli_tools_bin "$cli")
	if [ -z "$bin" ]; then
		echo "not installed"
		return 2
	fi

	case "$cli" in
		devin)
			local out
			out=$(timeout 3 "$bin" auth status </dev/null 2>&1) || true
			if printf '%s\n' "$out" | grep -qi 'logged in'; then
				echo "logged in"
				return 0
			fi
			echo "not logged in — command: $(cli_tools_auth_command "$cli")"
			return 1
			;;
		claude)
			local out logged
			out=$(timeout 3 "$bin" auth status </dev/null 2>&1) || true
			logged=$(printf '%s\n' "$out" | jq -r '.loggedIn // empty' 2>/dev/null)
			if [ "$logged" = "true" ] || printf '%s\n' "$out" | grep -qi '"loggedIn":[[:space:]]*true'; then
				echo "logged in"
				return 0
			fi
			echo "not logged in — command: $(cli_tools_auth_command "$cli")"
			return 1
			;;
		copilot)
			# Env tokens (headless) or OAuth login via `copilot login`
			# (stores lastLoggedInUser / copilotTokens in ~/.copilot/config.json).
			if [ -n "${COPILOT_GITHUB_TOKEN:-}${GH_TOKEN:-}${GITHUB_TOKEN:-}" ]; then
				echo "logged in (env token)"
				return 0
			fi
			local cfg="${HOME}/.copilot/config.json"
			if [ -f "$cfg" ]; then
				local login
				login=$(sed '/^[[:space:]]*\/\//d' "$cfg" 2>/dev/null \
					| jq -r '.lastLoggedInUser.login // empty' 2>/dev/null) || true
				if [ -n "$login" ]; then
					echo "logged in"
					return 0
				fi
				if sed '/^[[:space:]]*\/\//d' "$cfg" 2>/dev/null \
					| jq -e '((.copilotTokens // {}) | length) > 0' >/dev/null 2>&1; then
					echo "logged in"
					return 0
				fi
			fi
			echo "not logged in — command: $(cli_tools_auth_command "$cli")"
			return 1
			;;
		cursor)
			local out
			out=$(timeout 3 "$bin" status </dev/null 2>&1) || true
			if printf '%s\n' "$out" | grep -qi 'not logged'; then
				echo "not logged in — command: $(cli_tools_auth_command "$cli")"
				return 1
			fi
			if printf '%s\n' "$out" | grep -qiE 'logged in|email|@'; then
				echo "logged in"
				return 0
			fi
			echo "auth unknown — command: $(cli_tools_auth_command "$cli")"
			return 1
			;;
		antigravity)
			# No auth subcommand — login is interactive `agy` (writes oauth token).
			# Treat a present token or a non-empty models list as authenticated.
			if [ -s "${HOME}/.gemini/antigravity-cli/antigravity-oauth-token" ]; then
				echo "logged in"
				return 0
			fi
			local out
			out=$(timeout 3 "$bin" models </dev/null 2>&1) || true
			if printf '%s\n' "$out" | grep -qiE '^Error:|sign in|authenticat'; then
				echo "not logged in — command: $(cli_tools_auth_command "$cli")"
				return 1
			fi
			if [ -n "$(printf '%s' "$out" | tr -d '[:space:]')" ]; then
				echo "logged in"
				return 0
			fi
			echo "not logged in — command: $(cli_tools_auth_command "$cli")"
			return 1
			;;
		*)
			echo "unknown cli"
			return 1
			;;
	esac
}

# Print accepted model names for one CLI, one per line. Empty = nothing fetched.
# Auth/list failures print a hint on stderr and return non-zero.
# Skips live calls when auth is known-bad so refresh does not hang on timeouts.
cli_tools_fetch_models() {
	local cli="$1" bin
	bin=$(cli_tools_bin "$cli")
	if [ -z "$bin" ]; then
		echo "not installed" >&2
		return 2
	fi

	case "$cli" in
		claude|copilot)
			echo "no list API — keep seed catalog or omit model" >&2
			return 1
			;;
		antigravity)
			# No auth probe; a short timeout avoids a blank hang when models is empty.
			local out
			out=$(timeout 3 "$bin" models </dev/null 2>&1) || true
			if printf '%s\n' "$out" | grep -qiE '^Error:|sign in|authenticat'; then
				echo "not authenticated — command: agy (no args)" >&2
				return 1
			fi
			if [ -z "$(printf '%s' "$out" | tr -d '[:space:]')" ]; then
				echo "empty model list — command: agy (no args)" >&2
				return 1
			fi
			printf '%s\n' "$out" | awk 'NF' | sort -u
			;;
		devin|cursor)
			if ! cli_tools_auth_status "$cli" >/dev/null 2>&1; then
				echo "not authenticated — command: $(cli_tools_auth_command "$cli")" >&2
				return 1
			fi
			;;&
		devin)
			local json
			json=$(timeout 30 "$bin" models list --format json </dev/null 2>/dev/null) || {
				echo "fetch failed — command: $(cli_tools_auth_command "$cli")" >&2
				return 1
			}
			printf '%s\n' "$json" | jq -r '
				.families[]?
				| (
					.slug?, .family_uid?, .family_label?,
					(.aliases[]?),
					(.variants[]? | .model_uid?, .label?)
				)
			' 2>/dev/null | awk 'NF' | sort -u
			;;
		cursor)
			local out
			out=$(timeout 8 "$bin" models </dev/null 2>&1) || true
			if printf '%s\n' "$out" | grep -qi 'authentication required\|not logged\|auth'; then
				echo "not authenticated — command: $(cli_tools_auth_command "$cli")" >&2
				return 1
			fi
			if printf '%s\n' "$out" | jq -e . >/dev/null 2>&1; then
				printf '%s\n' "$out" | jq -r '
					if type == "array" then .[]
					elif .models then .models[]
					else empty end
					| if type == "object" then (.id // .name // .model // empty) else . end
				' 2>/dev/null | awk 'NF' | sort -u
			else
				printf '%s\n' "$out" | grep -vE '^(Error|Usage|Options|Authentication)' \
					| awk 'NF && !/^[[:space:]]*-/' | sed 's/^[[:space:]]*//' | sort -u
			fi
			;;
		*)
			echo "unsupported cli: $cli" >&2
			return 1
			;;
	esac
}

# Merge fetched (or preserved) models into CLI_MODELS_CATALOG.
# Prints a per-CLI summary line to stdout.
cli_tools_refresh_catalog() {
	local catalog="$CLI_MODELS_CATALOG"
	local tmp
	tmp=$(mktemp)

	if [ ! -f "$catalog" ]; then
		printf '%s\n' '{"updated_at":null,"clis":{}}' >"$catalog"
	fi

	cp "$catalog" "$tmp"

	local cli models_file fetched_at source note count err
	for cli in "${CLI_TOOLS_KNOWN[@]}"; do
		echo -n "  $cli... "
		models_file=$(mktemp)
		err=$(mktemp)
		if cli_tools_fetch_models "$cli" >"$models_file" 2>"$err"; then
			count=$(grep -c . "$models_file" 2>/dev/null || echo 0)
			fetched_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
			source="live"
			note=$(head -1 "$err" 2>/dev/null || true)
			# Always replace note on success — do not keep a prior error after a good refresh.
			jq --arg cli "$cli" --arg fetched "$fetched_at" --arg source "$source" --arg note "$note" \
				--rawfile models "$models_file" '
				(.clis[$cli] //= {models:[]})
				| .clis[$cli].models = ($models | split("\n") | map(select(length > 0)))
				| .clis[$cli].fetched_at = $fetched
				| .clis[$cli].source = $source
				| .clis[$cli].note = $note
				| .updated_at = $fetched
			' "$tmp" >"${tmp}.next" && mv "${tmp}.next" "$tmp"
			echo "$count models (live)"
		else
			note=$(tr '\n' ' ' <"$err" | sed 's/[[:space:]]*$//')
			# Auth failures must not preserve a prior bad "live" parse (e.g. an
			# Error: line stored as a model name). Seed catalogs (claude/copilot
			# "no list API") are preserved.
			if [[ "$note" == not\ authenticated* ]] || [[ "$note" == empty\ model* ]] || [[ "$note" == not\ installed* ]]; then
				jq --arg cli "$cli" --arg note "$note" --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '
					(.clis[$cli] //= {})
					| .clis[$cli].models = []
					| .clis[$cli].fetched_at = null
					| .clis[$cli].source = "empty"
					| .clis[$cli].note = $note
					| .updated_at = $updated
				' "$tmp" >"${tmp}.next" && mv "${tmp}.next" "$tmp"
				echo "cleared — ${note:-fetch failed}"
			else
				jq --arg cli "$cli" --arg note "$note" --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '
					(.clis[$cli] //= {models: [], source: "empty", fetched_at: null, note: ""})
					| .clis[$cli].note = (if $note == "" then .clis[$cli].note else $note end)
					| .updated_at = $updated
				' "$tmp" >"${tmp}.next" && mv "${tmp}.next" "$tmp"
				count=$(jq -r --arg cli "$cli" '(.clis[$cli].models // []) | length' "$tmp")
				echo "kept $count — ${note:-fetch failed}"
			fi
		fi
		rm -f "$models_file" "$err"
	done

	mv "$tmp" "$catalog"
	echo "Wrote $catalog"
}

# Validate that $model is acceptable for $cli given the catalog.
# Prints nothing on success. On failure prints one error line to stdout and returns 1.
# Warnings (unverifiable) print to stdout prefixed with "warning:" and return 0.
cli_tools_validate_model() {
	local cli="$1" model="$2"
	local catalog="$CLI_MODELS_CATALOG"

	[ -z "$model" ] && return 0

	if [ ! -f "$catalog" ]; then
		echo "model '$model' set but $catalog is missing — refresh from control-center (m)"
		return 1
	fi

	if ! jq -e . "$catalog" >/dev/null 2>&1; then
		echo "model catalog is not valid JSON: $catalog"
		return 1
	fi

	local in_this in_other other
	in_this=$(jq -r --arg cli "$cli" --arg m "$model" \
		'(.clis[$cli].models // []) | index($m) | if . == null then "no" else "yes" end' "$catalog")

	if [ "$in_this" = "yes" ]; then
		return 0
	fi

	for other in $(jq -r '.clis | keys[]' "$catalog"); do
		[ "$other" = "$cli" ] && continue
		in_other=$(jq -r --arg other_cli "$other" --arg m "$model" \
			'(.clis[$other_cli].models // []) | index($m) | if . == null then "no" else "yes" end' "$catalog")
		if [ "$in_other" = "yes" ]; then
			echo "model '$model' belongs to cli=$other, not cli=$cli — omit model or change cli (copy-paste leftover?)"
			return 1
		fi
	done

	local this_count this_source
	this_count=$(jq -r --arg cli "$cli" '(.clis[$cli].models // []) | length' "$catalog")
	this_source=$(jq -r --arg cli "$cli" '.clis[$cli].source // "empty"' "$catalog")

	if [ "$this_count" -gt 0 ] && [ "$this_source" = "live" ]; then
		echo "unknown model '$model' for cli=$cli — pick from catalog or omit model (refresh: control-center m)"
		return 1
	fi

	echo "warning: cannot verify model '$model' for cli=$cli (catalog source=$this_source) — refresh from control-center (m)"
	return 0
}
