#!/usr/bin/env bash
# Build Vamos in Release mode and install the AU plugin for macOS.
# Usage: ./scripts/install-au-plugin.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_TYPE="Release"
BUILD_DIR="$PROJECT_DIR/build/$BUILD_TYPE"
AU_SRC="$BUILD_DIR/Vamos_artefacts/Release/AU/Vamos.component"
AU_DST="$HOME/Library/Audio/Plug-Ins/Components"

echo "=== Vamos AU Plugin Install ==="
echo "  Project: $PROJECT_DIR"
echo "  Build:   $BUILD_DIR"
echo ""

# Configure (only if needed)
if [ ! -f "$BUILD_DIR/CMakeCache.txt" ]; then
    echo "--- Configuring CMake ---"
    cmake -S "$PROJECT_DIR" -B "$BUILD_DIR" \
        -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
        -DCMAKE_OSX_ARCHITECTURES="$(uname -m)"
fi

# Build
echo "--- Building (Release) ---"
cmake --build "$BUILD_DIR" --config "$BUILD_TYPE" -j "$(sysctl -n hw.ncpu 2>/dev/null || nproc)"

# Verify the AU bundle exists
if [ ! -d "$AU_SRC" ]; then
    echo "ERROR: AU plugin not found at $AU_SRC"
    echo "  Available build artifacts:"
    find "$BUILD_DIR/Vamos_artefacts" -name "*.component" 2>/dev/null || true
    exit 1
fi

# Install
echo "--- Installing AU Plugin ---"
mkdir -p "$AU_DST"
cp -R "$AU_SRC" "$AU_DST/"
echo "  Copied to $AU_DST/Vamos.component"

# Force macOS to re-scan audio plugins
echo "--- Refreshing Audio Plugin Cache ---"
killall -9 AudioComponentRegistrar 2>/dev/null || true

echo ""
echo "=== Vamos AU plugin installed ==="
echo "  (Re)launch GarageBand or your DAW to pick up the plugin."
echo "  To verify: auval -a | grep -i vamos"
