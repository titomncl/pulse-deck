#!/usr/bin/env bash
# Simple start script for release packages.
# - Copies .env.example -> .env if missing
# - Prints guidance to the user and starts the server

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Edit .env if you want to change settings before starting."
  else
    echo "Warning: .env.example not found. Creating empty .env"
    touch .env
  fi
fi

echo "Starting Pulse Deck (release)..."
# Use node (assumes Node >=14 is installed). For packaged binaries you may replace this.
node server.js
