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

## Dependencies (Arch Linux)

```bash
sudo pacman -S android-tools scrcpy p7zip
```

## Build from source

```bash
cd transsion-tool
npm install
npm run tauri build
```

## Development

```bash
npm install
npm run tauri dev
```

## Important warnings

- Always disable vbmeta verification before flashing GSIs.
- Unlocking the bootloader wipes all data.

## License

MIT
