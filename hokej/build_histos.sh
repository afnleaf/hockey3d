#!/usr/bin/env bash
# Full histos build: pack, verify, and with --publish copy to both Pages repos.
# Never commits or pushes.
set -euo pipefail
cd "$(dirname "$0")"

relay_base="${RELAY_BASE-https://hokej-relay.stezup.dev}"
out=../output/index.html
pages=(../../afnleaf.github.io ../../chetgdp.github.io)

publish=0
for arg in "$@"; do
  case "$arg" in
    --publish) publish=1 ;;
    *) echo "usage: $0 [--publish]" >&2; exit 2 ;;
  esac
done

# Dev server loads public/three.js; keep it in step with the packed copy.
bun install --frozen-lockfile
bun build three_global.js --format iife --minify --outfile public/three.js
RELAY_BASE="$relay_base" ./pack.sh

size=$(wc -c < "$out")
fail() { echo "check failed: $1" >&2; exit 1; }
(( size > 500000 )) || fail "$out is $size bytes, three.js likely missing"
! grep -q jsdelivr "$out" || fail "CDN reference in $out"
if [[ -n "$relay_base" ]]; then
  grep -qF "$relay_base" "$out" || fail "relay base $relay_base not baked in"
fi
echo "built $out ($size bytes, relay ${relay_base:-same-origin})"

if (( publish )); then
  for repo in "${pages[@]}"; do
    [[ -d "$repo/.git" ]] || fail "$repo is not a git repo"
    cp "$out" "$repo/hokej.html"
    echo "copied to $(cd "$repo" && pwd)/hokej.html"
  done
fi
