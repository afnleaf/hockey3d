#!/usr/bin/env bash
# Local serve: the relay on http://127.0.0.1:8790 serves the packed
# output/index.html at / and the data under /v1.
# --dev also serves the unpacked public/ on http://localhost:8000.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
relay_dir="$here/../nhl_record_relay"

cargo build --release --manifest-path "$relay_dir/Cargo.toml"
bun install --cwd "$here" --frozen-lockfile
bun "$here/build_icons.ts"
bun build "$here/three_global.js" --format iife --minify --outfile "$here/public/three.js"

export RELAY_ALLOWED_ORIGINS="${RELAY_ALLOWED_ORIGINS:-http://localhost:8000,null,https://chetgdp.github.io,https://afnleaf.github.io}"
export RELAY_CACHE_DIR="${RELAY_CACHE_DIR:-$relay_dir/cache}"
export RELAY_INDEX="${RELAY_INDEX:-$here/../output/index.html}"

if [[ "${1:-}" != "--dev" ]]; then
    echo "open http://127.0.0.1:8790"
    exec "$relay_dir/target/release/nhl_record_relay"
fi

"$relay_dir/target/release/nhl_record_relay" &
relay_pid=$!
trap 'kill "$relay_pid" 2>/dev/null' EXIT INT TERM

# no-store: a stale cached module next to fresh ones can blank the page.
python3 - "$here/public" <<'PY'
import functools, http.server, sys

class NoStore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

handler = functools.partial(NoStore, directory=sys.argv[1])
http.server.ThreadingHTTPServer(("127.0.0.1", 8000), handler).serve_forever()
PY
