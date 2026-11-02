#!/usr/bin/env bash
# Builds ../output/index.html, a single file that works from file://.
# RELAY_BASE is baked in; a "#relay=URL" link overrides it per tab.
set -euo pipefail
cd "$(dirname "$0")"

relay_base="${RELAY_BASE:-http://127.0.0.1:8790}"
mkdir -p .pack ../output
bun build_icons.ts
bun build public/app.js --outfile .pack/bundle.js \
  --define "__RELAY_BASE__=\"$relay_base\""
histos histos.yaml -o ../output/index.html
