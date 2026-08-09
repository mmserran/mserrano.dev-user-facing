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
if [ "${1:-}" = "--dry-run" ]; then
	dry_run=true
fi

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

# Title: name the PRs directly when there are few enough to stay readable,
# otherwise name the first and count the rest.
if [ "$pr_count" -le 3 ]; then
	titles=()
	for num in "${pr_list[@]}"; do
		titles+=("${pr_titles[$num]}")
	done
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

if [ "$dry_run" = true ]; then
	echo "--- title ---"
	echo "$title"
	echo "--- body ---"
	echo "$body"
	exit 0
fi

existing_pr="$(gh pr list --head "$HEAD_BRANCH" --base "$BASE_BRANCH" --state open --json number --jq '.[0].number // empty')"

if [ -n "$existing_pr" ]; then
	gh pr edit "$existing_pr" --title "$title" --body "$body"
	url="$(gh pr view "$existing_pr" --json url --jq .url)"
	echo "Updated PR #$existing_pr: $title"
	echo "$url"
else
	gh pr create --base "$BASE_BRANCH" --head "$HEAD_BRANCH" --title "$title" --body "$body"
fi
