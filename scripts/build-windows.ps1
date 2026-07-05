# Build Transsion Tool for Windows
# Requires: Rust, Node.js, and Visual Studio Build Tools

Write-Host "==> Building frontend" -ForegroundColor Green
npm install
npm run build

Write-Host "==> Building Windows binary" -ForegroundColor Green
cd src-tauri
cargo build --release

Write-Host ""
Write-Host "=== Build complete ===" -ForegroundColor Green
Write-Host "Binary: src-tauri/target/release/transsion-tool.exe"
Write-Host ""
Write-Host "To create a portable folder:" -ForegroundColor Yellow
Write-Host "  1. Copy transsion-tool.exe to a new folder"
Write-Host "  2. Copy src-tauri/resources/placebo.img alongside it"
Write-Host "  3. Run transsion-tool.exe"
