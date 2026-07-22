.PHONY: restore-media

SHELL := /usr/bin/env bash

REPO := mmserran/mserrano.dev-web-services
TAG := content-latest

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
	echo "Content export unpacked: content/{content,manifest}.json, public/media/"
