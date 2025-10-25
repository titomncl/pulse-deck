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

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "First time setup detected!"
    echo "Installing dependencies... This may take a few minutes."
    echo ""
    npm install
    echo ""
    echo "Installation complete!"
    echo ""
fi

# Check if a production build is present; if not, run npx vite build
if [ ! -d "dist" ]; then
    echo "Build folder not found. Running 'npx vite build'..."
    npx vite build
    if [ $? -ne 0 ]; then
        echo "[ERROR] Build failed"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo "Build complete"
fi

# Start the server
npm start

# Keep terminal open on error
read -p "Press Enter to exit..."
