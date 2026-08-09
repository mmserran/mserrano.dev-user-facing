.PHONY: restore-media promote-content sync

SHELL := /usr/bin/env bash

REPO := mmserran/mserrano.dev-web-services
TAG ?= content-latest

# The backend tags real, dated exports content-YYYYMMDD-HHMM and separately
# republishes the content-latest alias to match the newest one. Resolve by
# scanning recent releases for dated tags, then verify the winner's embedded
# UTC day/time is within a small window of content-latest's publishedAt.
# Exact minute equality is wrong: the alias is republished after the dated
# tag is cut, so publishedAt is often 1+ minutes later than the tag name.
# Enlarging -L alone cannot guarantee the true newest tag when non-content
# releases dominate the list; a stale match (different UTC day, or more
# than MAX_SKEW_MINUTES away) fails loud instead of pinning the wrong
# export. ISO publishedAt is parsed with bash substrings so the check is
# portable (no GNU date -d).
define RESOLVE_LATEST_TAG
bash -ec '\
	max_skew_minutes=15; \
	resolved=$$(gh release list --repo "$(REPO)" -L 20 \
		| grep -oE "content-[0-9]{8}-[0-9]{4}" | sort -r | head -1); \
	if [ -z "$$resolved" ]; then \
		echo "No versioned content release found in $(REPO) (scanned last 20 releases)" >&2; \
		exit 1; \
	fi; \
	published_at=$$(gh release view content-latest --repo "$(REPO)" --json publishedAt --jq .publishedAt); \
	if [ -z "$$published_at" ]; then \
		echo "Could not read publishedAt for content-latest in $(REPO)" >&2; \
		exit 1; \
	fi; \
	if [[ ! "$$published_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2} ]]; then \
		echo "Unexpected publishedAt format for content-latest: $$published_at" >&2; \
		exit 1; \
	fi; \
	latest_day="$${published_at:0:4}$${published_at:5:2}$${published_at:8:2}"; \
	latest_mins=$$((10#$${published_at:11:2} * 60 + 10#$${published_at:14:2})); \
	if [[ ! "$$resolved" =~ ^content-([0-9]{8})-([0-9]{4})$$ ]]; then \
		echo "Unexpected resolved tag format: $$resolved" >&2; \
		exit 1; \
	fi; \
	tag_day="$${BASH_REMATCH[1]}"; \
	tag_hm="$${BASH_REMATCH[2]}"; \
	tag_mins=$$((10#$${tag_hm:0:2} * 60 + 10#$${tag_hm:2:2})); \
	if [ "$$tag_day" != "$$latest_day" ]; then \
		echo "Resolved $$resolved (UTC day $$tag_day) does not match content-latest publishedAt $$published_at (UTC day $$latest_day)." >&2; \
		echo "The top-20 release window likely missed a newer content export; refuse to pin a stale tag." >&2; \
		exit 1; \
	fi; \
	skew=$$((latest_mins - tag_mins)); \
	if [ "$$skew" -lt 0 ]; then skew=$$((-skew)); fi; \
	if [ "$$skew" -gt "$$max_skew_minutes" ]; then \
		echo "Resolved $$resolved is $${skew}m from content-latest publishedAt $$published_at (limit $${max_skew_minutes}m)." >&2; \
		echo "The top-20 release window likely missed a newer content export; refuse to pin a stale tag." >&2; \
		exit 1; \
	fi; \
	printf "%s\n" "$$resolved"'
endef

# Lets `make promote-content "description text"` pass the description as a
# plain quoted argument instead of `DESCRIPTION=`. Everything after the
# target name is rejoined into DESCRIPTION. .DEFAULT below is defined only
# for this invocation so those extra goals no-op without a global catch-all
# that would silence typos of real targets. An explicit `DESCRIPTION=...`
# on the command line still wins, since Make always prioritizes
# command-line variable assignments over ones set in the file.
ifeq (promote-content,$(firstword $(MAKECMDGOALS)))
  DESCRIPTION := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  .DEFAULT:
	@:
endif

# Fetches the latest Content export release from the backend repo and
# unpacks it into content/ and public/media/, wiping whatever was there
# before so removed/renamed assets don't linger.
restore-media:
	@set -euo pipefail; \
	tmp="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmp"' EXIT; \
	echo "Downloading '$(TAG)' release from $(REPO)..."; \
	gh release download $(TAG) --repo $(REPO) --pattern "release.zip" --dir "$$tmp"; \
	echo "Extracting..."; \
	unzip -q "$$tmp/release.zip" -d "$$tmp/extracted"; \
	echo "Wiping existing content and media..."; \
	rm -rf content public/media; \
	echo "Installing content.json and manifest.json..."; \
	mkdir -p content; \
	mv "$$tmp/extracted/content.json" content/content.json; \
	mv "$$tmp/extracted/manifest.json" content/manifest.json; \
	echo "Installing media assets..."; \
	mkdir -p public; \
	mv "$$tmp/extracted/media" public/media; \
	echo "Content export unpacked: content/{content,manifest}.json, public/media/"; \
	if [ "$(TAG)" = "content-latest" ]; then \
		resolved="$$($(RESOLVE_LATEST_TAG))"; \
		echo "$$resolved" > CONTENT_VERSION; \
		echo "CONTENT_VERSION set to $$resolved (what content-latest currently points at)"; \
	fi; \
	npm run validate-content

# Finds the newest versioned content export release (the backend tags them
# content-YYYYMMDD-HHMM, distinct from the content-latest alias) and kicks
# off promote-content.yml to open a PR pinning production to it.
#
# Mirrors sync's reporting: `gh workflow run` only fires the event and
# returns immediately, so we resolve the dispatched run's ID, stream its
# progress with `gh run watch`, and on failure dump the failed step's logs
# inline. On success we look up the PR the workflow opens (or its no-op
# close, if main already pinned the tag) so the target's own output states
# the outcome instead of leaving that to a follow-up `gh pr list`.
promote-content:
	@set -euo pipefail; \
	if [ -z "$(DESCRIPTION)" ]; then \
		echo 'Usage: make promote-content "what changed"' >&2; \
		exit 1; \
	fi; \
	tag="$$($(RESOLVE_LATEST_TAG))"; \
	echo "Promoting $$tag to production..."; \
	baseline_id="$$(gh run list --workflow=promote-content.yml -L 20 --json databaseId,headBranch \
		--jq '[.[] | select(.headBranch == "development")] | map(.databaseId) | max // 0')"; \
	gh workflow run promote-content.yml -f tag="$$tag" -f description="$(DESCRIPTION)"; \
	echo "Waiting for the run to register on GitHub..."; \
	run_id=""; \
	for attempt in $$(seq 1 10); do \
		sleep 2; \
		run_id="$$(gh run list --workflow=promote-content.yml -L 20 --json databaseId,event,headBranch \
			--jq "[.[] | select(.event == \"workflow_dispatch\" and .headBranch == \"development\" and .databaseId > $$baseline_id)] | first | .databaseId // empty")"; \
		if [ -n "$$run_id" ]; then break; fi; \
	done; \
	if [ -z "$$run_id" ]; then \
		echo "Could not find the dispatched run after 20s; check manually: gh run list --workflow=promote-content.yml" >&2; \
		exit 1; \
	fi; \
	url="https://github.com/$$(gh repo view --json nameWithOwner --jq .nameWithOwner)/actions/runs/$$run_id"; \
	echo "Watching run $$run_id: $$url"; \
	if ! gh run watch "$$run_id" --exit-status; then \
		echo "Promotion failed - logs for the failed step(s):" >&2; \
		gh run view "$$run_id" --log-failed || true; \
		echo "Full run: $$url" >&2; \
		exit 1; \
	fi; \
	branch="promote-content/$$tag"; \
	pr_number="$$(gh pr list --head "$$branch" --base main --state open --json number --jq '.[0].number // empty')"; \
	if [ -n "$$pr_number" ]; then \
		pr_url="$$(gh pr view "$$pr_number" --json url --jq .url)"; \
		echo "Promotion PR: $$pr_url"; \
	else \
		echo "Run succeeded; main already pinned $$tag (no PR opened or needed)."; \
	fi

# Manually triggers a staging deploy so a new content release (with no code
# change involved) shows up on stage.mserrano.dev without waiting for the
# next push to development. deploy.yml resolves content-latest itself.
#
# `gh workflow run` only fires the event and returns immediately, so on its
# own this target gives no signal the deploy actually happened. Instead we
# resolve the dispatched run's ID, stream its progress with `gh run watch`,
# and on failure dump the failed step's logs inline so the cause (content
# validation, build, Vercel deploy, GitHub Actions infra, ...) is visible
# without a manual `gh run view` round-trip.
sync:
	@set -euo pipefail; \
	echo "Triggering staging deploy (deploy.yml on development)..."; \
	baseline_id="$$(gh run list --workflow=deploy.yml -L 20 --json databaseId,headBranch \
		--jq '[.[] | select(.headBranch == "development")] | map(.databaseId) | max // 0')"; \
	gh workflow run deploy.yml --ref development; \
	echo "Waiting for the run to register on GitHub..."; \
	run_id=""; \
	for attempt in $$(seq 1 10); do \
		sleep 2; \
		run_id="$$(gh run list --workflow=deploy.yml -L 20 --json databaseId,event,headBranch \
			--jq "[.[] | select(.event == \"workflow_dispatch\" and .headBranch == \"development\" and .databaseId > $$baseline_id)] | first | .databaseId // empty")"; \
		if [ -n "$$run_id" ]; then break; fi; \
	done; \
	if [ -z "$$run_id" ]; then \
		echo "Could not find the dispatched run after 20s; check manually: gh run list --workflow=deploy.yml" >&2; \
		exit 1; \
	fi; \
	url="https://github.com/$$(gh repo view --json nameWithOwner --jq .nameWithOwner)/actions/runs/$$run_id"; \
	echo "Watching run $$run_id: $$url"; \
	if ! gh run watch "$$run_id" --exit-status; then \
		echo "Deploy failed - logs for the failed step(s):" >&2; \
		gh run view "$$run_id" --log-failed || true; \
		echo "Full run: $$url" >&2; \
		exit 1; \
	fi; \
	echo "Staging deploy succeeded: $$url"
