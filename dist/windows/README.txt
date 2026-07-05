Transsion Tool - Windows Portable
===================================

Requirements:
  - Windows 10 or later
  - ADB and Fastboot installed (platform-tools from Google)
  - scrcpy (optional, for screen mirroring)

Setup:
  1. Install ADB and Fastboot:
     - Download platform-tools from: https://developer.android.com/studio/releases/platform-tools
     - Extract and add the folder to your PATH, or place adb.exe and fastboot.exe in this folder

  2. Run Transsion Tool:
     - Double-click transsion-tool.exe
     - The placebo.img file must be in the same folder as the exe

Usage:
  - Connect your Android device via USB with USB Debugging enabled
  - Use the sidebar to navigate between ADB, Fastboot, GSI Flash, and other tools
  - The console at the bottom shows real-time command output

Troubleshooting:
  - If ADB doesn't detect your device, install the proper USB drivers for your phone
  - For GSI flashing, the bundled placebo.img is used automatically
  - Make sure no other ADB server is running (run: adb kill-server)

License: MIT
