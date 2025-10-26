#!/usr/bin/env bash
# Build helper that packages a distributable release folder.
# Usage: npm run build:release
# This script expects `npm run build` has already run (or will be run before).

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

VERSION=$(node -e "console.log(require('./package.json').version)")
NAME="pulse-deck-$VERSION"
OUTDIR="$ROOT_DIR/release/$NAME"

echo "Creating release package at: $OUTDIR"

rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

# Copy runtime server files
cp server.js "$OUTDIR/"
cp package.json "$OUTDIR/"
cp -R public "$OUTDIR/" 2>/dev/null || true
cp .env.example "$OUTDIR/" 2>/dev/null || true

# Copy built frontend
if [ -d dist ]; then
  cp -R dist "$OUTDIR/"
else
  echo "Warning: dist/ not found. Did you run 'npm run build'?"
fi

# Copy start scripts
cp start_release.sh "$OUTDIR/" 2>/dev/null || true
cp start_release.bat "$OUTDIR/" 2>/dev/null || true
chmod +x "$OUTDIR/start_release.sh" 2>/dev/null || true

# Create a ZIP archive for convenience
cd "$ROOT_DIR/release"
ZIP_NAME="$NAME.zip"
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" "$NAME" > /dev/null || true

echo "Release package ready: release/$ZIP_NAME"

echo "Files included:"
ls -la "$OUTDIR" | sed -n '1,200p'

echo "Done."
