#!/usr/bin/env bash
# Builds ../output/index.html, a single file that works from file://.
# RELAY_BASE is baked in; a "#relay=URL" link overrides it per tab.
set -euo pipefail
cd "$(dirname "$0")"

# Empty means same origin as the page (relay serves it), or 127.0.0.1:8790 from file://.
relay_base="${RELAY_BASE:-}"
mkdir -p .pack ../output
bun build_icons.ts
bun build public/app.js --outfile .pack/bundle.js \
  --define "__RELAY_BASE__=\"$relay_base\""
histos histos.yaml -o ../output/index.html
