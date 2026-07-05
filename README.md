# Transsion Tool

A desktop utility for servicing Transsion Android devices (Tecno, Infinix, Itel).

## Features

- Real-time device detection (ADB, Recovery, Sideload, Bootloader, Fastbootd)
- Transsion device profile with OEM-specific warnings and commands
- ADB operations: push, pull, install, sideload, shell, reboot, scrcpy
- Fastboot operations: flash, erase, slot switch, vbmeta disable, unlock
- GSI flash workflow with bundled placebo
- Root manager downloads (Magisk, APatch, KernelSU)
- App manager with debloat presets
- Customizable theme with Monet color engine

## Dependencies

**Arch Linux:**
```bash
sudo pacman -S android-tools scrcpy
```

**Windows:**
- [Platform Tools](https://developer.android.com/studio/releases/platform-tools) (ADB + Fastboot)
- [Microsoft Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- [Rust](https://rustup.rs/)

## Build from source

**Linux:**
```bash
cd transsion-tool
npm install
npm run tauri build
```

**Windows (cross-compile from Linux):**
```bash
sudo pacman -S mingw-w64-gcc
rustup target add x86_64-pc-windows-gnu
cd transsion-tool
npm install
npm run build
cd src-tauri
cargo build --release --target x86_64-pc-windows-gnu
# Binary: src-tauri/target/x86_64-pc-windows-gnu/release/transsion-tool.exe
```

**Windows (native):**
```powershell
.\scripts\build-windows.ps1
```

## Development

```bash
npm install
npm run dev        # web UI only
npm run tauri dev  # full desktop app
```

## Pre-built Windows binary

Download the latest `dist/windows/` folder from the repo:
- `transsion-tool.exe` — the app
- `placebo.img` — required for GSI flashing (kept alongside the exe)
- `README.txt` — setup instructions

## Important warnings

- Always disable vbmeta verification before flashing GSIs.
- Unlocking the bootloader wipes all data.

## License

MIT
