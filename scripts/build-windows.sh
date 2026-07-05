#!/bin/bash
# Build Transsion Tool for Windows
# Requires: rustup target add x86_64-pc-windows-gnu
# Requires: mingw-w64-gcc (sudo pacman -S mingw-w64-gcc)
set -e

cd "$(dirname "$0")/.."

echo "==> Installing Windows target (if not already installed)"
rustup target add x86_64-pc-windows-gnu 2>/dev/null || true

echo "==> Building frontend"
npm install
npm run build

echo "==> Building Windows binary"
cd src-tauri
cargo build --release --target x86_64-pc-windows-gnu

echo ""
echo "=== Build complete ==="
echo "Binary: src-tauri/target/x86_64-pc-windows-gnu/release/transsion-tool.exe"
echo ""
echo "To create a portable folder:"
echo "  1. Copy transsion-tool.exe to a new folder"
echo "  2. Copy src-tauri/resources/placebo.img alongside it"
echo "  3. The app will find placebo.img automatically"
