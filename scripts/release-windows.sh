#!/bin/bash
# Full Windows release build
set -e

cd "$(dirname "$0")/.."

echo "==> Building frontend"
npm install
npm run build

echo "==> Building Windows binary + installer"
cd src-tauri
cargo tauri build --target x86_64-pc-windows-gnu

echo ""
echo "=== Release complete ==="
echo "Installer: target/x86_64-pc-windows-gnu/release/bundle/nsis/Transsion Tool*.exe"
echo "Portable:  target/x86_64-pc-windows-gnu/release/transsion-tool.exe"
echo ""
echo "The NSIS installer includes WebView2 bootstrapper."
echo "For running the exe directly, use the run.bat script from the dist/windows/ folder."
