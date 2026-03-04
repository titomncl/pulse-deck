#!/usr/bin/env bash
# Simple start script for release packages.
# - Copies .env.example -> .env if missing
# - Prompts for Twitch Client ID if not already set
# - Rebuilds the frontend so the Client ID is baked in
# - Starts the server

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── 1. Ensure .env exists ────────────────────────────────────────────────────
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example."
  else
    echo "Warning: .env.example not found. Creating empty .env"
    touch .env
  fi
fi

# ── 2. Prompt for Twitch Client ID if missing ────────────────────────────────
NEED_BUILD=false
CURRENT_CLIENT_ID=$(grep -E '^VITE_TWITCH_CLIENT_ID=' .env | cut -d'=' -f2- | tr -d '[:space:]')

if [ -z "$CURRENT_CLIENT_ID" ]; then
  echo ""
  echo "┌─────────────────────────────────────────────┐"
  echo "│  Twitch Client ID not found in .env         │"
  echo "│                                             │"
  echo "│  1. Go to https://dev.twitch.tv/console     │"
  echo "│  2. Register or open your application       │"
  echo "│  3. Copy the Client ID shown on the page    │"
  echo "└─────────────────────────────────────────────┘"
  echo ""
  read -r -p "Enter your Twitch Client ID: " INPUT_CLIENT_ID
  INPUT_CLIENT_ID="$(echo "$INPUT_CLIENT_ID" | tr -d '[:space:]')"

  if [ -z "$INPUT_CLIENT_ID" ]; then
    echo "[ERROR] No Client ID entered. Aborting."
    exit 1
  fi

  # Append or update the key in .env
  if grep -qE '^VITE_TWITCH_CLIENT_ID=' .env; then
    sed -i "s|^VITE_TWITCH_CLIENT_ID=.*|VITE_TWITCH_CLIENT_ID=${INPUT_CLIENT_ID}|" .env
  else
    echo "VITE_TWITCH_CLIENT_ID=${INPUT_CLIENT_ID}" >> .env
  fi
  echo "✅ Client ID saved to .env"
  NEED_BUILD=true
else
  echo "✅ Twitch Client ID found in .env"
fi

# ── 3. Build if needed ───────────────────────────────────────────────────────
if [ ! -d dist ] || [ "$NEED_BUILD" = true ]; then
  echo ""
  echo "Building frontend (this bakes the Client ID into the bundle)..."
  npm run build
  echo "✅ Build complete"
fi

# ── 4. Start server ──────────────────────────────────────────────────────────
echo ""
echo "Starting Pulse Deck (release)..."
node server.js
