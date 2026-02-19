#!/usr/bin/env bash
# Build and run Vamos as a standalone synth application.
# Usage: ./scripts/dev.sh [--release] [--test]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_TYPE="Debug"
RUN_TESTS=false

for arg in "$@"; do
    case "$arg" in
        --release) BUILD_TYPE="Release" ;;
        --test)    RUN_TESTS=true ;;
    esac
done

BUILD_DIR="$PROJECT_DIR/build/$BUILD_TYPE"

echo "=== Vamos Build ==="
echo "  Project: $PROJECT_DIR"
echo "  Build:   $BUILD_DIR"
echo "  Type:    $BUILD_TYPE"
echo ""

# Configure (only if needed)
if [ ! -f "$BUILD_DIR/CMakeCache.txt" ]; then
    echo "--- Configuring CMake ---"
    cmake -S "$PROJECT_DIR" -B "$BUILD_DIR" \
        -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
        -DCMAKE_OSX_ARCHITECTURES="$(uname -m)"
fi

if $RUN_TESTS; then
    # Build and run tests
    echo "--- Building Tests ---"
    cmake --build "$BUILD_DIR" --config "$BUILD_TYPE" --target VamosTests -j "$(sysctl -n hw.ncpu 2>/dev/null || nproc)"

    echo ""
    echo "--- Running DSP Tests ---"
    "$BUILD_DIR/tests/VamosTests"

    echo ""
    echo "--- Building Plugin Tests ---"
    cmake --build "$BUILD_DIR" --config "$BUILD_TYPE" --target VamosPluginTests -j "$(sysctl -n hw.ncpu 2>/dev/null || nproc)"

    echo ""
    echo "--- Running Plugin Tests ---"
    "$BUILD_DIR/tests/VamosPluginTests"

    echo ""
    echo "=== All tests passed ==="
    exit 0
fi

# Build
echo "--- Building ---"
cmake --build "$BUILD_DIR" --config "$BUILD_TYPE" -j "$(sysctl -n hw.ncpu 2>/dev/null || nproc)"

# Find and run the standalone app
echo ""
echo "--- Running Standalone ---"
APP=$(find "$BUILD_DIR" -name "Vamos.app" -path "*/Standalone/*" | head -1)
if [ -z "$APP" ]; then
    # Fallback: look for any Vamos standalone binary
    APP=$(find "$BUILD_DIR" -name "Vamos" -type f -perm +111 -path "*Standalone*" | head -1)
fi

if [ -n "$APP" ]; then
    echo "  Launching: $APP"
    open "$APP" 2>/dev/null || "$APP"
else
    echo "ERROR: Could not find Vamos standalone binary."
    echo "  Available build artifacts:"
    find "$BUILD_DIR" -name "Vamos*" -type f 2>/dev/null | head -10
    exit 1
fi
