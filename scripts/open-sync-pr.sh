#!/usr/bin/env bash
#
# Opens (or refreshes) the development->main sync PR, with a body generated
# from the PRs that have landed on development since main's last sync.
#
# development only ever advances via PR merges (feature branches merge into
# it with a real merge commit, not a squash), so its first-parent history
# since main's tip is exactly its "Merge pull request #N ..." commits. main
# itself is squash-merge-only (see AGENTS.md), and sync-main-to-development.yml
# merges main back into development after every squash so the shared
# ancestor resets and this range never re-lists already-synced PRs.
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

ahead_count="$(git rev-list "origin/$BASE_BRANCH..origin/$HEAD_BRANCH" --count)"
if [ "$ahead_count" -eq 0 ]; then
	echo "origin/$BASE_BRANCH already contains origin/$HEAD_BRANCH; nothing to sync."
	exit 0
fi

mapfile -t merge_subjects < <(git log "origin/$BASE_BRANCH..origin/$HEAD_BRANCH" --first-parent --format='%s')

pr_numbers=()
for subject in "${merge_subjects[@]}"; do
	if [[ "$subject" =~ ^Merge\ pull\ request\ \#([0-9]+)\  ]]; then
		pr_numbers+=("${BASH_REMATCH[1]}")
	fi
done

if [ "${#pr_numbers[@]}" -eq 0 ]; then
	echo "No PR merges found between origin/$BASE_BRANCH and origin/$HEAD_BRANCH (only non-PR commits)." >&2
	echo "Refusing to open a PR with an empty summary; inspect the range manually:" >&2
	echo "  git log origin/$BASE_BRANCH..origin/$HEAD_BRANCH --first-parent" >&2
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
