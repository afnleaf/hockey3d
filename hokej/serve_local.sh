#!/usr/bin/env bash
# Local dev: relay on 127.0.0.1:8790, page on http://localhost:8000.
# Open http://localhost:8000 (not 127.0.0.1): the relay allows only that origin.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
relay_dir="$here/../nhl_record_relay"

cargo build --release --manifest-path "$relay_dir/Cargo.toml"

export RELAY_ALLOWED_ORIGIN="http://localhost:8000"
export RELAY_CACHE_DIR="${RELAY_CACHE_DIR:-$relay_dir/cache}"
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
