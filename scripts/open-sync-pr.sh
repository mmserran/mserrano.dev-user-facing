#!/usr/bin/env bash
#
# Opens (or refreshes) the development->main sync PR, with a body generated
# from the PRs that have landed on development since main's last sync.
#
# development advances via real PR merge commits (first-parent history).
# main advances only via squash-merge (see AGENTS.md), so those development
# merge SHAs are never ancestors of main. After each squash,
# sync-main-to-development.yml merges main back into development; from that
# merge forward, origin/main is an ancestor of every first-parent commit.
# Pre-sync development merges do not have origin/main as an ancestor, so
# walking development's first-parent while that relation holds is the correct
# "since last sync" boundary. `origin/main..origin/development` is not safe:
# exclusivity is commit-SHA reachability and re-lists already-synced PRs.
set -euo pipefail

dry_run=false
title_override=""
while [ $# -gt 0 ]; do
	case "$1" in
	--dry-run)
		dry_run=true
		shift
		;;
	--title)
		title_override="${2:?--title requires a value}"
		shift 2
		;;
	*)
		echo "Unknown argument: $1" >&2
		exit 2
		;;
	esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_BRANCH="main"
HEAD_BRANCH="development"

echo "Fetching origin/$BASE_BRANCH and origin/$HEAD_BRANCH..."
git fetch origin "$BASE_BRANCH" "$HEAD_BRANCH" --quiet

if git diff --quiet "origin/$BASE_BRANCH" "origin/$HEAD_BRANCH"; then
	echo "origin/$BASE_BRANCH and origin/$HEAD_BRANCH have identical trees; nothing to sync."
	exit 0
fi

# First-parent subjects from origin/development back through the last
# main→development merge (while origin/main remains an ancestor). Falls back
# to main..development when main is not yet an ancestor of development tip
# (no merge-back in history yet).
mapfile -t merge_subjects < <(
	if git merge-base --is-ancestor "origin/$BASE_BRANCH" "origin/$HEAD_BRANCH"; then
		while IFS= read -r hash; do
			if ! git merge-base --is-ancestor "origin/$BASE_BRANCH" "$hash"; then
				break
			fi
			git log -1 --format='%s' "$hash"
		done < <(git rev-list --first-parent "origin/$HEAD_BRANCH")
	else
		git log "origin/$BASE_BRANCH..origin/$HEAD_BRANCH" --first-parent --format='%s'
	fi
)

pr_numbers=()
for subject in "${merge_subjects[@]}"; do
	if [[ "$subject" =~ ^Merge\ pull\ request\ \#([0-9]+)\  ]]; then
		pr_numbers+=("${BASH_REMATCH[1]}")
	fi
done

if [ "${#pr_numbers[@]}" -eq 0 ]; then
	echo "No PR merges found on origin/$HEAD_BRANCH since the last origin/$BASE_BRANCH sync (only non-PR commits)." >&2
	echo "Refusing to open a PR with an empty summary; inspect first-parent history manually:" >&2
	echo "  git log origin/$HEAD_BRANCH --first-parent" >&2
	exit 1
fi

# git log lists newest first; reverse so the PR list reads oldest -> newest,
# matching merge order.
pr_list=()
for ((i = ${#pr_numbers[@]} - 1; i >= 0; i--)); do
	pr_list+=("${pr_numbers[$i]}")
done

declare -A pr_titles
for num in "${pr_list[@]}"; do
	pr_titles["$num"]="$(gh pr view "$num" --json title --jq .title)"
done

pr_count="${#pr_list[@]}"

body_items=()
for num in "${pr_list[@]}"; do
	body_items+=("- ${pr_titles[$num]} (#${num})")
done

content_main="$(git show "origin/$BASE_BRANCH:CONTENT_VERSION" 2>/dev/null || true)"
content_dev="$(git show "origin/$HEAD_BRANCH:CONTENT_VERSION" 2>/dev/null || true)"

content_note=""
if [ "$content_main" != "$content_dev" ]; then
	content_note=$'\n\n**Note:** `CONTENT_VERSION` differs between branches — main pins `'"$content_main"'`, development pins `'"$content_dev"'`. Confirm this is intentional before merging (see `make promote-content`).'
fi

plural=""
if [ "$pr_count" -ne 1 ]; then
	plural="s"
fi

body="## Summary
Syncs \`main\` with everything currently on \`development\` (${pr_count} PR${plural} merged since the last sync):

$(printf '%s\n' "${body_items[@]}")${content_note}

## Test plan
- [ ] CI checks pass
- [ ] Squash-merge into \`main\` (per AGENTS.md); \`sync-main-to-development.yml\` will then merge main back into development automatically"

# Mechanical fallback: name the PRs directly when there are few enough to
# stay readable, otherwise name the first and count the rest. Used when no
# --title is given and the LLM title attempt below is unavailable or fails.
fallback_title() {
	local title
	if [ "$pr_count" -le 3 ]; then
		local titles=()
		for num in "${pr_list[@]}"; do
			titles+=("${pr_titles[$num]}")
		done
		local joined
		joined="$(
			IFS=', '
			echo "${titles[*]}"
		)"
		title="Sync main: ${joined}"
	else
		title="Sync main: ${pr_titles[${pr_list[0]}]} and $((pr_count - 1)) more"
	fi
	if [ "${#title}" -gt 72 ]; then
		title="Sync main: ${pr_count} PRs from development"
	fi
	printf '%s' "$title"
}

# Asks a local Claude Code session to name the concrete themes across the PR
# list (e.g. "SEO, analytics, portfolio improvements") instead of just
# concatenating PR titles. Only the title goes through the LLM; the PR body
# above is the exact, mechanical PR list, so nothing substantive depends on
# the model getting it right. Prints nothing and returns non-zero if the
# `claude` CLI is missing, the call fails or times out, or the output looks
# unusable — callers must fall back to fallback_title in that case.
llm_title() {
	command -v claude >/dev/null 2>&1 || return 1

	local prompt="You write concise, descriptive git PR titles for a 'sync development into main' PR. Given the list of PR titles below (already merged into development), write ONE line, <=72 characters, starting with 'Sync main: ', naming the concrete themes (not just listing PR titles verbatim, not generic like 'various updates'). Output only the title, nothing else.

$(printf '%s\n' "${body_items[@]}")"

	local result
	result="$(timeout -k 5 45 claude -p --model haiku --output-format text "$prompt" </dev/null 2>/dev/null)" || return 1

	# Collapse to a single line, then trim surrounding whitespace and, in case
	# the model wraps its answer, one layer of straight quotes.
	result="$(printf '%s' "$result" | tr '\n' ' ')"
	result="${result#"${result%%[![:space:]]*}"}"
	result="${result%"${result##*[![:space:]]}"}"
	result="${result%\"}"
	result="${result#\"}"
	result="${result%\'}"
	result="${result#\'}"

	if [ -z "$result" ] || [ "${#result}" -gt 100 ]; then
		return 1
	fi
	printf '%s' "$result"
}

if [ -n "$title_override" ]; then
	title="$title_override"
elif generated="$(llm_title)"; then
	title="$generated"
else
	title="$(fallback_title)"
fi

if [ "$dry_run" = true ]; then
	echo "--- title ---"
	echo "$title"
	echo "--- body ---"
	echo "$body"
	exit 0
fi

existing_pr="$(gh pr list --head "$HEAD_BRANCH" --base "$BASE_BRANCH" --state open --json number --jq '.[0].number // empty')"

# `gh pr edit`/`gh pr create` perform the mutation fine on old gh CLI
# versions (e.g. 2.4.0, still in local use here), but then crash trying to
# print a human-readable confirmation via a GraphQL query that includes the
# now-dead `projectCards` field, which GitHub's API hard-rejects post
# Projects-classic sunset. `gh pr view/list --json <fields>` are unaffected
# (they request only the fields asked for), so use the REST API directly for
# the mutation itself, sidestepping that broken query entirely.
repo_slug="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

if [ -n "$existing_pr" ]; then
	url="$(gh api "repos/$repo_slug/pulls/$existing_pr" -X PATCH -f title="$title" -f body="$body" --jq .html_url)"
	echo "Updated PR #$existing_pr: $title"
	echo "$url"
else
	url="$(gh api "repos/$repo_slug/pulls" -X POST -f title="$title" -f body="$body" -f head="$HEAD_BRANCH" -f base="$BASE_BRANCH" --jq .html_url)"
	echo "Opened PR: $title"
	echo "$url"
fi
