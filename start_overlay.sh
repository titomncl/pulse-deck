#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}  STREAM OVERLAY v0.3.0${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "Starting server..."
echo ""
echo "Keep this terminal open while streaming!"
echo ""
echo "Customize page will open automatically..."
echo ""
echo -e "${BLUE}================================${NC}"
echo ""

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

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
        read -p "Press Enter to exit..."
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

# ── 3. Install dependencies if needed ───────────────────────────────────────
if [ ! -d "node_modules" ]; then
    echo "First time setup detected!"
    echo "Installing dependencies... This may take a few minutes."
    echo ""
    npm install
    echo ""
    echo "Installation complete!"
    echo ""
fi

# ── 4. Build if needed ───────────────────────────────────────────────────────
if [ ! -d "dist" ] || [ "$NEED_BUILD" = true ]; then
    echo ""
    echo "Building frontend (this bakes the Client ID into the bundle)..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "[ERROR] Build failed"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo "✅ Build complete"
fi

# ── 5. Start server ──────────────────────────────────────────────────────────
npm start

# Keep terminal open on error
read -p "Press Enter to exit..."
