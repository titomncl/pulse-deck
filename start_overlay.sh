#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}  STREAM OVERLAY v2.0${NC}"
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

# Start the server
npm start

# Keep terminal open on error
read -p "Press Enter to exit..."
