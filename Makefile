.PHONY: restore-media promote-content

SHELL := /usr/bin/env bash

REPO := mmserran/mserrano.dev-web-services
TAG ?= content-latest

# The backend tags real, dated exports content-YYYYMMDD-HHMM and separately
# republishes the content-latest alias to match the newest one, so the
# newest dated tag is what content-latest currently points at. -L 20 gives
# headroom past the handful of most-recent content exports we'd ever need,
# since the release list is shared with interleaved uploads-backup releases.
RESOLVE_LATEST_TAG = gh release list --repo $(REPO) -L 20 \
	| grep -oE 'content-[0-9]{8}-[0-9]{4}' | sort -r | head -1

# Lets `make promote-content "description text"` pass the description as a
# plain quoted argument instead of `DESCRIPTION=`. Everything after the
# target name is rejoined into DESCRIPTION; the trailing %: rule below stops
# Make from trying (and failing) to build a file with that name. An explicit
# `DESCRIPTION=...` on the command line still wins, since Make always
# prioritizes command-line variable assignments over ones set in the file.
ifeq (promote-content,$(firstword $(MAKECMDGOALS)))
  DESCRIPTION := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
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
		if [ -n "$$resolved" ]; then \
			echo "$$resolved" > CONTENT_VERSION; \
			echo "CONTENT_VERSION set to $$resolved (what content-latest currently points at)"; \
		fi; \
	fi

# Finds the newest versioned content export release (the backend tags them
# content-YYYYMMDD-HHMM, distinct from the content-latest alias) and kicks
# off promote-content.yml to open a PR pinning production to it.
promote-content:
	@set -euo pipefail; \
	if [ -z "$(DESCRIPTION)" ]; then \
		echo 'Usage: make promote-content "what changed"' >&2; \
		exit 1; \
	fi; \
	tag="$$($(RESOLVE_LATEST_TAG))"; \
	if [ -z "$$tag" ]; then \
		echo "No versioned content release found in $(REPO)" >&2; \
		exit 1; \
	fi; \
	echo "Promoting $$tag to production..."; \
	gh workflow run promote-content.yml -f tag="$$tag" -f description="$(DESCRIPTION)"

# Catches the extra command-line goal(s) that make promote-content "..."
# produces (Make treats the quoted description as another target to build)
# and no-ops them instead of failing with "No rule to make target".
%:
	@:
